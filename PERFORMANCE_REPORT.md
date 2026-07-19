# Performance Report

## Statik build bulguları

- Root production build: 536 modül, 37 route entry, `dist` 21 MB.
- Büyük root JS dosyaları: Admin yaklaşık 311 KB, OrganizationKitDashboard 283 KB, React vendor 182 KB, root index 175 KB, motion vendor 125 KB.
- Root ana CSS yaklaşık 105 KB.
- KadeAI `.next/static` toplamı yaklaşık 2.5 MB; Next build 41 statik sayfa üretti.
- Buildler hata vermedi; source-level lazy chunks korunuyor.

Lighthouse, LCP, CLS, INP/TBT, FCP, TTFB ve runtime waterfall ölçümü browser olmadığı için **BLOCKED_BY_ENVIRONMENT**. En büyük iki yönetim chunk'ı public landing performansına otomatik olarak yüklenmiyor ancak authenticated route'larda sonraki optimizasyon adayıdır.
