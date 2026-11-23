/* Part thumbnails.
 *
 * A part shows a photo only when the shop has a real one: `img` in data.js,
 * or an entry in images.js (generated from img/ by import-images.js).
 * Every other part gets the same quiet "no photo yet" panel. No stock
 * photography and no illustrative drawings of parts: a picture on a card
 * must be the part itself.
 */

const NO_PHOTO_ICON = `<svg class="nophoto-ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
  <rect x="3" y="5" width="18" height="14" rx="1.5"/><circle cx="9" cy="10" r="1.6"/><path d="M4 17l5-4.5 3.5 3 3-2.5L20 17"/>
</svg>`;

const NO_PHOTO = `<div class="nophoto">${NO_PHOTO_ICON}<span>No photo yet</span></div>`;

function photoFor(part) {
  return part.img || (typeof IMAGES !== "undefined" && IMAGES[part.id]) || null;
}

/* The placeholder sits under the photo: if the file 404s or fails to decode,
   onerror drops the image and the placeholder shows instead of a broken icon. */
function artHTML(part) {
  const photo = photoFor(part);
  if (!photo) return `<div class="art no-photo">${NO_PHOTO}</div>`;
  const esc = s => String(s).replace(/[&<>"']/g, c => "&#" + c.charCodeAt(0) + ";");
  return `<div class="art has-photo">
    <img src="${esc(photo)}" alt="${esc(part.name)}" loading="lazy" decoding="async"
         onerror="this.closest('.art').classList.replace('has-photo','no-photo'); this.remove();">
    ${NO_PHOTO}
  </div>`;
}
