import { defineConfig } from "rolldown-vite";

export default defineConfig({
  build: {
    target: "esnext",
  },
  resolve: {
    alias: {
      vue: "vue/dist/vue.esm-browser.prod.js",
      "vue-router": "vue-router/dist/vue-router.esm-browser.prod.js",
    },
  },
});
