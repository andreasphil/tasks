import { computed } from "vue";
import { compare, mutate } from "../lib/item.ts";
import { getTitle } from "../lib/page.ts";
import type { Item, TaskStatus } from "../lib/parser.ts";
import { usePages } from "./pages.ts";

export type StatusPageItem = Item & {
  pageName: string;
  pageId: string;
  lineNr: number;
};

export function useStatusPage() {
  const { pages, updatePage } = usePages();

  type UpdateFn = (factory: Parameters<typeof mutate>[1]) => void;
  type UpdateableItem = StatusPageItem & { update?: UpdateFn };

  function updateFn(page: string, index: number): UpdateFn {
    return (factory) => {
      if (!pages[page]) return;
      const newItems = [...pages[page].items];
      newItems[index] = mutate(newItems[index], factory);
      updatePage(page, { items: newItems });
    };
  }

  function updateItem(index: number, from: TaskStatus, to: TaskStatus): void {
    const updateFn = items.value.get(from)?.at(index)?.update;
    updateFn?.((item) => {
      item.status = to;
    });
  }

  const items = computed(() => {
    const buffer = new Map<TaskStatus, UpdateableItem[]>();
    buffer.set("completed", []);
    buffer.set("important", []);
    buffer.set("incomplete", []);
    buffer.set("inProgress", []);
    buffer.set("question", []);

    Object.values(pages)
      // Get items with update function from all pages
      .flatMap((page) =>
        page.items.map((item, i) => ({
          ...item,
          raw: item.raw.replace(/^\t+/, ""),
          pageName: getTitle(page),
          pageId: page.id,
          lineNr: i,
          update: updateFn(page.id, i),
        }))
      )

      // Remove items other than tasks
      .filter((item) => item.type === "task" && item.status !== null)

      // Group by status
      .reduce((all, item) => {
        all.get(item.status!)!.push(item);
        all.get(item.status!)!.sort(compare);
        return all;
      }, buffer);

    return buffer;
  });

  return { items, updateOnPage: updateItem };
}
