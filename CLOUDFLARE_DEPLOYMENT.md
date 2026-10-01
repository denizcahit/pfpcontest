# Cloudflare Pages & D1 Database Deployment Rehberi 🚀

Bu proje, **Cloudflare Pages (Frontend + Edge Functions)** ve **Cloudflare D1 (Serverless SQLite Veritabanı)** ile %100 uyumlu hale getirilmiştir. Hiçbir sunucu (VPS/Node.js) kiralamadan tamamen ücretsiz olarak Cloudflare üzerinde çalıştırabilirsiniz.

---

## 1. Adım: GitHub Deponuzu Cloudflare Pages'e Bağlayın

1. [Cloudflare Dashboard](https://dash.cloudflare.com)'a giriş yapın.
2. Soldaki menüden **Workers & Pages** > **Create application** > **Pages** sekmesine tıklayın.
3. **Connect to Git** seçeneğini seçip GitHub'daki bu reponuzu bağlayın.
4. Derleme (Build) ayarlarını şu şekilde girin:
   - **Framework preset:** `Vite` (veya `None`)
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. **Save and Deploy** butonuna basın.

---

## 2. Adım: Cloudflare D1 Veritabanını Oluşturun

Veritabanını oluşturmanın 2 kolay yolu vardır:

### Seçenek A: Cloudflare Web Panelinden (Kodsuz)
1. Sol menüden **Workers & Pages** > **D1 SQL Database** bölümüne gidin.
2. **Create database** butonuna basın ve isim olarak `fotopuan-db` yazın.
3. Oluşturduktan sonra veritabanı detayına girip **Console** sekmesine tıklayın.
4. Projenizdeki `schema.sql` dosyasının içindeki SQL kodlarını kopyalayıp buraya yapıştırın ve **Execute** diyerek tabloları oluşturun.

### Seçenek B: Terminalden (Wrangler CLI ile)
```bash
# 1. D1 Veritabanı oluşturun
npx wrangler d1 create fotopuan-db

# 2. Şemayı ve yönetici hesabını yükleyin
npx wrangler d1 execute fotopuan-db --file=./schema.sql --remote
```

---

## 3. Adım: D1 Veritabanını Pages Projesine Bağlayın (Binding)

1. Cloudflare Dashboard'da projenize gidin: **Workers & Pages** > **[Projenizin Adı]**.
2. **Settings** (Ayarlar) sekmesine geçin.
3. Sol menüden **Functions** (Fonksiyonlar) seçeneğini seçin.
4. Sayfayı aşağı kaydırıp **D1 Database Bindings** bölümünü bulun ve **Add binding** butonuna tıklayın:
   - **Variable name (Değişken Adı):** `DB` *(Büyük harflerle)*
   - **D1 database (Veritabanı):** `fotopuan-db`
5. **Save** (Kaydet) butonuna basın.
6. **Deployments** sekmesine gidip son derlemenin yanındaki üç noktadan **Retry deployment** (Yeniden dağıt) diyerek güncelleyin.

---

## 🎉 Tebrikler!
Artık uygulamanız:
- **Global Edge CDN** üzerinde ultra hızlı yüklenir,
- Tüm `/api/*` istekleri Cloudflare Pages Functions (`functions/api/[[route]].ts`) tarafından karşılanır,
- Tüm kullanıcılar, oylar ve temalar **Cloudflare D1** veritabanında güvenle saklanır,
- **Yönetici Girişi:** Kullanıcı Adı: `admin` | Şifre: `admin`
