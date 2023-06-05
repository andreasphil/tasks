import { RouteRecordRaw, createRouter, createWebHashHistory } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    redirect: { name: "Pages" },
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
