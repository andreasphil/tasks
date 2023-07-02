<script setup lang="ts">
import VOffcanvas from "@/components/controls/VOffcanvas.vue";
import { usePages } from "@/stores/pages";
import { FileCheck2, Plus, Trash2 } from "lucide-vue-next";
import { onMounted } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useAsyncTask } from "vue-use-async-task";

const router = useRouter();
const route = useRoute();
const { pagesList, ...store } = usePages();
const { run: fetchPages } = useAsyncTask(store.fetchPages);
const { run: addPage } = useAsyncTask(store.addPage);
const { run: removePage } = useAsyncTask(store.removePage);

onMounted(() => fetchPages());

async function goToNewPage() {
  const [newPage] = await addPage("");
  if (newPage) router.push({ name: "Page", params: { id: newPage } });
}

async function beginRemovePage() {
  const confirmed = confirm("Are you sure you want to delete this page?");
  const pageId = route.params.id?.toString();

  if (confirmed && pageId) {
    await removePage(pageId);
    const nextPage = pagesList.value[0]?.id;
    if (nextPage) router.push({ name: "Page", params: { id: nextPage } });
  }
}
</script>

<template>
  <VOffcanvas>
    <template #header>
      <strong>Textflow</strong>
      <section>
        <button
          data-variant="muted"
          title="Delete page"
          @click="beginRemovePage()"
        >
          <Trash2 />
          <span data-hidden>Delete page</span>
        </button>
      </section>
    </template>

    <template #sidebar>
      <nav>
        <ul>
          <li>
            <a href="#" @click.prevent="goToNewPage()" class="text-c-variant">
              <Plus />
              Add page...
            </a>
          </li>
          <li v-for="page in pagesList">
            <RouterLink
              :to="{ name: 'Page', params: { id: page.id } }"
              custom
              v-slot="{ isExactActive, href, navigate }"
            >
              <a :href="href" @click="navigate" :data-active="isExactActive">
                <FileCheck2 />
                {{ page.title }}
              </a>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </template>

    <RouterView />
  </VOffcanvas>
</template>

<style module>
.screen {
}
</style>
