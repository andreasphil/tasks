import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      vue: "vue/dist/vue.esm-browser.prod.js",
      "vue-router": "vue-router/dist/vue-router.esm-browser.prod.js",
    },
  },
});
