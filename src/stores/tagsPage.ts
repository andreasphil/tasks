import { compare, mutate } from "@/lib/item";
import { type Item } from "@/lib/parser";
import { parse } from "@/stores/appParser";
import { usePages } from "@/stores/pages";
import { computed } from "vue";

export function useTagsPage() {
  const { pages, updatePage } = usePages();

  type UpdateFn = (factory: Parameters<typeof mutate>[1]) => void;
  type UpdateableItem = Item & { update?: UpdateFn };

  function updateFn(page: string, index: number): UpdateFn {
    return (factory) => {
      if (!pages[page]) return;
      const newItems = [...pages[page].items];
      newItems[index] = mutate(newItems[index], factory);
      updatePage(page, { items: newItems });
    };
  }

  function updateItem(
    index: number,
    factory: Parameters<typeof mutate>[1]
  ): void {
    const updateFn = items.value?.at(index)?.update;
    updateFn?.(factory);
  }

  const items = computed<UpdateableItem[] | undefined>(() => {
    let buffer: UpdateableItem[] = [parse("Tags")];

    Object.values(pages)
      // Get items with update function from all pages
      .flatMap((page) =>
        page.items.map((item, i) => ({
          ...item,
          raw: item.raw.replace(/^\t+/, ""),
          update: updateFn(page.id, i),
        }))
      )

      // Remove items that don't have tags
      .filter((item) => item.tags?.length > 0)

      // Group by tag
      .reduce((all, item) => {
        item.tags.forEach((tag) => {
          if (!all.has(tag)) all.set(tag, []);
          all.get(tag)!.push(item);
          all.get(tag)!.sort(compare);
        });
        return all;
      }, new Map<string, UpdateableItem[]>())

      // Create tag sections
      .forEach((items, tag) => {
        const heading: UpdateableItem[] = [
          parse(""),
          parse(`# Tagged "#${tag}"`),
          parse(""),
        ];

        buffer.push(...heading, ...items);
      });

    return buffer.length > 1 ? buffer : undefined;
  });

  const text = computed<string | undefined>(() =>
    items.value?.map((item) => item.raw).join("\n")
  );

  return { text, updateOnPage: updateItem };
}
