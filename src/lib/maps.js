// Google Maps links from the CMS come in many shapes (share links, place pages, old embed URLs).
// Share links and place pages refuse to load inside an iframe, which is why the map "sometimes" failed.
// Everything is turned into one embeddable URL, plus plain links that always work in a new tab.

export const SHOP_COORDS = '-6.9825,108.6185'

// maps.google.<tld>/... or (www.)google.<tld>/maps/...
const isGoogleMaps = (u) => /^maps\.google\.[a-z.]+$/.test(u.hostname) || (/^(www\.)?google\.[a-z.]+$/.test(u.hostname) && u.pathname.startsWith('/maps'))

/** Best search query hidden in a Maps URL: ?q=, a /place/<name>/ path, or @lat,lng coordinates. */
function queryFrom(u) {
  const q = u.searchParams.get('q') || u.searchParams.get('query') || u.searchParams.get('destination')
  if (q) return q
  const place = u.pathname.match(/\/place\/([^/]+)/)
  if (place) return decodeURIComponent(place[1].replace(/\+/g, ' '))
  const at = u.pathname.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  return at ? `${at[1]},${at[2]}` : null
}

/**
 * @param {string|null} cmsUrl  whatever the dashboard stored in lokasi.maps_url
 * @param {string} address      shop address, used when the URL carries no usable query
 * @returns {{ embed: string, open: string, directions: string }}
 */
export function mapLinks(cmsUrl, address) {
  let u = null
  // Google's "Sematkan peta" gives a whole <iframe src="..."> snippet; people often paste that instead of a link.
  const raw = String(cmsUrl || '').match(/src=["']([^"']+)["']/)?.[1]?.replace(/&amp;/g, '&') || cmsUrl
  try { u = raw ? new URL(raw) : null } catch { u = null }
  const fallbackQuery = `Dinasti Barbershop, ${address}`

  // Official embed codes (".../maps/embed?pb=...") already work in an iframe.
  if (u && isGoogleMaps(u) && u.pathname.startsWith('/maps/embed')) {
    return { embed: `https://www.google.com${u.pathname}${u.search}`, open: searchUrl(fallbackQuery), directions: directionsUrl(SHOP_COORDS) }
  }
  const query = (u && isGoogleMaps(u) && queryFrom(u)) || fallbackQuery
  // Short share links (maps.app.goo.gl) cannot be read here, but they open fine in a new tab.
  const shareLink = u && /^(maps\.app\.goo\.gl|goo\.gl)$/.test(u.hostname) ? u.href : null
  return {
    embed: `https://www.google.com/maps?q=${encodeURIComponent(query)}&z=17&hl=id&output=embed`,
    open: shareLink || searchUrl(query),
    directions: directionsUrl(query === fallbackQuery ? SHOP_COORDS : query),
  }
}

const searchUrl = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`
const directionsUrl = (dest) => `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}`
