/* Part thumbnails.
 *
 * A part shows a photo only when the shop has a real one: `img` in data.js,
 * or an entry in images.js (generated from img/ by import-images.js).
 * Every other part renders no image area at all; the card starts with its
 * name. No stock photography, no illustrative drawings, no placeholder:
 * a picture on a card must be the part itself.
 */

function photoFor(part) {
  return part.img || (typeof IMAGES !== "undefined" && IMAGES[part.id]) || null;
}

/* If the file 404s or fails to decode, onerror removes the whole thumb, so
   the card ends up exactly like a part with no photo (no broken-image icon). */
function artHTML(part) {
  const photo = photoFor(part);
  if (!photo) return "";
  const esc = s => String(s).replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
  return `<div class="art">
    <img src="${esc(photo)}" alt="${esc(part.name)}" loading="lazy" decoding="async"
         onerror="this.closest('.art').remove();">
  </div>`;
}
