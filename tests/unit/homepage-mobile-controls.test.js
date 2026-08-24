import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'

const brandJs = await readFile(new URL('../../haoqi-clone/kade-brand.js', import.meta.url), 'utf8')
const brandCss = await readFile(new URL('../../haoqi-clone/kade-brand.css', import.meta.url), 'utf8')
const transform = await readFile(new URL('../../haoqi-clone/kade-html-transform.mjs', import.meta.url), 'utf8')

test('mobil kontroller görsel başlıkla aynı DOM sırasına kurulur', () => {
  assert.match(brandJs, /document\.querySelector\('header'\)\|\|document\.body/)
  assert.doesNotMatch(brandJs, /document\.body\.appendChild\(nav\)/)
})

test('mobil birincil kontroller en az 44 piksel hedef kullanır', () => {
  assert.match(brandCss, /\.kade-mobile-controls>button\{[^}]*width:44px!important;[^}]*height:44px!important/)
  assert.match(brandCss, /\.kade-language-toggle\{width:44px!important;height:44px!important/)
})

test('statik snapshot kök Link için boşa RSC ön-getirmesi yapmaz', () => {
  assert.match(transform, /prefetch:!1,href:"\/"/)
})

test('mobil ve tablet kahraman alanında açık CTA bulunur', () => {
  assert.match(brandJs, /data-kade-hero-services/)
  assert.match(brandJs, /data-kade-hero-quote/)
  assert.match(brandCss, /@media\(max-width:900px\)\{\.kade-hero-cta\{display:flex\}\}/)
})
