import { compare } from "@/lib/item";
import { compareByTitle, getTitle, type Page } from "@/lib/page";
import { parseWithMemo, type Item } from "@/lib/parser";
import { usePages } from "@/stores/pages";
import { splitLines } from "@andreasphil/vue-textarea2/text";
import dayjs from "dayjs";
import { computed } from "vue";

export function useTodayPage() {
  const { pages } = usePages();

  /* -------------------------------------------------- *
   * Today page generation                              *
   * -------------------------------------------------- */

  const pagesWithItems = computed<Array<Page & { items: Item[] }>>(() =>
    Object.values(pages)
      .sort(compareByTitle)
      .map((page) => ({ ...page, text: page.text.replace(/\t/g, "") }))
      .map((page) => ({
        ...page,
        items: splitLines(page.text).map((line) => parseWithMemo(line)),
      }))
  );

  const text = computed<string | undefined>(() => {
    let pageText = pagesWithItems.value.reduce<string>((buffer, page) => {
      const eod = dayjs().endOf("day").valueOf();

      const dueItems = page.items
        .filter(({ dueDate }) => dueDate && (dueDate as Date).getTime() <= eod)
        .sort(compare)
        .map(({ raw }) => raw)
        .join("\n");

      if (dueItems) buffer += `\n# ${getTitle(page)}\n\n${dueItems}\n`;

      return buffer;
    }, "Today\n");

    return pageText === "Today\n" ? undefined : pageText;
  });

  return {
    text,
  };
}
