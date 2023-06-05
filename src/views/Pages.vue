<script setup lang="ts">
import VOffcanvas from "@/components/controls/VOffcanvas.vue";
import { usePages } from "@/stores/pages";
import { onMounted } from "vue";
import { RouterLink, RouterView, useRouter } from "vue-router";
import { useAsyncTask } from "vue-use-async-task";

const router = useRouter();

const { pagesList, ...store } = usePages();
const { run: fetchPages, isLoading, error } = useAsyncTask(store.fetchPages);
const { run: addPage } = useAsyncTask(store.addPage, { isLoading, error });

onMounted(() => fetchPages());

async function goToNewPage() {
  const [newPage] = await addPage("");
  if (newPage) router.push({ name: "Page", params: { id: newPage } });
  // TODO: handle error
}
</script>

<template>
  <VOffcanvas>
    <template #sidebar>
      <nav>
        <ul>
          <li>
            <a href="#" @click.prevent="goToNewPage()" class="text-c-variant">
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
