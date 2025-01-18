<script setup lang="ts">
import BackupDialog from "@/components/BackupDialog.vue";
import Layout from "@/components/Layout.vue";
import RouterLink from "@/components/RouterLink.vue";
import { usePages } from "@/stores/pages";
import { useTodayCount } from "@/stores/todayCount";
import {
  CommandBar,
  renderSvgFromString,
  type Command as CommandBarCommand,
} from "@andreasphil/command-bar";
import {
  Bookmark,
  Command,
  DownloadCloud,
  FileCheck2,
  KanbanSquare,
  Plus,
  Star,
  Trash2,
} from "lucide-static";
import {
  computed,
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

const pageSidebarItems = computed(() =>
  pageList.value.map((page) => {
    const icon = page.title.match(/\p{Emoji_Presentation}\S*/u)?.[0];

    const title = icon
      ? page.title.replace(icon, "").trim() || "Untitled"
      : page.title;

    return { ...page, icon, title };
  })
);

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

const cmdBar = CommandBar.instance;

let cleanupPages: (() => void) | null = null;

function registerPages(pages: (typeof pageList)["value"]) {
  cleanupPages?.();

  const commands = toValue(pages).map<CommandBarCommand>((page, i) => ({
    id: `page:open:${page.id}`,
    name: page.title,
    alias: ["page"],
    chord: (i + 1).toString(),
    groupName: "Open",
    icon: renderSvgFromString(FileCheck2),
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
    icon: renderSvgFromString(Plus),
    action: goToNewPage,
  },
  {
    id: "pages:delete",
    name: "Delete page",
    alias: ["remove"],
    groupName: "Pages",
    icon: renderSvgFromString(Trash2),
    action: beginRemovePage,
  },
  {
    id: "pages:backup",
    name: "Backup",
    alias: ["import", "export"],
    groupName: "Pages",
    icon: renderSvgFromString(DownloadCloud),
    action: beginBackup,
  },
  {
    id: "open:today",
    name: "Today",
    chord: "gt",
    groupName: "Open",
    icon: renderSvgFromString(Star),
    action: () => router.push({ name: "Today" }),
  },
  {
    id: "open:board",
    name: "Board",
    chord: "gb",
    groupName: "Open",
    icon: renderSvgFromString(KanbanSquare),
    action: () => router.push({ name: "Board" }),
  },
  {
    id: "open:tags",
    name: "Tags",
    chord: "g#",
    groupName: "Open",
    icon: renderSvgFromString(Bookmark),
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
            <a
              @click.prevent="cmdBar?.open()"
              href="#"
              style="color: var(--c-fg-variant)"
            >
              <span v-html="Command" />
              Go to anything
            </a>
          </li>
          <li>
            <a
              @click.prevent="goToNewPage()"
              href="#"
              style="color: var(--c-fg-variant)"
            >
              <span v-html="Plus" />
              Add page...
            </a>
          </li>
          <li>
            <hr />
          </li>

          <!-- Smart pages -->
          <li>
            <RouterLink :to="{ name: 'Today' }">
              <span v-html="Star" />
              Today
              <span v-if="todayCount > 0" :class="$style.todayBadge">{{
                todayCount
              }}</span>
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'Board' }">
              <span v-html="KanbanSquare" />
              Board
            </RouterLink>
          </li>
          <li>
            <RouterLink :to="{ name: 'Tags' }">
              <span v-html="Bookmark" />
              Tags
            </RouterLink>
          </li>
          <li v-if="pageSidebarItems.length">
            <hr />
          </li>

          <!-- User pages -->
          <li v-for="page in pageSidebarItems">
            <RouterLink :to="{ name: 'Page', params: { id: page.id } }">
              <span
                v-if="page.icon"
                :class="$style.pageIcon"
                :data-icon="page.icon"
              >
                {{ page.icon }}
              </span>
              <span v-else v-html="FileCheck2" />
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

.pageIcon {
  line-height: 1;
  position: relative;
  z-index: 1;

  &::after {
    content: attr(data-icon);
    filter: blur(10px) saturate(1.5) brightness(1.25);
    font-size: inherit;
    inset: 0;
    line-height: inherit;
    opacity: 0.75;
    position: absolute;
    z-index: -1;
  }
}

@media (prefers-color-scheme: dark) {
  .pageIcon::after {
    filter: blur(10px) saturate(1.5) brightness(0.75);
  }
}
</style>
