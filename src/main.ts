import App from "@/App.vue";
import { router } from "@/router";
import "@/style.css";
import dayjs from "dayjs";
import "dayjs/locale/de";
import { createApp } from "vue";

dayjs.locale("de");

createApp(App).use(router).mount("#app");
