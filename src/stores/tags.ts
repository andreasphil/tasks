import { usePages } from "@/stores/pages";
import { computed, readonly } from "vue";

export function useTags() {
  const { pages } = usePages();

  const tags = computed(() => {
    const countedTags = Object.values(pages)
      .flatMap((i) => i.items)
      .flatMap((i) => i.tags)
      .reduce((all, current) => {
        const count = all.get(current) ?? 0;
        all.set(current, count + 1);
        return all;
      }, new Map<string, number>());

    const sorted = Array.from(countedTags)
      .sort(([, a], [, b]) => b - a)
      .map(([tag]) => tag);

    return sorted;
  });

  return { tags: readonly(tags) };
}
