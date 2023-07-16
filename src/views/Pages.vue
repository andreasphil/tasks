<script setup lang="ts">
import { VBarContext, type Command } from "@/components/VBar.vue";
import VLayout from "@/components/VLayout.vue";
import { usePages } from "@/stores/pages";
import {
  Command as CommandIcon,
  FileCheck2,
  Plus,
  Trash2,
} from "lucide-vue-next";
import { inject, onBeforeUnmount, onMounted, toValue, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import { useAsyncTask } from "vue-use-async-task";

const router = useRouter();
const route = useRoute();

/* -------------------------------------------------- *
 * Pages                                              *
 * -------------------------------------------------- */

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

/* -------------------------------------------------- *
 * Command bar integration                            *
 * -------------------------------------------------- */

const vbar = inject(VBarContext, null);

let cleanupPages: (() => void) | null = null;

function registerPages(pages: (typeof pagesList)["value"]) {
  cleanupPages?.();

  const commands = toValue(pages).map<Command>((page) => ({
    id: `open-page-${page.id}`,
    name: page.title,
    alias: ["open page"],
    groupName: "Open",
    icon: FileCheck2,
    action: () => router.push({ name: "Page", params: { id: page.id } }),
  }));

  cleanupPages = vbar?.registerCommand(...commands) ?? null;
}

watch(pagesList, (pages) => registerPages(pages));

onBeforeUnmount(() => {
  cleanupPages?.();
});

let cleanupStaticCommands: (() => void) | null = null;

const staticCommands: Command[] = [
  {
    id: "new-page",
    name: "Add page",
    alias: ["New page"],
    groupName: "Pages",
    icon: Plus,
    action: goToNewPage,
  },
  {
    id: "delete-page",
    name: "Delete page",
    alias: ["Remove page"],
    groupName: "Pages",
    icon: Trash2,
    action: beginRemovePage,
  },
];

onMounted(() => {
  cleanupStaticCommands = vbar?.registerCommand(...staticCommands) ?? null;
});

onBeforeUnmount(() => {
  cleanupStaticCommands?.();
});
</script>

<template>
  <VLayout>
    <template #header>
      <button
        data-variant="muted"
        title="Delete page"
        type="button"
        @click="beginRemovePage()"
      >
        <Trash2 />
        <span data-hidden>Delete page</span>
      </button>
    </template>

    <template #sidebar>
      <nav>
        <ul>
          <li>
            <a href="#" @click.prevent="vbar?.open()" class="text-c-variant">
              <CommandIcon />
              Go to anything
            </a>
          </li>
          <li>
            <a href="#" @click.prevent="goToNewPage()" class="text-c-variant">
              <Plus />
              Add page...
            </a>
          </li>
          <li>
            <hr />
          </li>
          <li v-for="page in pagesList">
            <RouterLink
              :to="{ name: 'Page', params: { id: page.id } }"
              custom
              v-slot="{ isExactActive, href, navigate }"
            >
              <a
                :data-active="isExactActive"
                :href="href"
                :title="page.title"
                @click="navigate"
              >
                <FileCheck2 />
                <span data-clamp>{{ page.title }}</span>
              </a>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </template>

    <RouterView />
  </VLayout>
</template>
