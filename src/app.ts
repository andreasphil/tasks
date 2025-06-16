import { CommandBar } from "@andreasphil/command-bar";
import { useThemeColor } from "@andreasphil/design-system";
import { defineComponent, onMounted } from "vue";
import { RouterView } from "vue-router";
import { html } from "./lib/html.ts";

export default defineComponent({
  name: "App",

  components: { CommandBar, RouterView },

  setup() {
    onMounted(() => {
      useThemeColor();
    });
  },

  template: html`
    <command-bar></command-bar>
    <RouterView />
  `,
});
