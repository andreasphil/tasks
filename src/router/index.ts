import NotFound from "@/views/NotFound.vue";
import Page from "@/views/Page.vue";
import Pages from "@/views/Pages.vue";
import Welcome from "@/views/Welcome.vue";
import { RouteRecordRaw, createRouter, createWebHashHistory } from "vue-router";

const routes: RouteRecordRaw[] = [
  { path: "/", name: "Home", redirect: { name: "Welcome" } },
  {
    path: "/pages",
    name: "Pages",
    component: Pages,
    children: [
      { path: "", name: "Welcome", component: Welcome },
      { path: ":id", name: "Page", component: Page },
    ],
  },
  { path: "/:catchAll(.*)*", name: "NotFound", component: NotFound },
];

const history = createWebHashHistory();

export const router = createRouter({ routes, history });
