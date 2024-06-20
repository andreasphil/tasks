import { compare } from "@/lib/item";
import { type Item } from "@/lib/parser";
import { usePages } from "@/stores/pages";
import { computed } from "vue";

export function useTagsPage() {
  const { pages } = usePages();

  /* -------------------------------------------------- *
   * Tags page generation                               *
   * -------------------------------------------------- */

  const tags = computed<Record<string, Item[]>>(() =>
    Object.values(pages)
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
        const taggedItems = items
          .map(({ raw }) => raw.replace(/^\t+/, ""))
          .join("\n");

        buffer += `\n# Tagged "#${tag}"\n\n${taggedItems}\n`;

        return buffer;
      }, "Tags\n");

    return pageText === "Tags\n" ? undefined : pageText;
  });

  return { text };
}
