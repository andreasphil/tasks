import { RouteRecordRaw, createRouter, createWebHashHistory } from "vue-router";
import Board from "./views/board.ts";
import NotFound from "./views/notFound.ts";
import Page from "./views/page.ts";
import Pages from "./views/pages.ts";
import Settings from "./views/settings.ts";
import Tags from "./views/tags.ts";
import Today from "./views/today.ts";
import Welcome from "./views/welcome.ts";

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
