<script setup lang="ts">
import VBackupDialog from "@/components/VBackupDialog.vue";
import VLayout from "@/components/VLayout.vue";
import VRouterLink from "@/components/VRouterLink.vue";
import { usePages } from "@/stores/pages";
import {
  useCommandBar,
  type Command as CommandBarCommand,
} from "@andreasphil/vue-command-bar";
import {
  Bookmark,
  Command,
  DownloadCloud,
  FileCheck2,
  Plus,
  Star,
  Trash2,
} from "lucide-vue-next";
import { onBeforeUnmount, onMounted, ref, toValue, watch } from "vue";
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

const cmdBar = useCommandBar();

let cleanupPages: (() => void) | null = null;

function registerPages(pages: (typeof pagesList)["value"]) {
  cleanupPages?.();

  const commands = toValue(pages).map<CommandBarCommand>((page, i) => ({
    id: `page:open:${page.id}`,
    name: page.title,
    alias: ["page"],
    chord: `g${i + 1}`,
    groupName: "Open",
    icon: FileCheck2,
    action: () => router.push({ name: "Page", params: { id: page.id } }),
    weight: 10,
  }));

  cleanupPages = cmdBar?.registerCommand(...commands) ?? null;
}

watch(pagesList, (pages) => registerPages(pages), { immediate: true });

onBeforeUnmount(() => {
  cleanupPages?.();
});

let cleanupStaticCommands: (() => void) | null = null;

const staticCommands: CommandBarCommand[] = [
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
  {
    id: "open:today",
    name: "Today",
    chord: "gt",
    groupName: "Open",
    icon: Star,
    action: () => router.push({ name: "Today" }),
  },
  {
    id: "open:tags",
    name: "Tags",
    chord: "g#",
    groupName: "Open",
    icon: Bookmark,
    action: () => router.push({ name: "Tags" }),
  },
];

onMounted(() => {
  cleanupStaticCommands = cmdBar?.registerCommand(...staticCommands) ?? null;
});

onBeforeUnmount(() => {
  cleanupStaticCommands?.();
});
</script>

<template>
  <VLayout>
    <template #sidebar>
      <nav>
        <strong>Tasks</strong>

        <!-- Static contents -->
        <ul>
          <li>
            <a href="#" @click.prevent="cmdBar?.open()" class="text-c-variant">
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

          <!-- Smart pages -->
          <li>
            <VRouterLink :to="{ name: 'Today' }">
              <Star />
              Today
            </VRouterLink>
          </li>
          <li>
            <VRouterLink :to="{ name: 'Tags' }">
              <Bookmark />
              Tags
            </VRouterLink>
          </li>
          <li v-if="pagesList.length">
            <hr />
          </li>

          <!-- User pages -->
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
