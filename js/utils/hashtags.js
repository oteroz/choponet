// Hashtags — extracción y linkificación.
//
// Reglas:
// - Tag = `#` seguido de 1 a 30 chars de letras (Unicode), números, o `_`.
// - Lookbehind: el `#` no puede estar precedido por letra/número (evita falsos
//   positivos en URLs tipo "ej.com#anchor" cuando van pegados a texto).
// - Normalización: lowercase para indexar/buscar (insensible a mayúsculas).
// - Soporta tildes y ñ: `#chismeenseñao` es un tag válido.

const TAG_REGEX = /(?<![\p{L}\p{N}])#([\p{L}\p{N}_]{1,30})/gu;

function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Extrae los hashtags únicos (lowercase) de un texto.
 * @param {string} text
 * @returns {string[]}
 */
export function extractHashtags(text) {
  if (!text) return [];
  const tags = new Set();
  for (const match of text.matchAll(TAG_REGEX)) {
    tags.add(match[1].toLowerCase());
  }
  return Array.from(tags);
}

/**
 * Escapa HTML y convierte hashtags en enlaces clickeables que navegan
 * a la vista filtrada por tag (ruta #/tag/:name).
 * @param {string} text
 * @returns {string} HTML seguro listo para innerHTML
 */
export function escapeAndLinkifyHashtags(text) {
  const escaped = escapeHtml(text);
  return escaped.replace(TAG_REGEX, (_match, tag) => {
    const lower = tag.toLowerCase();
    return `<a class="hashtag" href="#/tag/${encodeURIComponent(lower)}">#${escapeHtml(tag)}</a>`;
  });
}
