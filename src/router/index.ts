import Board from "@/views/Board.vue";
import NotFound from "@/views/NotFound.vue";
import Page from "@/views/Page.vue";
import Pages from "@/views/Pages.vue";
import Settings from "@/views/Settings.vue";
import Tags from "@/views/Tags.vue";
import Today from "@/views/Today.vue";
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
      { path: "today", name: "Today", component: Today },
      { path: "board", name: "Board", component: Board },
      { path: "tags", name: "Tags", component: Tags },
      { path: ":id", name: "Page", component: Page },
    ],
  },
  {
    path: "/settings",
    component: Pages,
    children: [{ path: "", name: "Settings", component: Settings }],
  },
  { path: "/:catchAll(.*)*", name: "NotFound", component: NotFound },
];

const history = createWebHashHistory();

export const router = createRouter({ routes, history });
