import { today as getToday } from "@/lib/date";
import { Page, getTitle } from "@/lib/page";
import { Item, parseManyWithMemo } from "@/lib/parser";
import { usePages } from "@/stores/pages";
import { computed } from "vue";

export function useTodayPage() {
  const { pages } = usePages();

  /* -------------------------------------------------- *
   * Today page generation                              *
   * -------------------------------------------------- */

  const pagesWithItems = computed<Array<Page & { items: Item[] }>>(() =>
    Object.values(pages)
      .map((page) => ({ ...page, text: page.text.replace(/\t/g, "") }))
      .map((page) => ({ ...page, items: parseManyWithMemo(page.text) }))
      .sort((a, b) => b.updatedAt - a.updatedAt)
  );

  const text = computed<string>(() => {
    let pageText = pagesWithItems.value.reduce<string>((buffer, page) => {
      const eod = getToday().getTime();

      const dueItems = page.items
        .filter(({ dueDate }) => dueDate && (dueDate as Date).getTime() <= eod)
        .map(({ raw }) => raw)
        .join("\n");

      if (dueItems) buffer += `\n# ${getTitle(page)}\n\n${dueItems}\n`;

      return buffer;
    }, "Today\n");

    if (pageText === "Today\n")
      pageText += "\nWell done! You completed all of today's tasks. 🌞";

    return pageText;
  });

  return {
    text,
  };
}
