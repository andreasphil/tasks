import {
  parse,
  stringify,
  taskStatuses,
  type DeepWritable,
  type Item,
  type TaskStatus,
  type UncheckedItem,
} from "@/lib/parser";
import dayjs from "dayjs";

/* -------------------------------------------------- *
 * Mutating items                                     *
 * -------------------------------------------------- */

export type WritableItem = Omit<Item, "dueDate" | "status" | "type"> &
  DeepWritable<Pick<Item, "dueDate" | "status" | "type">>;

function setStatus(item: UncheckedItem, status: TaskStatus): void {
  if (item.type !== "task") return;

  item.status = status;

  const statusToken = item.tokens.find((i) => i.type === "status");
  if (statusToken) {
    const statusChar = taskStatuses[status];
    statusToken.raw = statusToken.raw.replace(/\[.\]/, `[${statusChar}]`);
    statusToken.value = statusChar;
  }

  item.raw = stringify(item);
}

function setDueDate(item: UncheckedItem, date?: Date): void {
  const hasDueDate = item.dueDate !== undefined;
  let newRaw = item.raw;
  const newDueDateStr = date ? dayjs(date).format("YYYY-MM-DD") : "";

  // 1. No due date before, no due date after = skip
  if (!hasDueDate && !date) return;
  // 2. No due date before, due date after = add
  else if (!hasDueDate && date) {
    newRaw = item.raw.replace(/ ?$/, ` @${newDueDateStr}`);
  }
  // 3. Due date before, no due date after = remove
  else if (hasDueDate && !date) {
    const dueDateToken = item.tokens.find((i) => i.type === "dueDate");
    if (!dueDateToken) return;
    const exp = new RegExp(`\\s?@${dueDateToken.value}`);
    newRaw = newRaw.replace(exp, "");
  }
  // 4. Due date before, due date after = update
  else if (hasDueDate && date) {
    const dueDateToken = item.tokens.find((i) => i.type === "dueDate");
    if (!dueDateToken) return;
    newRaw = newRaw.replace(`@${dueDateToken.value}`, `@${newDueDateStr}`);
  }

  Object.assign(item, parse(newRaw));
}

function setType(item: UncheckedItem, type: UncheckedItem["type"]): void {
  if (item.type === type) return;

  let newRaw = item.raw;

  // Normalize the type of the item by removing any type specific content
  if (item.type === "task") newRaw = newRaw.replace(/^(\s*)\[.\] /, "$1");
  else if (item.type === "heading") newRaw = newRaw.replace(/^# /, "");
  else if (item.type === "note") newRaw = newRaw.replace(/^(\s*)\[-\] /, "$1");

  // Add type specific content
  if (type === "task") newRaw = newRaw.replace(/^(\s*)/, "$1[ ] ");
  else if (type === "heading") newRaw = `# ${newRaw.trimStart()}`;

  Object.assign(item, parse(newRaw));
  item.status = type === "task" ? "incomplete" : null;
}

function clone(item: Item): Item {
  return {
    ...item,
    tokens: [...item.tokens.map((token) => ({ ...token }))],
    tags: [...item.tags],
  };
}

/**
 * Returns a wrtiable proxy to the original item. This will allow changing some
 * of the properties of an item while keeping the data structure intact and
 * consistent, i.e. all tokens, raw value, and dependencies between properties
 * of the item will also be updated to match the new value of the property.
 *
 * @param item The item that should be changed.
 * @returns A writable proxy to the original item. Note that this is not a
 *  copy. Any changes made to the writable item will change the original item.
 */
export function asWritable(item: Item): WritableItem {
  return new Proxy(item as UncheckedItem, {
    set: (target, property, value) => {
      if (property === "type") {
        setType(target, value);
      } else if (property === "dueDate") {
        setDueDate(target, value);
      } else if (property === "status") {
        setStatus(target, value);
      } else {
        const propertyName = String(property);
        throw new Error(`Setting "${propertyName}" is not currently supported`);
      }

      return true;
    },
  });
}

/**
 * Allows you to change an item in place by writing all changes you make in the
 * `factory` callback back into the item.
 *
 * @param item The item that should be mutated.
 * @param factory A function making the changes to the item.
 */
export function mutate(
  item: Item,
  factory: (item: WritableItem) => void
): Item {
  const mutatedItem = asWritable(clone(item));
  factory(mutatedItem);
  return mutatedItem as Item;
}

/* -------------------------------------------------- *
 * Sorting items                                      *
 * -------------------------------------------------- */

const statusWeights: Record<TaskStatus, number> = {
  important: 10000,
  inProgress: 1000,
  incomplete: 100,
  question: 10,
  completed: 1,
} as const;

export function compare(a: Item, b: Item): number {
  // Keep order of items of different types
  if (a.type !== b.type || a.type !== "task" || b.type !== "task") return 0;

  // Keep order of items with different leading white space
  const aIndent = a.raw.match(/^\s*/)?.[0] ?? "";
  const bIndent = b.raw.match(/^\s*/)?.[0] ?? "";
  if (aIndent !== bIndent) return 0;

  // Sort by status
  if (a.status !== b.status) {
    return statusWeights[b.status] - statusWeights[a.status];
  }

  // Sort by due date
  if (a.dueDate && !b.dueDate) return -1;
  else if (b.dueDate && !a.dueDate) return 1;
  else {
    const aDueDate = dayjs((a as UncheckedItem).dueDate).startOf("day");
    const bDueDate = dayjs((b as UncheckedItem).dueDate).startOf("day");
    const diff = aDueDate.diff(bDueDate);
    if (diff !== 0) return diff;
  }

  // Default: keep the order
  return 0;
}
