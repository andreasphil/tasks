import { parse } from "@/lib/parser";
import { afterEach, describe, expect, test, vi } from "vitest";
import { usePage } from "./structuredPage";
import { ref } from "vue";

const mocks = vi.hoisted(() => {
  return {
    updatePage: vi.fn(),
    updateOnPage: vi.fn(),
  };
});

vi.mock("@/stores/structuredPages", () => ({
  usePages: () => ({
    pages: {
      foo: { id: "foo", items: [parse("Page 1"), parse("[ ] Task")] },
      bar: { id: "bar", items: [parse("Page 2"), parse("[ ] Task")] },
      baz: { id: "bar", items: [] },
    },
    updatePage: mocks.updatePage,
    updateOnPage: mocks.updateOnPage,
  }),
}));

describe("page store", () => {
  afterEach(() => {
    vi.resetAllMocks();
  });

  test("returns the page with the ID", () => {
    const { page } = usePage("foo");
    expect(page.value).toBeTruthy();
  });

  test("returns no page if it doesn't exist", () => {
    const { page } = usePage("🐸");
    expect(page.value).toBeUndefined();
  });

  test("returns a different page when the ID changes", () => {
    const id = ref("foo");
    const { page } = usePage(id);

    expect(page.value.id).toBe("foo");

    id.value = "bar";
    expect(page.value.id).toBe("bar");
  });

  test("indicates that the page exists", () => {
    const { pageExists } = usePage("foo");
    expect(pageExists.value).toBe(true);
  });

  test("indicates that the page doesn't exist", () => {
    const { pageExists } = usePage("🐸");
    expect(pageExists.value).toBe(false);
  });

  test("indicates whether the page exists after ID change", () => {
    const id = ref("foo");
    const { pageExists } = usePage(id);

    expect(pageExists.value).toBe(true);

    id.value = "🐸";
    expect(pageExists.value).toBe(false);
  });

  test("returns the title", () => {
    const { pageTitle } = usePage("foo");
    expect(pageTitle.value).toBe("Page 1");
  });

  test("returns no title if the page doesn't exist", () => {
    const { pageTitle } = usePage("🐸");
    expect(pageTitle.value).toBeUndefined();
  });

  test("returns the title after ID change", () => {
    const id = ref("foo");
    const { pageTitle } = usePage(id);

    expect(pageTitle.value).toBe("Page 1");

    id.value = "🐸";
    expect(pageTitle.value).toBeUndefined();
  });

  test("returns the text of the page", () => {
    const { pageText } = usePage("foo");

    expect(pageText.value).toBe("Page 1\n[ ] Task");
  });

  test("returns the text of an empty page", () => {
    const { pageText } = usePage("baz");

    expect(pageText.value).toBe("");
  });

  test("returns no text if the page doesn't exist", () => {
    const { pageText } = usePage("🐸");

    expect(pageText.value).toBeUndefined();
  });

  test("returns the text after ID change", () => {
    const id = ref("foo");
    const { pageText } = usePage(id);

    expect(pageText.value).toBe("Page 1\n[ ] Task");

    id.value = "🐸";
    expect(pageText.value).toBeUndefined();
  });

  test("replaces the page content based on text changes", () => {
    const { pageText } = usePage("foo");

    pageText.value = "Page 2\n\n[ ] Foo";

    expect(mocks.updatePage).toHaveBeenCalledWith("foo", {
      items: [parse("Page 2"), parse(""), parse("[ ] Foo")],
    });
  });

  test("does nothing when changing text of a non-existent page", () => {
    const { pageText } = usePage("🐸");

    pageText.value = "This should not work";

    expect(mocks.updatePage).not.toHaveBeenCalled();
  });

  test("updates an item on the page", () => {
    const { updateOnPage } = usePage("foo");

    updateOnPage(0, (item) => {
      item.type = "note";
    });

    expect(mocks.updateOnPage).toHaveBeenCalledWith(
      "foo",
      0,
      expect.any(Function)
    );
  });

  test("does nothing when updating an item on a non-existent page", () => {
    const { updateOnPage } = usePage("🐸");

    updateOnPage(0, (item) => {
      item.type = "note";
    });

    expect(mocks.updateOnPage).not.toHaveBeenCalled();
  });
});
