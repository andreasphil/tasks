import { Page, getTitle } from "@/lib/page";
import { usePages } from "@/stores/pages";
import { MaybeRefOrGetter, computed, readonly, toValue } from "vue";

export function usePage(id: MaybeRefOrGetter<string>) {
  const { pages, updatePage } = usePages();

  const page = computed<Page | undefined>(() => {
    const idVal = toValue(id);
    return pages.find((i) => i.id === idVal);
  });

  const text = computed<string | undefined>({
    get: () => page.value?.text,
    set: (value) => {
      updatePage(toValue(id), { text: value });
    },
  });

  const title = computed<string | undefined>(() =>
    page.value ? getTitle(page.value) : undefined
  );

  const exists = computed<boolean>(() => !!page.value);

  return {
    page: readonly(page),
    text,
    title,
    exists,
  };
}
