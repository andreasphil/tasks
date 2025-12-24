import { CommandBar } from "@andreasphil/command-bar";
import { Textarea2 } from "@andreasphil/textarea2";
import "temporal-polyfill/global";
import { createApp } from "vue";
import App from "./App.vue";
import "../style/style.css";
import { router } from "./router.ts";
import "./stores/settings.ts";

CommandBar.define();
Textarea2.define();

const app = createApp(App);
app.use(router);
app.mount("#app");
