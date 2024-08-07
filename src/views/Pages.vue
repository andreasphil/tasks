<script setup lang="ts">
import BackupDialog from "@/components/BackupDialog.vue";
import Layout from "@/components/Layout.vue";
import RouterLink from "@/components/RouterLink.vue";
import { usePages } from "@/stores/pages";
import { useTodayCount } from "@/stores/todayCount";
import {
  useCommandBar,
  type Command as CommandBarCommand,
} from "@andreasphil/vue-command-bar";
import {
  Bookmark,
  Command,
  DownloadCloud,
  FileCheck2,
  KanbanSquare,
  Plus,
  Star,
  Trash2,
} from "lucide-vue-next";
import {
  onBeforeUnmount,
  onMounted,
  onUnmounted,
  ref,
  toValue,
  watch,
} from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();

/* -------------------------------------------------- *
 * Pages                                              *
 * -------------------------------------------------- */

const { pageList, createPage, removePage } = usePages();

function goToNewPage() {
  const newPage = createPage();
  if (newPage) router.push({ name: "Page", params: { id: newPage } });
}

function beginRemovePage() {
  const confirmed = confirm("Are you sure you want to delete this page?");
  const pageId = route.params.id?.toString();

  if (confirmed && pageId) {
    removePage(pageId);
    const nextPage = pageList.value[0]?.id;
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

function registerPages(pages: (typeof pageList)["value"]) {
  cleanupPages?.();

  const commands = toValue(pages).map<CommandBarCommand>((page, i) => ({
    id: `page:open:${page.id}`,
    name: page.title,
    alias: ["page"],
    chord: (i + 1).toString(),
    groupName: "Open",
    icon: FileCheck2,
    action: () => router.push({ name: "Page", params: { id: page.id } }),
    weight: 10,
  }));

  cleanupPages = cmdBar?.registerCommand(...commands) ?? null;
}

watch(pageList, (pages) => registerPages(pages), { immediate: true });

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
    alias: ["import", "export"],
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
    id: "open:board",
    name: "Board",
    chord: "gb",
    groupName: "Open",
    icon: KanbanSquare,
    action: () => router.push({ name: "Board" }),
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

/* -------------------------------------------------- *
 * Badging integration                                *
 * -------------------------------------------------- */

const todayCount = useTodayCount();

watch(
  todayCount,
  (count) => {
    console.log(count, navigator.setAppBadge);
    if (count <= 0) navigator.clearAppBadge?.();
    else navigator.setAppBadge?.(count);
  },
  { immediate: true }
);

onUnmounted(() => {
  navigator.clearAppBadge?.();
});
</script>

<template>
  <Layout>
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
            <RouterLink :to="{ name: 'Today' }">
              <Star />
              Today
              <span v-if="todayCount > 0" :class="$style.todayBadge">{{
                todayCount
              }}</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'Board' }">
              <KanbanSquare />
              Board
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'Tags' }">
              <Bookmark />
              Tags
            </RouterLink>
          </li>
          <li v-if="pageList.length">
            <hr />
          </li>

          <!-- User pages -->
          <li v-for="page in pageList">
            <RouterLink :to="{ name: 'Page', params: { id: page.id } }">
              <FileCheck2 />
              <span data-clamp>{{ page.title }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </template>

    <RouterView />

    <BackupDialog v-model="backupDialog" />
  </Layout>
</template>

<style module>
.todayBadge {
  background: var(--primary);
  border-radius: var(--border-radius-large);
  color: var(--on-primary);
  font-size: var(--font-size-small);
  font-weight: var(--font-weight-bold);
  padding: 0 0.5rem;
}
</style>
