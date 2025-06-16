import dayjs from "dayjs";
import { computed } from "vue";
import { compare, mutate } from "../lib/item.ts";
import { compareByTitle, getTitle } from "../lib/page.ts";
import type { Item } from "../lib/parser.ts";
import { parse } from "./appParser.ts";
import { usePages } from "./pages.ts";

export function useTodayPage() {
  const { pages, updatePage } = usePages();

  type UpdateFn = (factory: Parameters<typeof mutate>[1]) => void;
  type UpdateableItem = [item: Item, update?: UpdateFn];

  function updateFn(page: string, index: number): UpdateFn {
    return (factory) => {
      if (!pages[page]) return;
      const newItems = [...pages[page].items];
      newItems[index] = mutate(newItems[index], factory);
      updatePage(page, { items: newItems });
    };
  }

  function removeIndent(item: Item): Item {
    return { ...item, raw: item.raw.replace(/^\t+/, "") };
  }

  function updateItem(
    index: number,
    factory: Parameters<typeof mutate>[1]
  ): void {
    const updateFn = items.value?.at(index)?.[1];
    updateFn?.(factory);
  }

  const items = computed<UpdateableItem[] | undefined>(() => {
    const eod = dayjs().endOf("day").valueOf();
    const newPages = Object.values(pages).sort(compareByTitle);
    let buffer: UpdateableItem[] = [[parse("Today")]];

    newPages.forEach((page) => {
      const dueItems: UpdateableItem[] = [];

      page.items
        .map<UpdateableItem>((item, i) => [
          removeIndent(item),
          updateFn(page.id, i),
        ])
        .filter(([item]) => {
          return item.dueDate && (item.dueDate as Date).getTime() <= eod;
        })
        .sort(([a], [b]) => compare(a, b))
        .forEach((item) => dueItems.push(item));

      if (dueItems.length) {
        const heading: UpdateableItem[] = [
          [parse("")],
          [parse(`# ${getTitle(page)}`)],
          [parse("")],
        ];

        buffer.push(...heading, ...dueItems);
      }
    });

    return buffer.length > 1 ? buffer : undefined;
  });

  const text = computed<string | undefined>(() =>
    items.value?.map(([item]) => item.raw).join("\n")
  );

  return { text, updateOnPage: updateItem };
}
