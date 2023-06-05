/**
 * @typedef {object} Page
 * @prop {string} id
 * @prop {number} createdAt
 * @prop {number} updatedAt
 * @prop {string} text
 */

/**
 * @param {Object} page
 * @param {string} page.text
 */
export function getTitle({ text }) {
  const [firstLine] = text.trim().split("\n");
  return firstLine || "Untitled";
}
