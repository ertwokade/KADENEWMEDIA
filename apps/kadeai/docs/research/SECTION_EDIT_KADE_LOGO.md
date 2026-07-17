# KADE Logo Section Edit

## Hedefler

- Giriş ekranındaki geçici ikon ve `KADE AI` yazısını kullanıcının sağladığı yatay KADE logosuyla değiştirmek.
- Dashboard sol menüsündeki geçici ikon ve marka metnini aynı logo bileşeniyle değiştirmek.

## Etkilenen alanlar

- `app/auth/page.tsx`: `/login` ve `/auth` rotalarının ortak giriş ekranı.
- `components/layout/Sidebar.tsx`: tüm dashboard rotalarının uygulama kabuğu.
- `components/brand/KadeLogo.tsx`: ortak logo sunumu.
- `public/brand/kade-logo.svg`: sağlanan görseli temel alan ölçeklenebilir marka varlığı.

## Görsel ve responsive beklentiler

- Logonun yaklaşık `512:181` yatay oranı korunmalı.
- Giriş ekranında form kartının üzerinde ortalanmalı.
- Sol menüde 272 px genişliğe taşmadan okunaklı kalmalı.
- Mobil menüde kapatma düğmesi için yeterli boşluk bırakılmalı.
- Logo zemini şeffaf kalmalı; giriş ve uygulama arka planlarına ek bir kutu eklememeli.

## Doğrulama

- `/kadeai/login` masaüstü ve mobil görünüm kontrolü.
- `/kadeai/dashboard` uygulama kabuğunda sol menü kontrolü.
- Logo varlığı ve base path üzerinden yüklenme kontrolü.
- TypeScript ve ESLint kontrolü.
