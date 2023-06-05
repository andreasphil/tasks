import { createRouter, createWebHashHistory } from "vue-router";

/** @type {import("vue-router").RouteRecordRaw[]} */
const routes = [
  {
    path: "/",
    name: "Home",
    component: () => import("../views/Index.vue"),
  },
  {
    path: "/pages",
    name: "Pages",
    component: () => import("../views/Pages.vue"),
    children: [
      {
        path: ":id",
        name: "Page",
        component: () => import("../views/Page.vue"),
      },
    ],
  },
];

const history = createWebHashHistory();

export const router = createRouter({ routes, history });
