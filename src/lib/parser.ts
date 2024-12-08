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

import memize from "memize";

/* -------------------------------------------------- *
 * Types                                              *
 * -------------------------------------------------- */

/** Recursively makes all properties in T readonly. */
export type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

/** Recursively makes all properties in T writable. */
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

/** Represents the status of a task. */
export type TaskStatus = keyof typeof taskStatuses;

/** Different types of tokens that can be found in an item. */
export type TokenType =
  | "headingMarker"
  | "status"
  | "dueDate"
  | "tag"
  | "link"
  | "text";

/** Represents a token in an item. */
export type Token = {
  type: TokenType;
  value: string; // e.g. `tag`
  raw: string; // e.g. `#tag`
  matchStart: number;
};

/**
 * Represents a parsed item. "Item" is the generic type for anything that can
 * be included in a list, such as a task, note, or section heading.
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
 * be included in a list, such as a task, note, or section heading.
 *
 * Note that in a regular item, all properties are readonly. This is because
 * some depend on each other (e.g. status is parsed from raw, and also leads
 * to the presence of a "status" token), and changing them individually might
 * result in inconsistent data within the item.
 *
 * Check out `items.ts@asWritable` to learn how to safely mutate items.
 */
export type Item = DeepReadonly<UncheckedItem>;

/* -------------------------------------------------- *
 * Regexes                                            *
 * -------------------------------------------------- */

// Singular means only one of these can be matched per line. Plural means
// multiple matches can be found per line.
const regexes = {
  // Section headings
  headingMarker: /^(?<headingMarker># )/,
  // Task status
  status: new RegExp(
    `(?<=^[^\\S\\n]*)\\[(?<status>[${statusChars.join("")}])\\]`
  ),
  // Due date
  dueDate: /@(?<dueDate>\d{4}-\d{2}-\d{2})/,
  // Tags
  tags: /#(?<tag>\w+)/g,
  // Links
  links: /(?<url>https?:\/\/\S+)/g,
} as const;

const mergedRegex = new RegExp(
  Object.values(regexes)
    .map((i) => `(${i.source})`)
    .join("|"),
  "gm"
);

/* -------------------------------------------------- *
 * Utilities                                          *
 * -------------------------------------------------- */

/**
 * Converts a status character to a TaskStatus. If the character is not a valid
 * status, 'incomplete' is returned as a fallback. If the `strict` parameter is
 * set to true, an error is thrown instead.
 */
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

/* -------------------------------------------------- *
 * Parser                                             *
 * -------------------------------------------------- */

/** Parses a single item from the specified input. */
export function parse(input: string): Item {
  let type: UncheckedItem["type"] = "note";
  let tags: Set<Item["tags"][number]> = new Set();
  let dueDate: UncheckedItem["dueDate"] = undefined;
  let status: TaskStatus = "incomplete";
  let tokens: Token[] = [];

  let match = null;
  let cursor = 0;

  while ((match = mergedRegex.exec(input))) {
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

/** Globally memoized version of the individual item parser. */
export const parseWithMemo = memize(parse);

/* -------------------------------------------------- *
 * Stringifier                                        *
 * -------------------------------------------------- */

export function stringify({ tokens }: Pick<Item, "tokens">): string {
  return tokens.map((i) => i.raw).join("");
}
