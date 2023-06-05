/** @returns {Promise<string[]>} */
export async function listPageIds() {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    if (localStorage.key(i).startsWith("page_")) keys.push(localStorage.key(i));
  }

  return keys.map((key) => key.replace("page_", ""));
}

/** @returns {Promise<import("./page").Page[]>} */
export async function listPages() {
  let ids = await listPageIds();

  let pages = [];
  for (let id in ids) {
    let page = await fetchPage(ids[id]);
    pages.push(page);
  }

  return pages;
}

/**
 * @param {string} id
 * @returns {Promise<import("./page").Page>}
 */
export async function fetchPage(id) {
  const raw = localStorage.getItem(`page_${id}`);
  if (!raw) throw new Error(`Page with ID ${id} doesn't exist!`);

  try {
    const parsed = JSON.parse(raw);
    return parsed;
  } catch {
    throw new Error(`Failed to restore page with ID ${id} from storage!`);
  }
}

/** @param {string} id */
export async function deletePage(id) {
  localStorage.removeItem(`page_${id}`);
}

/**
 * @param {string} id
 * @param {import("./page").Page} payload
 */
export async function patchPage(id, payload) {
  const raw = JSON.stringify(payload);
  localStorage.setItem(`page_${id}`, raw);
}
