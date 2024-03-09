<script setup lang="ts">
import VBackupDialog from "@/components/VBackupDialog.vue";
import { VBarContext, type VBarCommand } from "@/components/VBar.vue";
import VLayout from "@/components/VLayout.vue";
import VRouterLink from "@/components/VRouterLink.vue";
import { usePages } from "@/stores/pages";
import {
  Command,
  DownloadCloud,
  FileCheck2,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-vue-next";
import { inject, onBeforeUnmount, onMounted, ref, toValue, watch } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

/* -------------------------------------------------- *
 * Pages                                              *
 * -------------------------------------------------- */

const { pagesList, addPage, removePage } = usePages();

function goToNewPage() {
  const newPage = addPage("");
  if (newPage) router.push({ name: "Page", params: { id: newPage } });
}

function beginRemovePage() {
  const confirmed = confirm("Are you sure you want to delete this page?");
  const pageId = route.params.id?.toString();

  if (confirmed && pageId) {
    removePage(pageId);
    const nextPage = pagesList.value[0]?.id;
    if (nextPage) router.push({ name: "Page", params: { id: nextPage } });
    else router.push({ name: "Welcome" });
  }
}

/* -------------------------------------------------- *
 * Backups                                            *
 * -------------------------------------------------- */

const backupDialog = ref(false);

function beginBackup() {
  backupDialog.value = true;
}

/* -------------------------------------------------- *
 * Command bar integration                            *
 * -------------------------------------------------- */

const vbar = inject(VBarContext, null);

let cleanupPages: (() => void) | null = null;

function registerPages(pages: (typeof pagesList)["value"]) {
  cleanupPages?.();

  const commands = toValue(pages).map<VBarCommand>((page, i) => ({
    id: `page:open-${page.id}`,
    name: page.title,
    alias: ["page"],
    chord: `g${i + 1}`,
    groupName: "Open",
    icon: FileCheck2,
    action: () => router.push({ name: "Page", params: { id: page.id } }),
  }));

  cleanupPages = vbar?.registerCommand(...commands) ?? null;
}

watch(pagesList, (pages) => registerPages(pages), { immediate: true });

onBeforeUnmount(() => {
  cleanupPages?.();
});

let cleanupStaticCommands: (() => void) | null = null;

const staticCommands: VBarCommand[] = [
  {
    id: "pages:new",
    name: "Add page",
    alias: ["new"],
    chord: "pn",
    groupName: "Pages",
    icon: Plus,
    action: goToNewPage,
  },
  {
    id: "pages:delete",
    name: "Delete page",
    alias: ["remove"],
    groupName: "Pages",
    icon: Trash2,
    action: beginRemovePage,
  },
  {
    id: "pages:backup",
    name: "Backup",
    groupName: "Pages",
    icon: DownloadCloud,
    action: beginBackup,
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
        <strong>Textflow</strong>
        <ul>
          <li>
            <a href="#" @click.prevent="vbar?.open()" class="text-c-variant">
              <Command />
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
          <li>
            <VRouterLink :to="{ name: 'Today' }">
              <Sparkles />
              Today
            </VRouterLink>
          </li>
          <li>
            <hr />
          </li>
          <li v-for="page in pagesList">
            <VRouterLink :to="{ name: 'Page', params: { id: page.id } }">
              <FileCheck2 />
              <span data-clamp>{{ page.title }}</span>
            </VRouterLink>
          </li>
        </ul>
      </nav>
    </template>

    <RouterView />

    <VBackupDialog v-model="backupDialog" />
  </VLayout>
</template>
