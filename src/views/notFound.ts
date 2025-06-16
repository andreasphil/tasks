import { Ghost } from "lucide-static";
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";
import Layout from "../components/layout.ts";
import { html } from "../lib/html.ts";
import "./notFound.css";

export default defineComponent({
  name: "NotFound",

  components: { Layout, RouterLink },

  setup() {
    return {
      Ghost,
    };
  },

  template: html`
    <Layout>
      <div data-with-fallback="empty" class="notFound">
        <div />
        <div data-when="empty">
          <span v-html="Ghost" />
          <p>This URL doesn't exist.</p>
          <RouterLink :to="{ name: 'Home' }">Take me back</RouterLink>
        </div>
      </div>
    </Layout>
  `,
});
