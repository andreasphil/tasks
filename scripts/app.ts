import { CommandBar } from "@andreasphil/command-bar";
import { useThemeColor } from "@andreasphil/design-system";
import { Textarea2 } from "@andreasphil/textarea2";
import dayjs from "dayjs";
import "dayjs/locale/de";
import weekday from "dayjs/plugin/weekday";
import { createApp, defineComponent, onMounted } from "vue";
import { RouterView } from "vue-router";
import "../style/style.css";
import { html } from "./lib/html.ts";
import { router } from "./router.ts";
import "./stores/settings.ts";

const App = defineComponent({
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

dayjs.locale("de");
dayjs.extend(weekday);

CommandBar.define();
Textarea2.define();

const app = createApp(App);
app.use(router);
app.mount("#app");

app.config.compilerOptions.isCustomElement = (tag) => {
  return ["textarea-2", "command-bar"].includes(tag);
};
