import {
  Item,
  TaskStatus,
  UncheckedItem,
  stringify,
  taskStatuses,
} from "@/lib/parser";
import { DeepWritable } from "./utils";

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
        // TODO: Implement
        throw new Error("Setting dueDate is not currently supported");
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
