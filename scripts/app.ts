import { CommandBar } from "@andreasphil/command-bar";
import { Textarea2 } from "@andreasphil/textarea2";
import "temporal-polyfill/global";
import { createApp, defineComponent } from "vue";
import { RouterView } from "vue-router";
import "../style/style.css";
import { html } from "./lib/html.ts";
import { router } from "./router.ts";
import "./stores/settings.ts";

const App = defineComponent({
  name: "App",

  components: { RouterView },

  template: html`
    <command-bar></command-bar>
    <RouterView />
  `,
});

CommandBar.define();
Textarea2.define();

const app = createApp(App);
app.use(router);
app.mount("#app");

app.config.compilerOptions.isCustomElement = (tag) => {
  return ["textarea-2", "command-bar"].includes(tag);
};
