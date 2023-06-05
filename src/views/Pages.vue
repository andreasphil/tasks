<script setup>
import { RouterLink, RouterView, useRouter } from "vue-router";
import VOffcanvas from "../components/controls/VOffcanvas.vue";
import { usePages } from "../stores/pages";
import { onMounted } from "vue";

const { addPage, pagesList, fetchPages } = usePages();
const router = useRouter();

onMounted(() => {
  fetchPages();
});

function goToNewPage() {
  const newPage = addPage("");
  router.push({ name: "Page", params: { id: newPage } });
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
