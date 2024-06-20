import { compare } from "@/lib/item";
import { compareByTitle, getTitle } from "@/lib/structuredPage";
import { usePages } from "@/stores/structuredPages";
import dayjs from "dayjs";
import { computed } from "vue";

export function useTodayPage() {
  const { pages } = usePages();

  /* -------------------------------------------------- *
   * Today page generation                              *
   * -------------------------------------------------- */

  const text = computed<string | undefined>(() => {
    let pageText = Object.values(pages)
      .sort(compareByTitle)
      .reduce<string>((buffer, page) => {
        const eod = dayjs().endOf("day").valueOf();

        const dueItems = page.items
          .filter(
            ({ dueDate }) => dueDate && (dueDate as Date).getTime() <= eod
          )
          .sort(compare)
          .map(({ raw }) => raw.replace(/^\t+/, ""))
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
