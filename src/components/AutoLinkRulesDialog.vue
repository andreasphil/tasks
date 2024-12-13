<script setup lang="ts">
import Dialog from "@/components/Dialog.vue";
import { AutoLinkRule } from "@/lib/parser";
import { useSettings } from "@/stores/settings";
import { Check } from "lucide-static";
import { ref, watchEffect } from "vue";

const visible = defineModel<boolean>({ default: false });

const { settings } = useSettings();

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

function saveAndClose() {
  settings.autoLinkRules = parseRules(rulesText.value);
  visible.value = false;
}
</script>

<template>
  <Dialog title="Automatic links" v-model="visible">
    <p>
      Automatic links allow you to specify patterns that will be converted into
      links. You can use this, for example, to link to Jira issues or GitHub
      PRs. Define the rules below as <code>pattern = template</code> like this,
      one per line:
    </p>
    <pre>(EXAMPLE-\d+) = https://example.com/$1</pre>
    <textarea rows="5" class="text-mono" v-model="rulesText" />

    <template #footer>
      <button @click="visible = false" data-variant="ghost">Cancel</button>
      <button @click="saveAndClose()"><span v-html="Check" />Save</button>
    </template>
  </Dialog>
</template>
