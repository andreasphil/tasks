/* -------------------------------------------------- *
 * Utilities                                          *
 * -------------------------------------------------- */

/** Splits a string into a list of lines. */
export function splitLines(text: string): string[] {
  return text.split("\n");
}

/** Joins a list of lines into a single string. */
export function joinLines(lines: string[]): string {
  return lines.join("\n");
}

/** Splits a string in two at the specified index. */
export function splitAt(text: string, index: number): [string, string] {
  return [text.slice(0, index), text.slice(index)];
}

/* -------------------------------------------------- *
 * Selection and cursor position                      *
 * -------------------------------------------------- */

/**
 * For a selection beginning at `from` and ending at `to`, returns the line
 * numbers of the first and last selected line.
 *
 * TODO: Only accept string values
 *
 * @param from The start of the selection
 * @param to The end of the selection
 * @param value The value containing the selection
 */
export function getSelectedLines(
  value: string | string[],
  from: number,
  to = from
): [number, number] {
  const lines = Array.isArray(value) ? [...value] : splitLines(value);
  let cursor = 0;
  let startLine = -1;
  let endLine = -1;
  if (to < from) [from, to] = [to, from];

  for (let i = 0; i < lines.length && (startLine < 0 || endLine < 0); i++) {
    const line = lines[i];
    const lineStart = cursor;
    const lineEnd = lineStart + line.length;

    if (from >= lineStart && from <= lineEnd) startLine = i;
    if (to >= lineStart && to <= lineEnd) endLine = i;

    cursor += line.length + 1;
  }

  return [Math.max(startLine, 0), endLine === -1 ? lines.length - 1 : endLine];
}

/**
 * For a selection beginning at `from` and ending at `to`, extends the selection
 * to include the entire lines of the first and last selected line.
 *
 * TODO: Only accept string values
 *
 * @param from The start of the selection
 * @param to The end of the selection
 * @param value The value containing the selection
 */
export function getRangeFromSelectedLines(
  value: string | string[],
  from: number,
  to = from
): [number, number] {
  const lines = Array.isArray(value) ? [...value] : splitLines(value);
  const lengths = lines.map((i) => i.length);

  from = Math.max(from, 0);
  to = Math.min(to, lines.length - 1);
  if (to < from) [from, to] = [to, from];

  // Starting at the sum of the lengths of all lines before the first selected
  // line, adjusting for the line breaks which we lost when splitting
  let start = lengths.slice(0, from).reduce((sum, i) => sum + i, 0);
  start += from;

  // Ending at the sum of the lengths of all lines before the last selected
  // line, again adjusting for the line breaks. Since we already calculated this
  // for the start, we can continue from there.
  let end = lengths.slice(from, to + 1).reduce((sum, i) => sum + i, start);
  end += to - from;

  return [start, end];
}

/**
 * For a cursor (e.g. selectionStart in a textarea) in a value, returns the
 * position of the cursor relative to the line it is on.
 *
 * @param value The value containing the cursor
 * @param cursor The position of the cursor
 */
export function getCursorInLine(
  value: string,
  cursor: number
): number | undefined {
  if (cursor > value.length || cursor < 0) return undefined;

  const beforeCursor = value.slice(0, cursor);
  const lineStart = beforeCursor.lastIndexOf("\n") + 1;
  return cursor - lineStart;
}

/* -------------------------------------------------- *
 * List continuation                                  *
 * -------------------------------------------------- */

/** Defines conditions under which lists are continued. */
export type ContinueListRule = {
  /** List marker */
  pattern: RegExp;
  /**
   * What to continue the list with. `same` will use the match as is, otherwise
   * a function can be given to generate the continuation text based on the
   * match.
   */
  next: "same" | ((match: string) => string);
};

export type ContinueListResult = {
  /** Updated input line, might have been split if a cursor was given */
  current: string;
} & (
  | {
      /** Newly created line */
      next: string;
      /** List marker as returned by the matching rule */
      match: string;
      /** Indicates that a rule has matched */
      didContinue: true;
    }
  | {
      /**
       * No next line if the list has ended. Set to null for differentiating
       * it from lines that just happen to be empty.
       */
      next: null;
      /** List marker as returned by the matching rule */
      match: string;
      /** Indicates that a rule has matched but the list has ended */
      didEnd: true;
    }
  | {
      /** Newly created line */
      next: string;
      /** Indicates that no rule has matched */
      didContinue: false;
      /** Since no rule has matched, no list has ended either */
      didEnd: false;
    }
);

export type MergeListResult = {
  /** Updated input line */
  current: string;
  /** List marker as returned by the matching rule */
  match: string;
};

/** Default rules for list continuation. */
export const continueListRules: Record<string, ContinueListRule> = {
  unordered: { pattern: /^\t*[-*] /, next: "same" },
  indent: { pattern: /^\t+/, next: "same" },
  numbered: {
    pattern: /^\t*\d+\. /,
    next: (match) => `${Number.parseInt(match) + 1}. `,
  },
};

/**
 * Given a line and a list of rules, checks if the line is a list as defined by
 * one of the rules. If so, it continues the list on the next line, otherwise
 * an empty next line is returned. If a cursor is given, the line is split at
 * the cursor and the continuation text is inserted between the two parts.
 *
 * @param line The line to check
 * @param rules The rules to check against
 * @param cursor The cursor position to split the line at, defaults to end of line
 */
export function continueList(
  line: string,
  rules: ContinueListRule[],
  cursor = line.length
): ContinueListResult {
  let continueWith: ContinueListRule["next"] | undefined = undefined;
  let match: RegExpMatchArray | null = null;
  let nextMatch: string | null = null;

  // Find the first matching rule
  for (let i = 0; i < rules.length && !continueWith; i++) {
    match = line.match(rules[i].pattern);
    if (match) continueWith = rules[i].next;
  }

  // Generate the new lines by: 1) splitting the first line where the cursor is
  // (or at the end if no cursor is given), 2) adding a new line with the
  // continuation text, and 3) adding the rest of the line.
  let [current, next] = splitAt(line, cursor);

  if (current && match && continueWith) {
    nextMatch = continueWith === "same" ? match[0] : continueWith(match[0]);
    next = nextMatch + next;
  }

  // Special case: If current and next are identical, we clear both lines. This
  // is useful for example when the user presses enter on an empty list item in
  // order to exit the list.
  const hasEnded = current === match?.[0] && cursor === line.length;
  if (hasEnded) current = "";

  if (hasEnded && nextMatch) {
    return { current, next: null, didEnd: true, match: nextMatch };
  } else if (current && nextMatch) {
    return { current, next, didContinue: true, match: nextMatch };
  } else {
    return { current, next, didContinue: false, didEnd: false };
  }
}

export function mergeList(
  line: string,
  insert: string,
  rules: ContinueListRule[]
): MergeListResult | null {
  let matchingPattern: RegExp | null = null;
  let insertMatch: RegExpMatchArray | null = null;

  // Find the first matching rule in the original line
  for (let i = 0; i < rules.length && !matchingPattern; i++) {
    const match = line.match(rules[i].pattern);

    if (match && line.length === match[0].length) {
      matchingPattern = rules[i].pattern;
      insertMatch = insert.match(matchingPattern);
    }
  }

  return matchingPattern && insertMatch
    ? { current: line.replace(matchingPattern, insert), match: insertMatch[0] }
    : null;
}

/* -------------------------------------------------- *
 * Indentation                                        *
 * -------------------------------------------------- */

export type IndentMode = "indent" | "outdent";

/**
 * Indents or outdents a list of lines.
 *
 * @param lines The lines to indent or outdent
 * @param [mode="indent"] Whether to indent or outdent
 */
export function indent(lines: string[], mode: IndentMode = "indent"): string[] {
  return mode === "indent"
    ? lines.map((i) => `\t${i}`)
    : lines.map((i) => (i.startsWith("\t") ? i.slice(1) : i));
}

/* -------------------------------------------------- *
 * Flipping lines                                     *
 * -------------------------------------------------- */

export function flip(a: string, b: string): [string, string] {
  return [b, a];
}
