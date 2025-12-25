<script setup lang="ts">
import { fileOpen, fileSave } from "browser-fs-access";
import { ref, watchEffect } from "vue";
import { alert } from "@andreasphil/cap";
import { DownloadCloud, Save, UploadCloud } from "../lib/icons.ts";
import type { AutoLinkRule } from "../lib/parser.ts";
import { usePages } from "../stores/pages.ts";
import { useSettings } from "../stores/settings.ts";

const { settings } = useSettings();

// Auto link rules ----------------------------------------

function parseRules(rules: string): AutoLinkRule[] {
  return rules
    .split("\n")
    .map((i) => i.split(" = "))
    .filter((i) => i.length === 2)
    .map<AutoLinkRule>((i) => ({ pattern: i[0], target: i[1] }));
}

function stringifyRules(rules: AutoLinkRule[]): string {
  return rules.map((i) => `${i.pattern} = ${i.target}`).join("\n");
}

const rulesText = ref("");

watchEffect(() => {
  rulesText.value = stringifyRules(settings.autoLinkRules);
});

function saveRules() {
  settings.autoLinkRules = parseRules(rulesText.value);
  alert("Saved!");
}

// Backups ------------------------------------------------

const { importBackup, exportBackup } = usePages();

async function saveToFile() {
  try {
    await fileSave(
      new Blob([exportBackup()], { type: "application/json" }),
      {
        mimeTypes: ["application/json"],
        extensions: [".json"],
        fileName: `tasks-${Temporal.Now.plainDateISO()}.json`,
      }
    );

    alert("Backup saved!");
  } catch {
    alert("Failed to save backup.");
  }
}

async function openFromFile() {
  try {
    const text = await fileOpen({
      multiple: false,
      mimeTypes: ["application/json"],
      extensions: [".json"],
    }).then((blob) => blob.text());

    importBackup(text);
  } catch {
    alert("Failed to load backup.");
  }
}
</script>

<template>
  <article class="settings">
    <h1>Settings</h1>
    <hr />
    <section class="trim">
      <hgroup>
        <h2>Automatic Links</h2>
        <p>
          Automatic links allow you to specify patterns that will be converted
          into links. You can use this, for example, to link to Jira issues or
          GitHub PRs. Define the rules below as
          <code>pattern = template</code> like this, one per line:
        </p>
        <pre>(EXAMPLE-\\d+) = https://example.com/$1</pre>
      </hgroup>
      <textarea class="editor" rows="5" v-model="rulesText" />
      <div class="actions">
        <button @click="saveRules" variant="secondary">
          <span v-html="Save" />
          Save
        </button>
      </div>
    </section>
    <hr />
    <section class="trim">
      <hgroup>
        <h2>Backup</h2>
        <p>
          Use the buttons below to download or restore a backup of all your
          pages. If you restore a backup, pages that already exist will be
          overwritten. Pages you added since the backup was created will not
          be affected.
        </p>
      </hgroup>
      <div class="actions">
        <button @click="saveToFile" variant="secondary">
          <span v-html="DownloadCloud" />Download backup
        </button>
        <button @click="openFromFile" variant="muted">
          <span v-html="UploadCloud" />Restore backup
        </button>
      </div>
    </section>
  </article>
</template>
