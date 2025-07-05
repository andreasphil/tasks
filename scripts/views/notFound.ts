import { Ghost } from "lucide-static";
import { defineComponent } from "vue";
import { RouterLink } from "vue-router";
import Layout from "../components/layout.ts";
import { html } from "../lib/html.ts";

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
      <div has-fallback="empty" class="margin-y-outer-spacing">
        <div />
        <div fallback-for="empty">
          <span v-html="Ghost" />
          <p>This URL doesn't exist.</p>
          <RouterLink :to="{ name: 'Home' }">Take me back</RouterLink>
        </div>
      </div>
    </Layout>
  `,
});
