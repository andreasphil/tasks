import Board from "@/views/board";
import NotFound from "@/views/notFound";
import Page from "@/views/page";
import Pages from "@/views/pages";
import Settings from "@/views/settings";
import Tags from "@/views/tags";
import Today from "@/views/today";
import Welcome from "@/views/welcome";
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
