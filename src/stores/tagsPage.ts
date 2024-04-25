import { compare } from "@/lib/item";
import { compareByTitle, type Page } from "@/lib/page";
import { parseWithMemo, type Item } from "@/lib/parser";
import { usePages } from "@/stores/pages";
import { splitLines } from "@andreasphil/vue-textarea2/text";
import { computed } from "vue";

export function useTagsPage() {
  const { pages } = usePages();

  /* -------------------------------------------------- *
   * Tags page generation                               *
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

  const tags = computed<Record<string, Item[]>>(() =>
    pagesWithItems.value
      .flatMap(({ items }) => items)
      .reduce<Record<string, Item[]>>((tagMap, item) => {
        item.tags.forEach((tag) => {
          if (!tagMap[tag]) tagMap[tag] = [];
          tagMap[tag].push(item);

          // TODO: This is not very efficient, maybe improve at some point
          tagMap[tag].sort(compare);
        });

        return tagMap;
      }, {})
  );

  const text = computed<string | undefined>(() => {
    let pageText = Object.entries(tags.value)
      .filter(([, items]) => items?.length)
      .reduce<string>((buffer, [tag, items]) => {
        const taggedItems = items.map(({ raw }) => raw).join("\n");

        buffer += `\n# Tagged "#${tag}"\n\n${taggedItems}\n`;

        return buffer;
      }, "Tags\n");

    return pageText === "Tags\n" ? undefined : pageText;
  });

  return { text };
}
