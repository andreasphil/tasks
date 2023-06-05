export function uid() {
  return Math.round(Math.random() * 10 ** 16)
    .toString()
    .padEnd(16, "0");
}

/**
 * @template {object} T
 * @param {T | undefined} init
 * @returns {T}
 */
export function createModel(init) {
  const now = new Date().getTime();
  init = init ? structuredClone(init) : {};
  return { id: uid(), createdAt: now, updatedAt: now, ...init };
}

/**
 * @param {object} model
 * @param {number} updatedAt
 */
export function touch(model) {
  model.updatedAt = new Date().getTime();
}
