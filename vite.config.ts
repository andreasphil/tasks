import vue from "@vitejs/plugin-vue";
import { defineConfig } from "rolldown-vite";

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => {
            return ["textarea-2", "command-bar"].includes(tag);
          },
        },
      },
    }),
  ],
  build: {
    target: "esnext",
  },
});
