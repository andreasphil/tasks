import {
  Item,
  TaskStatus,
  UncheckedItem,
  parse,
  stringify,
  taskStatuses,
} from "@/lib/parser";
import { DeepWritable } from "./utils";
import { formatDate } from "./date";

/**
 * Special variant of the Item where all properties that can safely be changed
 * via `asWritable` or `mutate` are writable.
 */
export type WritableItem = Omit<Item, "dueDate" | "status"> &
  DeepWritable<Pick<Item, "dueDate" | "status">>;

function setStatus(item: UncheckedItem, newStatus: TaskStatus) {
  if (item.type !== "task") return;

  item.status = newStatus;

  const statusToken = item.tokens.find((i) => i.type === "status");
  if (statusToken) {
    const statusChar = taskStatuses[newStatus];
    statusToken.match = statusToken.match.replace(/\[.\]/, `[${statusChar}]`);
    statusToken.text = statusChar;
  }

  item.raw = stringify(item);
}

function setDueDate(item: UncheckedItem, newDueDate?: Date) {
  const hasDueDate = item.dueDate !== undefined;
  const newDueDateStr = newDueDate ? formatDate(newDueDate) : "";
  let newRaw = item.raw;

  // 1. No due date before, no due date after -> skip
  if (!hasDueDate && !newDueDate) return;
  // 2. No due date before, due date after -> add
  else if (!hasDueDate && newDueDate) newRaw = `${item.raw} ->${newDueDateStr}`;
  // 3. Due date before, no due date after -> remove
  else if (hasDueDate && !newDueDate) {
    const dueDateToken = item.tokens.find((i) => i.type === "dueDate");
    if (!dueDateToken) return;
    const exp = new RegExp(`\\s?->${dueDateToken.text}`);
    newRaw = newRaw.replace(exp, "");
  }
  // 4. Due date before, due date after -> update
  else if (hasDueDate && newDueDate) {
    const dueDateToken = item.tokens.find((i) => i.type === "dueDate");
    if (!dueDateToken) return;
    newRaw = newRaw.replace(`->${dueDateToken.text}`, `->${newDueDateStr}`);
  }

  Object.assign(item, parse(newRaw));
}

/**
 * Returns a wrtiable proxy to the original item. This will allow changing some
 * of the properties of an item while keeping the data structure intact and
 * consistent, i.e. all tokens, raw value, and dependencies between properties
 * of the item will also be updated to match the new value of the property.
 */
export function asWritable(item: Item): WritableItem {
  return new Proxy(structuredClone(item as UncheckedItem), {
    set: (target, property, value) => {
      if (property === "dueDate") {
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
 */
export function mutate(item: Item, factory: (item: WritableItem) => void) {
  const w = asWritable(item);
  factory(w);
  Object.assign(item, w);
}
