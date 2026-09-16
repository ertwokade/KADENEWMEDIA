import test from 'node:test'
import assert from 'node:assert/strict'
import {
  checkOfficialSocialAccess,
  instagramAccess,
  mapInstagramGraphMedia,
  resetOfficialSocialCaches,
  searchInstagramGraph,
  searchTikTokResearch,
  tiktokAccess,
  toInstagramHashtag,
} from '../../lib/kade-search/officialSocial'

const TIKTOK_ENV = { TIKTOK_RESEARCH_CLIENT_KEY: 'ck', TIKTOK_RESEARCH_CLIENT_SECRET: 'secret-value' }
const IG_ENV = { INSTAGRAM_GRAPH_ACCESS_TOKEN: 'ig-token-value', INSTAGRAM_BUSINESS_ACCOUNT_ID: '1784000' }

function fakeFetch(handler: (url: string, init?: RequestInit) => { status?: number; body: unknown }) {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const impl = async (url: string, init?: RequestInit) => {
    calls.push({ url, init })
    const { status = 200, body } = handler(url, init)
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  }
  return { impl, calls }
}

test('erişim modu resmi bilgileri çereze tercih eder ve devre dışı bırakmaya uyar', () => {
  assert.equal(tiktokAccess({}).mode, 'none')
  assert.equal(tiktokAccess({ TIKTOK_COOKIE: 'x' }).mode, 'legacy')
  assert.equal(tiktokAccess({ ...TIKTOK_ENV, TIKTOK_COOKIE: 'x' }).mode, 'official')
  assert.equal(tiktokAccess({ TIKTOK_RESEARCH_CLIENT_KEY: 'yalniz-anahtar' }).official, false)
  assert.equal(instagramAccess(IG_ENV).mode, 'official')
  assert.equal(instagramAccess({ ...IG_ENV, KADE_DISABLED_INTEGRATIONS: 'youtube, Instagram' }).live, false)
})

test('TikTok Research API gerçek ölçümleri izlenmeye göre sıralar ve belirteci önbellekler', async () => {
  resetOfficialSocialCaches()
  const { impl, calls } = fakeFetch((url) => url.includes('/oauth/token/')
    ? { body: { access_token: 'tok', expires_in: 7200 } }
    : { body: { data: { videos: [
      { id: '111', username: 'az', video_description: 'Az izlenen tarif #yemek', view_count: 900, like_count: 10, create_time: 1_780_000_000, hashtag_names: ['yemek'] },
      { id: '222', username: 'cok', video_description: 'Çok izlenen tarif', view_count: 5_000_000, like_count: 400_000, comment_count: 9_000, share_count: 1_200 },
      { id: 'gecersiz', username: 'x', view_count: 99_999_999 },
    ] }, error: { code: 'ok' } } })

  const items = await searchTikTokResearch({ query: 'tarif yemek', country: 'TR', periodDays: 7, limit: 10 }, TIKTOK_ENV, impl)
  assert.deepEqual(items.map((item) => item.external_id), ['222', '111'])
  assert.equal(items[0].url, 'https://www.tiktok.com/@cok/video/222')
  assert.equal(items[0].metrics?.views, 5_000_000)
  assert.equal(items[0].rank, 1)
  assert.equal(items[1].title, 'Az izlenen tarif')

  const body = JSON.parse(String(calls[1].init?.body))
  assert.equal(body.query.and[0].field_values[0], 'TR')
  assert.equal(body.query.and.filter((c: { field_name: string }) => c.field_name === 'keyword').length, 2)
  assert.match(body.start_date, /^\d{8}$/)

  await searchTikTokResearch({ query: 'tarif', country: 'TR', periodDays: 7, limit: 10 }, TIKTOK_ENV, impl)
  assert.equal(calls.filter((call) => call.url.includes('/oauth/token/')).length, 1)
})

test('TikTok hataları sır sızdırmayan açıklamaya dönüşür', async () => {
  resetOfficialSocialCaches()
  const { impl } = fakeFetch((url) => url.includes('/oauth/token/')
    ? { body: { access_token: 'tok', expires_in: 7200 } }
    : { status: 429, body: { error: { code: 'rate_limit_exceeded', message: 'secret-value leaked?' } } })
  await assert.rejects(
    searchTikTokResearch({ query: 'a b', country: 'TR', periodDays: 7, limit: 10 }, TIKTOK_ENV, impl),
    (error: Error) => /kotası doldu/.test(error.message) && !error.message.includes('secret-value'),
  )

  resetOfficialSocialCaches()
  const denied = fakeFetch(() => ({ status: 401, body: { error: 'invalid_client' } }))
  await assert.rejects(searchTikTokResearch({ country: 'TR', periodDays: 7, limit: 10 }, TIKTOK_ENV, denied.impl), /belirteci alınamadı/)
})

test('Instagram Graph API yalnız video medyasını alır ve izlenme uydurmaz', async () => {
  resetOfficialSocialCaches()
  const recent = new Date(Date.now() - 3600e3).toISOString()
  const old = new Date(Date.now() - 40 * 86400e3).toISOString()
  const { impl, calls } = fakeFetch((url) => url.includes('/ig_hashtag_search')
    ? { body: { data: [{ id: '1789' }] } }
    : { body: { data: [
      { id: '1', media_type: 'VIDEO', caption: 'Yapay zeka ile video #yapayzeka', permalink: 'https://www.instagram.com/reel/AAA/', like_count: 1200, comments_count: 40, timestamp: recent },
      { id: '2', media_type: 'IMAGE', caption: 'Fotoğraf', permalink: 'https://www.instagram.com/p/BBB/', like_count: 99999, timestamp: recent },
      { id: '3', media_type: 'VIDEO', caption: 'Eski', permalink: 'https://www.instagram.com/reel/CCC/', like_count: 5, timestamp: old },
      { id: '4', media_type: 'VIDEO', caption: 'Kötü bağlantı', permalink: 'https://evil.example/reel', timestamp: recent },
    ] } })

  const items = await searchInstagramGraph({ query: 'Yapay Zeka', country: 'TR', periodDays: 7, limit: 25 }, IG_ENV, impl)
  assert.deepEqual(items.map((item) => item.external_id), ['1'])
  assert.equal(items[0].title, 'Yapay zeka ile video')
  assert.equal(items[0].metrics?.views, undefined)
  assert.equal(items[0].metrics?.likes, 1200)
  assert.match(calls[0].url, /q=yapayzeka/)
  assert.match(calls[1].url, /\/v23\.0\/1789\/top_media\?/)

  await searchInstagramGraph({ query: '#yapayzeka', country: 'TR', periodDays: 7, limit: 25 }, IG_ENV, impl)
  assert.equal(calls.filter((call) => call.url.includes('/ig_hashtag_search')).length, 1, 'hashtag kimliği kotayı korumak için önbelleklenir')
})

test('Instagram belirteç ve kota hataları anlaşılır mesaj verir', async () => {
  resetOfficialSocialCaches()
  const expired = fakeFetch(() => ({ status: 400, body: { error: { code: 190, message: 'ig-token-value' } } }))
  await assert.rejects(
    searchInstagramGraph({ query: 'moda', country: 'TR', periodDays: 7, limit: 10 }, IG_ENV, expired.impl),
    (error: Error) => /süresi dolmuş/.test(error.message) && !error.message.includes('ig-token-value'),
  )
  resetOfficialSocialCaches()
  const quota = fakeFetch(() => ({ status: 400, body: { error: { code: 24 } } }))
  await assert.rejects(searchInstagramGraph({ query: 'moda', country: 'TR', periodDays: 7, limit: 10 }, IG_ENV, quota.impl), /30 farklı hashtag/)
})

test('hashtag dönüştürme Türkçe harfleri korur', () => {
  assert.equal(toInstagramHashtag('#Yemek Tarifi!'), 'yemektarifi')
  assert.equal(toInstagramHashtag('Günlük İçerik'), 'günlükiçerik')
  assert.equal(mapInstagramGraphMedia({ id: '1', media_type: 'CAROUSEL_ALBUM', permalink: 'https://www.instagram.com/p/x/' }, 'x', 'TR', 1), null)
})

test('bağlantı testi Instagram hashtag kotası harcamaz ve eksik bilgileri raporlar', async () => {
  resetOfficialSocialCaches()
  const { impl, calls } = fakeFetch((url) => url.includes('/oauth/token/')
    ? { body: { access_token: 'tok', expires_in: 7200 } }
    : url.includes('graph.facebook.com') ? { body: { id: '1784000', username: 'kadenewmedia' } }
    : { body: { data: { videos: [] }, error: { code: 'ok' } } })
  const checks = await checkOfficialSocialAccess({ ...TIKTOK_ENV, ...IG_ENV }, impl)
  assert.deepEqual(checks.map((check) => check.ok), [true, true])
  assert.match(checks[1].message, /@kadenewmedia/)
  assert.equal(calls.some((call) => call.url.includes('ig_hashtag_search')), false)

  const empty = await checkOfficialSocialAccess({ TIKTOK_COOKIE: 'x' }, impl)
  assert.deepEqual(empty.map((check) => [check.mode, check.ok]), [['legacy', false], ['none', false]])
})
