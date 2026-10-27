import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeWa, normalizeIg, parseJam, joinJam, todayJakarta, monthRange, greeting, averageCost, groupDigits } from '../lib/format.js'

test('WhatsApp numbers are normalised to 62…', () => {
  assert.equal(normalizeWa('0831-1007-1825'), '6283110071825')
  assert.equal(normalizeWa('+62 831 1007 1825'), '6283110071825')
  assert.equal(normalizeWa('83110071825'), '6283110071825')
  assert.equal(normalizeWa(''), '')
})

test('Instagram handles lose @ and URLs', () => {
  assert.equal(normalizeIg('@dinasti.barbershop'), 'dinasti.barbershop')
  assert.equal(normalizeIg('https://www.instagram.com/dinasti.barbershop/?hl=id'), 'dinasti.barbershop')
})

test('opening hours round-trip between text and time inputs', () => {
  assert.deepEqual(parseJam('16:00 – 21:00'), ['16:00', '21:00'])
  assert.deepEqual(parseJam('9.00-21.00'), ['09:00', '21:00'])
  assert.equal(parseJam('Tutup'), null)
  assert.equal(joinJam('10:00', '21:00'), '10:00 – 21:00')
  // The website's hours parser reads exactly this format.
  assert.deepEqual(parseJam(joinJam('10:00', '21:00')), ['10:00', '21:00'])
})

test('dates follow Jakarta time, not UTC', () => {
  // 23:30 UTC on Oct 26 is already Oct 27 in Jakarta.
  assert.equal(todayJakarta(0, new Date('2026-10-26T23:30:00Z')), '2026-10-27')
  assert.equal(todayJakarta(-1, new Date('2026-10-26T23:30:00Z')), '2026-10-26')
  assert.deepEqual(monthRange('2026-02-14'), { start: '2026-02-01', end: '2026-02-28' })
  assert.deepEqual(monthRange('2026-10-27'), { start: '2026-10-01', end: '2026-10-31' })
  assert.equal(greeting(8), 'Selamat pagi')
  assert.equal(greeting(20), 'Selamat malam')
})

test('margin uses the average service cost, not the sum of every item', () => {
  const hpp = [{ category: 'Layanan', cost: 6000 }, { category: 'Layanan', cost: 8000 }, { category: 'Produk', cost: 35000 }]
  assert.equal(averageCost(hpp), 7000)
  assert.equal(averageCost([{ category: 'Produk', cost: 30000 }]), 30000)
  assert.equal(averageCost([]), 0)
})

test('money inputs group thousands', () => {
  assert.equal(groupDigits('200000'), '200.000')
  assert.equal(groupDigits(''), '')
})
