import assert from "node:assert/strict";
import { afterEach, before, describe, mock, test } from "node:test";
import { ref } from "vue";
import { parse } from "../lib/parser.ts";
import type { usePage as usePageFn } from "./page.ts";

describe("usePage", () => {
  let mocks = { updatePage: mock.fn() };
  let usePage: typeof usePageFn;

  before(async () => {
    mock.module("./pages.ts", {
      namedExports: {
        usePages: () => ({
          pages: {
            foo: { id: "foo", items: [parse("Page 1"), parse("[ ] Task")] },
            bar: { id: "bar", items: [parse("Page 2"), parse("[ ] Task")] },
            baz: { id: "bar", items: [] },
          },
          updatePage: mocks.updatePage,
        }),
      },
    });

    usePage = (await import("./page.ts")).usePage;
  });

  afterEach(() => {
    mocks.updatePage.mock.resetCalls();
  });

  test("returns the page with the ID", () => {
    const { page } = usePage("foo");
    assert.ok(page.value);
  });

  test("returns no page if it doesn't exist", () => {
    const { page } = usePage("🐸");
    assert.equal(page.value, undefined);
  });

  test("returns a different page when the ID changes", () => {
    const id = ref("foo");
    const { page } = usePage(id);

    assert.equal(page.value.id, "foo");

    id.value = "bar";
    assert.equal(page.value.id, "bar");
  });

  test("indicates that the page exists", () => {
    const { pageExists } = usePage("foo");
    assert.equal(pageExists.value, true);
  });

  test("indicates that the page doesn't exist", () => {
    const { pageExists } = usePage("🐸");
    assert.equal(pageExists.value, false);
  });

  test("indicates whether the page exists after ID change", () => {
    const id = ref("foo");
    const { pageExists } = usePage(id);

    assert.equal(pageExists.value, true);

    id.value = "🐸";
    assert.equal(pageExists.value, false);
  });

  test("returns the title", () => {
    const { pageTitle } = usePage("foo");
    assert.equal(pageTitle.value, "Page 1");
  });

  test("returns no title if the page doesn't exist", () => {
    const { pageTitle } = usePage("🐸");
    assert.equal(pageTitle.value, undefined);
  });

  test("returns the title after ID change", () => {
    const id = ref("foo");
    const { pageTitle } = usePage(id);

    assert.equal(pageTitle.value, "Page 1");

    id.value = "🐸";
    assert.equal(pageTitle.value, undefined);
  });

  test("returns the text of the page", () => {
    const { pageText } = usePage("foo");

    assert.equal(pageText.value, "Page 1\n[ ] Task");
  });

  test("returns the text of an empty page", () => {
    const { pageText } = usePage("baz");

    assert.equal(pageText.value, "");
  });

  test("returns no text if the page doesn't exist", () => {
    const { pageText } = usePage("🐸");

    assert.equal(pageText.value, undefined);
  });

  test("returns the text after ID change", () => {
    const id = ref("foo");
    const { pageText } = usePage(id);

    assert.equal(pageText.value, "Page 1\n[ ] Task");

    id.value = "🐸";
    assert.equal(pageText.value, undefined);
  });

  test("replaces the page content based on text changes", () => {
    const { pageText } = usePage("foo");

    pageText.value = "Page 2\n\n[ ] Foo";

    assert.deepStrictEqual(mocks.updatePage.mock.calls[0].arguments, [
      "foo",
      { items: [parse("Page 2"), parse(""), parse("[ ] Foo")] },
    ]);
  });

  test("does nothing when changing text of a non-existent page", () => {
    const { pageText } = usePage("🐸");

    pageText.value = "This should not work";

    assert.equal(mocks.updatePage.mock.callCount(), 0);
  });

  test("updates an item on the page", () => {
    const { updateOnPage } = usePage("foo");

    updateOnPage(1, (item) => {
      item.type = "note";
    });

    const { items } = mocks.updatePage.mock.calls[0].arguments[1];
    assert.deepEqual(items[1], parse("Task"));
  });

  test("does nothing when updating an item on a non-existent page", () => {
    const { updateOnPage } = usePage("🐸");

    updateOnPage(0, (item) => {
      item.type = "note";
    });

    assert.equal(mocks.updatePage.mock.callCount(), 0);
  });
});
