import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { parseTelegramContentLink, parseTelegramContentPlatform } from '../../lib/notifications/telegramContentLinks'
import { parseInstagramPublicMetadata, parseTikTokPublicMetadata } from '../../lib/notifications/telegramPublicMetadata'
import {
  contentPerformanceValue,
  formatTelegramContentList,
  sortTelegramSavedContent,
  type TelegramSavedContent,
} from '../../lib/notifications/telegramContentPresentation'

const base: TelegramSavedContent = {
  id: '11111111-1111-4111-8111-111111111111', chat_id: '123456789', platform: 'tiktok',
  canonical_url: 'https://www.tiktok.com/@kade/video/1234567890123456789', title: 'Örnek video',
  description: null, author_name: '@kade', views: null, likes: null, comments: null, shares: null, saves: null,
  metadata_source: 'TikTok resmî oEmbed', metrics_source: null, metrics_status: 'unavailable',
  metric_updated_at: null, added_at: '2026-09-28T07:00:00.000Z', updated_at: '2026-09-28T07:00:00.000Z',
}

test('social content links are canonicalized and tracking parameters are removed', () => {
  assert.deepEqual(parseTelegramContentLink('bak https://www.instagram.com/reel/AbC_123/?utm_source=x.'), {
    platform: 'instagram', url: 'https://www.instagram.com/reel/AbC_123/?utm_source=x',
    canonicalUrl: 'https://www.instagram.com/reel/AbC_123/', externalId: 'AbC_123', needsResolution: false,
  })
  assert.deepEqual(parseTelegramContentLink('https://m.tiktok.com/@kade/video/1234567890123456789?is_from_webapp=1'), {
    platform: 'tiktok', url: 'https://m.tiktok.com/@kade/video/1234567890123456789?is_from_webapp=1',
    canonicalUrl: 'https://www.tiktok.com/@kade/video/1234567890123456789', externalId: '1234567890123456789', needsResolution: false,
  })
  assert.deepEqual(parseTelegramContentLink('https://www.tiktok.com/@kade/photo/7689990769498754324?_r=1'), {
    platform: 'tiktok', url: 'https://www.tiktok.com/@kade/photo/7689990769498754324?_r=1',
    canonicalUrl: 'https://www.tiktok.com/@kade/photo/7689990769498754324', externalId: '7689990769498754324', needsResolution: false,
  })
  assert.equal(parseTelegramContentLink('https://evil.example/reel/AbC_123/'), null)
  assert.equal(parseTelegramContentLink('https://vm.tiktok.com/ZMExample/ABC')?.needsResolution, true)
  assert.equal(parseTelegramContentPlatform('TikTok içerikleri'), 'tiktok')
})

test('public social pages provide honest fallback titles when official oEmbed is unavailable', () => {
  const instagram = parseInstagramPublicMetadata(`
    <meta property="og:title" content="Hakan Y&#x131;lmaz on Instagram: &quot;Hahshshsh &#064;hakobenx&quot;" />
    <meta property="og:description" content="2,330 likes - hakobenx: &quot;Hahshshsh&quot;" />
  `)
  assert.equal(instagram?.title, 'Hahshshsh @hakobenx')
  assert.equal(instagram?.authorName, 'Hakan Yılmaz')

  const tiktokPayload = JSON.stringify({
    __DEFAULT_SCOPE__: {
      'webapp.video-detail': {
        itemInfo: { itemStruct: {
          desc: 'En iyi sandviçi yapan kazanır!',
          author: { uniqueId: 'tasariminho', nickname: 'Tasarımınho' },
          video: { cover: 'https://cdn.example/cover.jpg' },
        } },
      },
    },
  })
  const tiktok = parseTikTokPublicMetadata(`<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">${tiktokPayload}</script>`)
  assert.equal(tiktok?.title, 'En iyi sandviçi yapan kazanır!')
  assert.equal(tiktok?.authorName, '@tasariminho')
  assert.equal(tiktok?.thumbnailUrl, 'https://cdn.example/cover.jpg')
})

test('content ranking uses real views first, engagement fallback second, then recency', () => {
  const viewed = { ...base, id: '22222222-2222-4222-8222-222222222222', views: 1000, added_at: '2026-09-27T07:00:00.000Z' }
  const engaged = { ...base, id: '33333333-3333-4333-8333-333333333333', likes: 100, comments: 20, shares: 5 }
  const empty = { ...base, id: '44444444-4444-4444-8444-444444444444', added_at: '2026-09-29T07:00:00.000Z' }
  assert.equal(contentPerformanceValue(engaged), 185)
  assert.deepEqual(sortTelegramSavedContent([empty, engaged, viewed], 'performance').map((row) => row.id), [viewed.id, engaged.id, empty.id])
})

test('content list explicitly labels unavailable metrics and includes source/update time', () => {
  const output = formatTelegramContentList([base], { title: 'Kayıtlı içerikler', sort: 'performance' })
  assert.match(output, /Performans: veri alınamadı/)
  assert.match(output, /Kaynak: TikTok resmî oEmbed/)
  assert.match(output, /Kod: 11111111/)
  assert.ok(output.length <= 4096)
})

test('content list uses a stable platform and content-code label when a public title is unavailable', () => {
  const output = formatTelegramContentList([{ ...base, title: null, description: null }], {
    title: 'Kayıtlı içerikler', sort: 'latest',
  })
  assert.match(output, /TikTok videosu · 1234567890123456789/)
  assert.doesNotMatch(output, /Başlık alınamadı/)
})

test('Telegram content persistence is service-role only and cron uses Istanbul 09:00/12:00', async () => {
  const migration = await readFile(new URL('../../supabase/migrations/202609280001_telegram_saved_social_content.sql', import.meta.url), 'utf8')
  assert.match(migration, /UNIQUE \(chat_id, canonical_url\)/)
  assert.match(migration, /telegram_saved_content FORCE ROW LEVEL SECURITY/)
  assert.match(migration, /REVOKE ALL ON public\.telegram_saved_content[\s\S]+FROM anon, authenticated/)
  const cron = await readFile(new URL('../../deploy/keyubu/kadexai.cron', import.meta.url), 'utf8')
  assert.match(cron, /^0 6 \* \* \* root .*slot=09/m)
  assert.match(cron, /^0 9 \* \* \* root .*slot=12/m)
  const route = await readFile(new URL('../../app/kadexai/api/telegram/content-digest/route.ts', import.meta.url), 'utf8')
  assert.match(route, /hasCronAccess/)
  assert.match(route, /hour !== '09' && hour !== '12'/)
})

test('Telegram delegated access is persistent, service-role only, and primary-owner approved', async () => {
  const migration = await readFile(new URL('../../supabase/migrations/202609280002_telegram_bot_user_access.sql', import.meta.url), 'utf8')
  assert.match(migration, /status IN \('pending', 'active', 'revoked'\)/)
  assert.match(migration, /telegram_bot_users FORCE ROW LEVEL SECURITY/)
  assert.match(migration, /REVOKE ALL ON public\.telegram_bot_users FROM anon, authenticated/)

  const webhook = await readFile(new URL('../../app/kadexai/api/telegram/webhook/route.ts', import.meta.url), 'utf8')
  assert.match(webhook, /config\.chatIds\.includes\(action\.actorId\)/)
  assert.match(webhook, /if \(!primaryOwner\) return '🔒 Telegram hesap yetkilerini yalnız ana sahip hesabı yönetebilir\.'/)
  assert.match(webhook, /requestTelegramUserAccess/)
  assert.match(webhook, /approveTelegramUser/)
})

test('Telegram private accounts and groups use the primary owner shared content library', async () => {
  const webhook = await readFile(new URL('../../app/kadexai/api/telegram/webhook/route.ts', import.meta.url), 'utf8')
  const commands = await readFile(new URL('../../lib/notifications/telegramCommands.ts', import.meta.url), 'utf8')

  assert.match(webhook, /contentLibraryChatId: primaryOwnerIds\[0\] \?\? action\.chatId/)
  assert.match(commands, /listTelegramContent\(\{ chatId: contentLibraryChatId\(context\)/)
  assert.match(commands, /saveTelegramContent\(\{ chatId: contentLibraryChatId\(context\)/)
})
