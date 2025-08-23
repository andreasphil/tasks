import { computed } from "vue";
import { usePages } from "./pages.ts";

export function useTodayCount() {
  const { pages } = usePages();

  const todayCount = computed(() => {
    const today = Temporal.Now.plainDateISO();

    return Object.values(pages)
      .flatMap((i) => i.items)
      .filter((i) => i.status !== "completed")
      .filter(
        (i) => !!i.dueDate && Temporal.PlainDate.compare(i.dueDate, today) <= 0
      ).length;
  });

  return todayCount;
}
