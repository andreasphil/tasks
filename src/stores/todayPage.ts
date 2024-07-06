import { compare, mutate } from "@/lib/item";
import { compareByTitle, getTitle } from "@/lib/page";
import { parse, type Item } from "@/lib/parser";
import { usePages } from "@/stores/pages";
import dayjs from "dayjs";
import { computed } from "vue";

export function useTodayPage() {
  const { pages, updatePage } = usePages();

  /* -------------------------------------------------- *
   * Items                                              *
   * -------------------------------------------------- */

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
    if (updateFn) updateFn(factory);
  }

  /**
   * The list of items on this page, where each item also has a function to
   * update the item. The function keeps track of the page and index of the
   * item. The function is optional and doesn't exist for items that can't
   * be updated.
   */
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
        .sort(([a], [b]) => compare(a, b))
        .filter(([item]) => {
          return item.dueDate && (item.dueDate as Date).getTime() <= eod;
        })
        .forEach((item) => dueItems.push(item));

      if (dueItems.length) {
        let heading: UpdateableItem[] = [
          [parse("")],
          [parse(`# ${getTitle(page)}`)],
          [parse("")],
        ];

        buffer.push(...heading, ...dueItems);
      }
    });

    return buffer.length > 1 ? buffer : undefined;
  });

  /* -------------------------------------------------- *
   * Page text                                          *
   * -------------------------------------------------- */

  const text = computed<string | undefined>(() =>
    items.value?.map(([item]) => item.raw).join("\n")
  );

  return {
    text,
    updateOnPage: updateItem,
  };
}
