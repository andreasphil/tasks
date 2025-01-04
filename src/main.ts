import App from "@/App.vue";
import "@/assets/style.css";
import { router } from "@/router";
import "@/stores/settings";
import { CommandBar } from "@andreasphil/command-bar";
import { Textarea2 } from "@andreasphil/textarea2";
import dayjs from "dayjs";
import "dayjs/locale/de";
import weekday from "dayjs/plugin/weekday";
import { createApp } from "vue";

dayjs.locale("de");
dayjs.extend(weekday);

CommandBar.define();

Textarea2.define();

createApp(App).use(router).mount("#app");
