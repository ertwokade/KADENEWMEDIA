import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyCompanyBriefText,
  MAX_COMPANY_BRIEF_LENGTH,
  SAMPLE_COMPANY_BRIEF_DOWNLOADS,
} from '../../lib/profile/brief'
import { EMPTY_ACCOUNT_CONTEXT, normalizeAccountContext } from '../../lib/profile/types'

test('Markdown briefini şirket profiline dağıtır ve ham metni saklar', () => {
  const brief = `# Şirket Briefi
## Marka adı
Lunera Coffee
## Sektör / niş
Nitelikli kahve
## Ürün ve hizmetler
- Kahve aboneliği
- Atölye
## Tercih edilen platformlar
Instagram, LinkedIn
## Dil
Türkçe`

  const result = applyCompanyBriefText(normalizeAccountContext(EMPTY_ACCOUNT_CONTEXT), brief)

  assert.equal(result.account.brand.name, 'Lunera Coffee')
  assert.equal(result.account.brand.niche, 'Nitelikli kahve')
  assert.deepEqual(result.account.brand.products, ['Kahve aboneliği', 'Atölye'])
  assert.deepEqual(result.account.preferences.platforms, ['Instagram', 'LinkedIn'])
  assert.equal(result.account.preferences.language, 'tr')
  assert.equal(result.account.brand.description, brief)
  assert.ok(result.importedFields.includes('Marka adı'))
})

test('JSON briefini de okuyabilir', () => {
  const result = applyCompanyBriefText(normalizeAccountContext(EMPTY_ACCOUNT_CONTEXT), JSON.stringify({
    brandName: 'Kade Studio',
    audience: 'KOBİ yöneticileri',
    keywords: ['strateji', 'içerik'],
  }))

  assert.equal(result.account.brand.name, 'Kade Studio')
  assert.equal(result.account.brand.audience, 'KOBİ yöneticileri')
  assert.deepEqual(result.account.brand.keywords, ['strateji', 'içerik'])
})

test('brief boyutunu güvenli üst sınırda keser', () => {
  const result = applyCompanyBriefText(
    normalizeAccountContext(EMPTY_ACCOUNT_CONTEXT),
    'x'.repeat(MAX_COMPANY_BRIEF_LENGTH + 500)
  )

  assert.equal(result.account.brand.description.length, MAX_COMPANY_BRIEF_LENGTH)
})

test('örnek brief MD, PDF ve Word biçimlerinde sunulur', () => {
  assert.deepEqual(
    SAMPLE_COMPANY_BRIEF_DOWNLOADS.map(({ label }) => label),
    ['MD', 'PDF', 'Word']
  )
  assert.deepEqual(
    SAMPLE_COMPANY_BRIEF_DOWNLOADS.map(({ path }) => path.split('.').pop()),
    ['md', 'pdf', 'docx']
  )
})
