import { computed, readonly, toValue } from "vue";
import { usePages } from "./pages";
import { getTitle } from "../lib/page";

export function usePage(id) {
  const { pages, updatePage } = usePages();

  const page = computed(() => {
    const idVal = toValue(id);
    return pages.find((i) => i.id === idVal);
  });

  const text = computed({
    get: () => page.value?.text,
    set: (value) => {
      updatePage(toValue(id), { text: value });
    },
  });

  const title = computed(() => (page.value ? getTitle(page.value) : undefined));

  const exists = computed(() => !!page.value);

  return {
    page: readonly(page),
    text,
    title,
    exists,
  };
}
