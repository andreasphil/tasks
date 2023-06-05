// @ts-expect-error Missing types
import { useThemeColor as useFinecssThemeColor } from "finecss";
import { onMounted, onUnmounted } from "vue";

export function useThemeColor() {
  let unsubscribeOnUnmount = () => {};

  onMounted(() => {
    const { unsubscribe } = useFinecssThemeColor();
    unsubscribeOnUnmount = unsubscribe;
  });

  onUnmounted(() => {
    unsubscribeOnUnmount();
  });
}
