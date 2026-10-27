// End-to-end checks against the built site.
// Run: npm run build && npx vite preview --port 5200, then: node tests/site.test.cjs
// Needs Playwright (npm i -D playwright && npx playwright install chromium).
const { chromium } = require('playwright')
const URL = process.env.SITE_URL || 'http://127.0.0.1:5200/'
const fail = (m) => { throw new Error(m) }

;(async () => {
  const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {})
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []
  page.on('pageerror', e => errors.push(String(e)))
  page.on('console', m => m.type() === 'error' && errors.push(m.text()))

  // The prerendered HTML already contains the page before any JS runs.
  const raw = await (await page.request.get(URL)).text()
  if (!raw.includes('id="hero-title"') || !raw.includes('Menu')) fail('index.html is not prerendered')
  await page.goto(URL, { waitUntil: 'networkidle' })

  // Shop name is Dinasti everywhere. "Ikbar" stays only for the barber himself (his profile section)
  // and the one "dulu dikenal sebagai Ikbar Barbershop" line.
  const leftovers = await page.evaluate(() => {
    const barber = document.getElementById('barber').innerText
    return (document.body.innerText.replace(barber, '').match(/ikbar(?!\s+kamil)/gi) || []).length
  })
  if (leftovers !== 1) fail(`Expected one "dulu Ikbar Barbershop" mention, found ${leftovers}`)

  // Booking builder writes the chosen service, day and time into the WhatsApp message.
  await page.selectOption('#bk-service', 'Skin Fade')
  const day = page.locator('.day-chip:not(.is-off)').nth(1)
  await day.click()
  const firstSlot = await page.$eval('#bk-time option:nth-child(2)', o => o.value)
  await page.selectOption('#bk-time', firstSlot)
  const msg = decodeURIComponent(await page.getAttribute('.booker-send', 'href'))
  if (!msg.includes('Layanan: Skin Fade') || !msg.includes(`Jam: ${firstSlot} WIB`) || !msg.includes('• Hari: ')) fail(`Booking message incomplete: ${msg}`)

  // Gallery: filter and lightbox.
  await page.locator('.filters button', { hasText: 'Video' }).click()
  if (await page.locator('.masonry img').count()) fail('Video filter still shows photos')
  await page.locator('.filters button', { hasText: 'Semua' }).click()
  await page.locator('.masonry li button').first().click()
  await page.locator('dialog.lightbox').waitFor({ state: 'visible', timeout: 3000 }).catch(() => fail('Lightbox did not open'))
  await page.keyboard.press('ArrowRight')
  if (!(await page.textContent('.lb-caption')).includes('2 /')) fail('Lightbox navigation failed')
  await page.keyboard.press('Escape')
  await page.locator('dialog.lightbox').waitFor({ state: 'hidden', timeout: 3000 }).catch(() => fail('Lightbox did not close'))

  // Map: not loaded up front, loads on approach with an embeddable URL, and the plain links always work.
  const fresh = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await fresh.goto(URL, { waitUntil: 'networkidle' })
  if (await fresh.locator('.map iframe').count()) fail('Map iframe loaded on first paint')
  await fresh.close()
  await page.locator('#lokasi').scrollIntoViewIfNeeded()
  await page.locator('.map iframe').waitFor({ state: 'attached', timeout: 3000 }).catch(() => fail('Map did not load on approach'))
  if (!/^https:\/\/www\.google\.com\/maps(\/embed)?\?.*(output=embed|pb=)/.test(await page.getAttribute('.map iframe', 'src'))) fail('Map iframe is not an embed URL')
  if (!(await page.getAttribute('.map-actions a', 'href')).startsWith('https://www.google.com/maps/dir/')) fail('Directions link missing')

  // Floating WhatsApp stays out of the hero.
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(300)
  if (!(await page.locator('.wa-float').evaluate(el => el.classList.contains('is-hidden')))) fail('WhatsApp bubble covers the hero')
  await page.evaluate(() => scrollTo({ top: 2500, behavior: 'instant' })); await page.waitForTimeout(300)
  if (await page.locator('.wa-float').evaluate(el => el.classList.contains('is-hidden'))) fail('WhatsApp bubble missing after the hero')

  // Small phones: nothing spills sideways, and the menu fills the screen after scrolling.
  await page.setViewportSize({ width: 360, height: 740 })
  await page.reload({ waitUntil: 'networkidle' })
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  if (overflow > 0) fail(`Page overflows by ${overflow}px at 360px`)
  const clipped = await page.$$eval('.hero-copy *', els => els.filter(e => e.getBoundingClientRect().right > innerWidth + 1).map(e => e.className || e.tagName))
  if (clipped.length) fail(`Hero content cut off: ${clipped.join(', ')}`)
  await page.evaluate(() => scrollTo({ top: 1800, behavior: 'instant' })); await page.waitForTimeout(300)
  await page.locator('.menu-toggle').click()
  await page.locator('.nav.is-open .nav-links').waitFor({ state: 'visible' })
  const h = await page.locator('#nav-links').evaluate(el => el.getBoundingClientRect().height)
  if (h < 600) fail(`Mobile menu collapsed to ${h}px`)

  if (errors.length) fail(`Console errors (hydration?): ${errors.join(' | ')}`)
  console.log('Site checks passed')
  await browser.close()
})().catch(e => { console.error(e.message); process.exit(1) })
