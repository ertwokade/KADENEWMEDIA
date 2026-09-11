import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeGeneratedHashtags, parseHashtagGroups } from '../../lib/ai/hashtags'

test('hashtag normalleştirmesi Türkçe ve birleşik Unicode harfleri kesmez', () => {
  assert.equal(normalizeGeneratedHashtags('Görüş: #İÇERİK, #GÜÇLÜ #I\u0307stanbul #Şişli'), 'Görüş: #icerik, #guclu #istanbul #sisli')
  assert.equal(normalizeGeneratedHashtags('# Başlık\nhttps://example.test/#İçerik'), '# Başlık\nhttps://example.test/#İçerik')
  assert.deepEqual(JSON.parse(normalizeGeneratedHashtags(JSON.stringify({ caption: 'Yeni içerik\n#İÇERİK' }))), { caption: 'Yeni içerik\n#icerik' })
})

test('düz metin hashtag yedeği Türkçe etiketleri bütün olarak işler', () => {
  assert.deepEqual(parseHashtagGroups('Etiketler: #İçerik #güçlü #Şişli').niche, ['#icerik', '#guclu', '#sisli'])
})

test('JSON grupları normalleştirilir, gruplar arası tekilleştirilir ve toplam sınırı korunur', () => {
  const groups = parseHashtagGroups(JSON.stringify({ yuksek: ['#İÇERİK', '#icerik', null, {}], orta: ['İstanbul', '#Şişli'], dusuk: ['#başka'] }), 3)
  assert.deepEqual(groups, { yuksek: ['#icerik'], orta: ['#istanbul', '#sisli'], dusuk: [], niche: [] })
})

test('kod çitli JSON, düz dizi ve bozuk değerler güvenle işlenir', () => {
  assert.deepEqual(parseHashtagGroups('```json\n{"niche":["#Çalışma"]}\n```').niche, ['#calisma'])
  assert.deepEqual(parseHashtagGroups('["#Örnek"]', 1).niche, ['#ornek'])
  assert.deepEqual(parseHashtagGroups('{"niche":[12,{},"iki kelime","<script>"]}').niche, [])
  assert.deepEqual(parseHashtagGroups('null').niche, [])
})
