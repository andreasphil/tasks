import { usePages } from "@/stores/pages";
import dayjs from "dayjs";
import { computed } from "vue";

export function useTodayCount() {
  const { pages } = usePages();

  const todayCount = computed(() => {
    const eod = dayjs().endOf("day").valueOf();

    const items = Object.values(pages)
      .flatMap((i) => i.items)
      .filter((i) => i.status !== "completed")
      .filter((i) => !!i.dueDate && (i.dueDate as Date).getTime() <= eod);

    return items.length;
  });

  return todayCount;
}
