# TractorVS Forum — canlı kimlik doğrulama geri dönüş ve OAuth kurulum kılavuzu (21.11.2026)

## Kullanıcı tarafından doğrulanan arızalar
- Google OAuth tıklanınca HTTP 400 ve provider is not enabled: Supabase Dashboard'daki Google provider kapalı.
- E-postadaki Magic Link localhost:3000 adresine yönlendi ve otp_expired hatası verdi. Canlı dönüş adresi tractorvs.com olmalıdır. Eski linkteki süre dolmuş OTP tekrar kullanılmaz.
- Var olan onaylanmış e-posta hesabı asla silinmemeli veya test için yeniden açılmamalıdır.

## Web uygulaması iyileştirmesi
- İstemci, publishable key ile GET /auth/v1/settings sonucundaki external.google ve external.github bayraklarını denetler.
- Kapalı OAuth sağlayıcıları gizlenir ve doğrudan /authorize üzerindeki ham JSON hatasına gönderilmez.
- Yeni OTP, şifreli kayıt, şifre sıfırlama ve OAuth isteklerinde, üretimde https://tractorvs.com ana adresiyle mevcut dilin forum yolunu içeren redirect_to gönderilir.

## Supabase Authentication > URL Configuration — elle gerekli
1. Site URL = https://tractorvs.com/ ; eski http://localhost:3000 varsayılanını değiştir.
2. Şu exact additional redirect URL adreslerini ekle:
https://tractorvs.com/forum/
https://tractorvs.com/tr/forum/
https://tractorvs.com/zh/forum/
https://tractorvs.com/hi/forum/
https://tractorvs.com/pt-br/forum/
https://tractorvs.com/fr/forum/
https://tractorvs.com/de/forum/
https://tractorvs.com/ru/forum/
https://tractorvs.com/ja/forum/
https://tractorvs.com/es/forum/
3. Giriş yapılan yayımlanmış dinamik konu URL'lerini desteklemek için her dilde yalnız forum altına sınırlı ** wildcard yolu ekle (ör. https://tractorvs.com/tr/forum/**); keyfi haricî URL veya localhost adresi ekleme.

## Authentication > Email Templates
- Confirm signup, Magic Link, Reset Password ve gerekiyorsa Invite şablonlarını incele.
- Varsayılan Supabase implicit confirmation bağlantısını {{ .ConfirmationURL }} kullanarak oluştur. {{ .SiteURL }} ile localhost veya yanlış /auth/confirm yolu üretme.
- Aynı Magic Link şablonuna isteğe bağlı altı haneli {{ .Token }} kodu eklenebilir.
- Ayar düzeldikten sonra **yeni** bağlantı iste; önceden gönderilmiş localhost/expired bağlantıları düzelmez.

## Google / GitHub OAuth sağlayıcıları — elle gerekli
- Google Cloud Console OAuth consent screen ve Web OAuth client oluştur.
- Google Authorized redirect URI = https://aaufxtcvnzgavtlintiv.supabase.co/auth/v1/callback
- Supabase > Authentication > Providers > Google içinde Client ID ve Client Secret bilgilerini **yalnız özel yönetici panelinde** gir, provider'ı aç ve kaydet.
- GitHub Developer Settings > OAuth Apps kısmında Homepage = https://tractorvs.com ve Callback = https://aaufxtcvnzgavtlintiv.supabase.co/auth/v1/callback ayarla.
- Supabase > Authentication > Providers > GitHub kısmına GitHub OAuth App Client ID ve Secret gir, aç, kaydet.
- Client secret, parola veya onay URL token'ını bu depoya, issue'ya veya sohbet mesajına kopyalama.
- Mevcut magic-link üyeleri yeni parolayı yeni üyelik oluşturarak değil, parola sıfırlama akışı ile tanımlamalıdır.

## Kabul kriterleri
- Canlı /tr/forum/ sayfasında /auth/v1/settings sağlayıcı durumları doğru, sadece etkin sosyal giriş düğmeleri mevcut.
- Yeni Gmail Magic Link ve doğrulama e-postası https://tractorvs.com/tr/forum/ adresinde oturum açıyor, localhost:3000'e yönlenmiyor.
- Şifreli kayıt, giriş, reset, mevcut e-posta OTP; Google ve GitHub sosyal login ayrı ayrı gerçek test üyesiyle tamamlandı.
- 10 dil, mobil ve desktop gerçek oturum, topluluk profili, oturum yenileme, izin/RLS kontrolü doğrulandı.
- Bunlar tamamlanana kadar sağlayıcılar gerçekten aktif olarak ilan edilmeyecek; email verification/moderation/rate-limit/RLS kapatılmayacak.

Resmî belgeler: https://supabase.com/docs/guides/auth/redirect-urls ; https://supabase.com/docs/guides/auth/auth-email-templates ; https://supabase.com/docs/guides/auth/social-login/auth-google ; https://supabase.com/docs/guides/auth/social-login/auth-github
Bu konuşmadaki bağlı Supabase araçları Auth sağlayıcı gizli anahtarlarını veya Site URL yapılandırmasını güncelleme yetkisi sağlamaz; SQL ile değiştirilemez.