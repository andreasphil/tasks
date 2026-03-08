import { computed } from "vue";
import { compare, mutate } from "../lib/item.ts";
import type { Item } from "../lib/parser.ts";
import { parse } from "./appParser.ts";
import { usePages } from "./pages.ts";

const dateHeading = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

function formatDateHeading(date: Temporal.PlainDate): string {
  return `# ${dateHeading.format(date)}`;
}

export function usePlannedPage() {
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
    factory: Parameters<typeof mutate>[1],
  ): void {
    const updateFn = items.value?.at(index)?.[1];
    updateFn?.(factory);
  }

  const items = computed<UpdateableItem[] | undefined>(() => {
    const today = Temporal.Now.plainDateISO();
    let buffer: UpdateableItem[] = [[parse("Planned")]];

    const allItems: UpdateableItem[] = Object.values(pages).flatMap((page) =>
      page.items.map<UpdateableItem>((item, i) => [
        removeIndent(item),
        updateFn(page.id, i),
      ]),
    );

    const datedItems = allItems.filter(
      ([item]) =>
        item.dueDate && Temporal.PlainDate.compare(item.dueDate, today) > 0,
    );

    const byDate = new Map<string, UpdateableItem[]>();
    datedItems.forEach((entry) => {
      const [item] = entry;
      const key = item.dueDate!.toString();
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(entry);
    });

    const sortedDates = [...byDate.keys()].sort();
    sortedDates.forEach((key) => {
      const date = Temporal.PlainDate.from(key);
      const groupItems = byDate.get(key)!.sort(([a], [b]) => compare(a, b));
      const heading: UpdateableItem[] = [
        [parse("")],
        [parse(formatDateHeading(date))],
        [parse("")],
      ];
      buffer.push(...heading, ...groupItems);
    });

    const anyTime = allItems.filter(
      ([item]) => item.type === "task" && !item.dueDate,
    );

    if (anyTime.length) {
      const heading: UpdateableItem[] = [
        [parse("")],
        [parse("# Any time")],
        [parse("")],
      ];
      buffer.push(...heading, ...anyTime);
    }

    return buffer.length > 1 ? buffer : undefined;
  });

  const text = computed<string | undefined>(() =>
    items.value?.map(([item]) => item.raw).join("\n"),
  );

  return { text, updateOnPage: updateItem };
}
