/**
 * This is the parser for the converting a string into a task. The format for
 * tasks is loosely based on the Bullet Journal notation, and is defined as
 * follows:
 *
 * Lines that start with a single character enclosed in square brackets are
 * tasks. The character inside the brackets defines the status of the task.
 * The following statuses are supported:
 *
 * [ ] Incomplete task
 * [x] Completed
 * [/] In progress
 * [*] Important
 * [-] Note
 * [?] Question
 *
 * The text after the brackets is the text of the task. Lines can also start
 * with whitespace, which is ignored (but can be used for indentation). The
 * text of the task can contain tags and a due date:
 *
 * - Tags: #tag1 #tag2 (tags can be any letter, number, or underscore)
 * - Due date: @2021-01-01
 *
 * Besides tasks, lists can also contain notes and sections. Sections are started
 * by headings, which are lines that start with a single #.
 *
 * Everything else is considered a note. Notes have no special syntax or meaning,
 * but are used to add additional information to a task. They are also allowed
 * to contain tags and due dates.
 */

// Types --------------------------------------------------

export type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

export type DeepWritable<T> = {
  -readonly [K in keyof T]: DeepWritable<T[K]>;
};

export const taskStatuses = {
  incomplete: " ",
  completed: "x",
  inProgress: "/",
  important: "*",
  question: "?",
} as const;

const statusChars = Object.values(taskStatuses);

export type TaskStatus = keyof typeof taskStatuses;

export type TokenType =
  | "headingMarker"
  | "status"
  | "dueDate"
  | "tag"
  | "link"
  | "text";

export type Token = {
  type: TokenType;
  value: string; // e.g. `tag`
  raw: string; // e.g. `#tag`
  matchStart: number;
};

/**
 * Represents a parsed item. "Item" is the generic type for anything that can
 * be included on a page, such as a task, note, or section heading.
 *
 * Unchecked items allow changing any property in any way you want. Note that
 * since properties depend on each other (e.g. status is parsed from raw, and
 * also leads to the presence of a "status" token), changing them individually
 * might result in inconsistent data within the item.
 */
export type UncheckedItem = {
  raw: string;
  tokens: Token[];
  tags: string[];
  dueDate?: Date;
} & (
  | { type: "note" | "heading"; status: null }
  | { type: "task"; status: TaskStatus }
);

/**
 * Represents a parsed item. "Item" is the generic type for anything that can
 * be included on a page, such as a task, note, or section heading.
 *
 * Note that in a regular item, all properties are readonly. This is because
 * some depend on each other (e.g. status is parsed from raw, and also leads
 * to the presence of a "status" token), and changing them individually might
 * result in inconsistent data within the item.
 *
 * Check out `items.ts@asWritable` to learn how to safely mutate items.
 */
export type Item = DeepReadonly<UncheckedItem>;

// Utilities ----------------------------------------------

const taskExpr = {
  // Headings
  headingMarker: /^(?<headingMarker># )/,

  // Due dates
  dueDate: /@(?<dueDate>\d{4}-\d{2}-\d{2})/,

  // Tags
  tags: /#(?<tag>\w+)/,

  // Links
  links: /(?<url>https?:\/\/\S+)/,

  // Statuses
  status: new RegExp(
    `(?<=^[^\\S\\n]*)\\[(?<status>[${statusChars.join("")}])\\]`
  ),
} as const;

function mergeExpression(...sources: Array<Record<string, RegExp>>): RegExp {
  const raw = sources
    .flatMap((i) => Object.values(i))
    .map((i) => `(${i.source})`)
    .join("|");

  return new RegExp(raw, "gm");
}

function getAutoLinkExpressions(rules: AutoLinkRule[]): Record<string, RegExp> {
  return rules.reduce<Record<string, RegExp>>((all, current, i) => {
    all[`autolink_${i}`] = new RegExp(`(?<autolink_${i}>${current.pattern})`);
    return all;
  }, {});
}

function matchAutolink(
  groups: RegExpExecArray["groups"],
  rules: AutoLinkRule[] | undefined
): {
  groupName: string;
  url: string;
} | null {
  if (!groups || !rules) return null;

  const groupName = Object.entries(groups ?? {}).find(
    ([k, v]) => k.startsWith("autolink_") && !!v
  )?.[0];

  if (!groupName) return null;

  const index = Number(groupName.replace("autolink_", ""));

  const url = groups[groupName].replace(
    new RegExp(rules[index].pattern),
    rules[index].target
  );

  return { groupName, url };
}

function toStatus(status: string, strict = false): TaskStatus {
  let result: TaskStatus = "incomplete";

  switch (status) {
    case taskStatuses.completed:
      result = "completed";
      break;
    case taskStatuses.inProgress:
      result = "inProgress";
      break;
    case taskStatuses.important:
      result = "important";
      break;
    case taskStatuses.question:
      result = "question";
      break;
    default:
      if (strict) throw new Error(`Invalid status: ${status}`);
      break;
  }

  return result;
}

// Parser -------------------------------------------------

export type AutoLinkRule = {
  pattern: string;
  target: string;
};

export type ParserOpts = {
  autoLinkRules?: AutoLinkRule[];
};

/** Parses a single item from the specified input. */
export function parse(input: string, opts?: ParserOpts): Item {
  let type: UncheckedItem["type"] = "note";
  let tags: Set<Item["tags"][number]> = new Set();
  let dueDate: UncheckedItem["dueDate"] = undefined;
  let status: TaskStatus = "incomplete";
  let tokens: Token[] = [];

  let match = null;
  let cursor = 0;

  const mergedExpression = mergeExpression(
    taskExpr,
    opts?.autoLinkRules ? getAutoLinkExpressions(opts.autoLinkRules) : {}
  );

  while ((match = mergedExpression.exec(input))) {
    // If there is plain text before of between tokens, insert it as a
    // plain text token
    if (match.index > cursor) {
      const text = input.slice(cursor, match.index);
      tokens.push({ type: "text", value: text, raw: text, matchStart: cursor });
      cursor += text.length;
    }

    const token: Token = {
      type: "text",
      value: match[0],
      raw: match[0],
      matchStart: match.index,
    };

    let autolink;

    if (match.groups?.headingMarker) {
      // Section heading
      type = "heading";
      token.type = "headingMarker";
      token.value = match.groups?.headingMarker;
    } else if (match.groups?.status) {
      // Tasks, so we'll also need to check for the status
      type = "task";
      status = toStatus(match.groups.status);
      token.type = "status";
      token.value = match.groups.status;
    } else if (match.groups?.dueDate && !dueDate) {
      // Due date
      const maybeDueDate = new Date(match.groups.dueDate);
      if (!Number.isNaN(maybeDueDate.getTime())) {
        dueDate = maybeDueDate;
        token.type = "dueDate";
        token.value = match.groups.dueDate;
      }
    } else if (match.groups?.tag) {
      // Tags
      tags.add(match.groups.tag);
      token.type = "tag";
      token.value = match.groups.tag;
    } else if (match.groups?.url) {
      // Links
      token.type = "link";
      token.value = match.groups.url;
    } else if ((autolink = matchAutolink(match.groups, opts?.autoLinkRules))) {
      // Autolink
      token.type = "link";
      token.raw = match.groups![autolink.groupName];
      token.value = autolink.url;
    }

    tokens.push(token);
    cursor += match[0].length;
  }

  // Append any text after the last token as a plain text token, too
  if (cursor < input.length) {
    const text = input.slice(cursor);
    tokens.push({ type: "text", value: text, raw: text, matchStart: cursor });
  }

  // @ts-expect-error Complains about the missing status, we'll add that below
  const result: UncheckedItem = {
    type,
    raw: input,
    tokens,
    tags: Array.from(tags),
    dueDate,
  };

  if (result.type === "task") result.status = status;
  else result.status = null;

  return result as Item;
}

// Stringifier --------------------------------------------

export function stringify({ tokens }: Pick<Item, "tokens">): string {
  return tokens.map((i) => i.raw).join("");
}
