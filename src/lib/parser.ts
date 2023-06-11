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
 * - Tags: #tag1 #tag2 (tags can be any string that does not contain a space)
 * - Due date: ->2021-01-01
 *
 * Besides tasks, lists can also contain notes and sections. Sections are started
 * by headings, which are lines that start with a single #.
 *
 * Everything else is considered a note. Notes have no special syntax or meaning,
 * but are used to add additional information to a task. They are also allowed
 * to contain tags and due dates.
 */

/* -------------------------------------------------- *
 * Types                                              *
 * -------------------------------------------------- */

/** Represents the status of a task. */
export type TaskStatus =
  | "incomplete"
  | "completed"
  | "inProgress"
  | "important"
  | "question";

/** Different types of tokens that can be found in an item. */
export type TokenType = "headingMarker" | "status" | "dueDate" | "tag" | "text";

/** Represents a token in an item. */
export type Token = {
  type: TokenType;
  text: string;

  match: string;
  matchStart: number;
  matchLength: number;
};

/**
 * Represents a parsed item. "Item" is the generic type for anything that can
 * be included in a list, such as a task, note, or section heading.
 */
export type Item = {
  raw: string;
  text: string;
  tokens: Token[];

  tags: string[];
  dueDate?: Date;
} & ({ type: "note" | "heading" } | { type: "task"; status: TaskStatus });

/* -------------------------------------------------- *
 * Regexes                                            *
 * -------------------------------------------------- */

const regexes = {
  // Section headings
  heading: /^# /,
  // Task status
  status: /^ *\[(?<status>[ x/*?])\]/,
  // Due date
  dueDate: /->(?<dueDate>\d{4}-\d{2}-\d{2})/,
  // Tags
  tags: /#(?<tag>[^\s]+)/g,
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
    case "x":
      result = "completed";
      break;
    case "/":
      result = "inProgress";
      break;
    case "*":
      result = "important";
      break;
    case "?":
      result = "question";
      break;
    default:
      if (strict) throw new Error(`Invalid status: ${status}`);
      break;
  }

  return result;
}

/**
 * Returns a copy of the given array of tokens, sorted by their occurrence in
 * the original string (i.e. the `matchStart` property).
 */
function sortTokens(tokens: Token[]): Token[] {
  return [...tokens].sort((a, b) => a.matchStart - b.matchStart);
}

/**
 * For a given string and an array of tokens that occur in that string, this
 * function fills the gaps between those previously found tokens with the text
 * that was skipped. This is necessary because the regexes used to find the
 * tokens don't match the entire string, but only the parts that are relevant
 * to the token type. To reconstruct the original string, we need to fill in
 * the gaps between the tokens.
 */
function insertTextTokens(original: string, tokens: Token[]): Token[] {
  // If there are no tokens, the entire string is a text token, so we return
  // that and exit early.
  if (tokens.length === 0) {
    return [
      {
        type: "text",
        text: original,
        match: original,
        matchStart: 0,
        matchLength: original.length,
      },
    ];
  }

  const sortedTokens = sortTokens(tokens);
  let result: Token[] = [];
  let cursor = 0;
  let buffer = "";
  let nextToken = sortedTokens.shift();

  while (cursor < original.length) {
    // If there is no next token, we push the rest of the string as a text
    // token and we're done.
    if (!nextToken) {
      buffer = original.slice(cursor);
      result.push({
        type: "text",
        text: buffer,
        match: buffer,
        matchStart: cursor,
        matchLength: buffer.length,
      });

      break;
    }

    // If the cursor is at the start of the next token, we first flush the
    // buffer by adding it as a text token, then push the next token to the
    // result and move the cursor to the end of the token. We can then take
    // a new token from the queue.
    else if (cursor === nextToken.matchStart) {
      if (buffer.length > 0) {
        result.push({
          type: "text",
          text: buffer,
          match: buffer,
          matchStart: cursor - buffer.length,
          matchLength: buffer.length,
        });
        buffer = "";
      }

      result.push(nextToken);
      cursor += nextToken.matchLength;
      nextToken = sortedTokens.shift();
    }

    // If the cursor doesn't currently point to a token, we push the current
    // character to the buffer and move the cursor forward.
    else {
      buffer += original[cursor];
      cursor++;
    }
  }

  return result;
}

/* -------------------------------------------------- *
 * Parser                                             *
 * -------------------------------------------------- */

export function parse(input: string): Item {
  let token = null;

  let type: Item["type"] = "note";
  let text = input;
  let tags: Set<Item["tags"][number]> = new Set();
  let dueDate: Item["dueDate"] = undefined;
  let status: TaskStatus = "incomplete";
  let tokens: Token[] = [];

  while ((token = mergedRegex.exec(input))) {
    const tokenDescriptor: Token = {
      type: "headingMarker",
      text: token[0],

      match: token[0],
      matchStart: token.index,
      matchLength: token[0].length,
    };

    if (token[1]) {
      // This is a section heading (but it doesn't have a named group in the
      // regex, so we check for the group index instead).
      type = "heading";
      text = input.replace(regexes.heading, "");
      tokenDescriptor.type = "headingMarker";
      tokenDescriptor.text = token[1];
    } else if (token.groups?.status) {
      // Tasks, so we'll also need to check for the status
      type = "task";
      text = input.replace(regexes.status, "");
      status = toStatus(token.groups.status);
      tokenDescriptor.type = "status";
      tokenDescriptor.text = token.groups.status;
    } else if (token.groups?.dueDate && !dueDate) {
      // Due date
      // TODO: Handle invalid dates
      dueDate = new Date(token.groups.dueDate);
      tokenDescriptor.type = "dueDate";
      tokenDescriptor.text = token.groups.dueDate;
    } else if (token.groups?.tag) {
      // Tags
      tags.add(token.groups.tag);
      tokenDescriptor.type = "tag";
      tokenDescriptor.text = token.groups.tag;
    }

    tokens.push(tokenDescriptor);
  }

  tokens = insertTextTokens(input, tokens);

  // @ts-expect-error Complains about the missing status, but we'll add it later
  // if needed.
  const result: Item = {
    type,
    raw: input,
    text,
    tokens,
    tags: Array.from(tags),
    dueDate,
  };

  if (result.type === "task") result.status = status;

  return result;
}

/**
 * Parses a string that contains a list of tasks. If the input is an array, it
 * parses each element of the array. Otherwise, it splits the string by newlines
 * and parses each line.
 */
export function parseList(input: string | string[]): Item[] {
  const inputArray = Array.isArray(input) ? input : input.split("\n");
  return inputArray.map((i) => parse(i));
}
