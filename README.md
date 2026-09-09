# ✈️ Ucharbek — Innovatsion Hamyonbop Turizm Agentligi

Meta (Instagram/Facebook) video reklamalaridan kelayotgan target trafikni maksimal konversiya bilan **lead (ariza)**ga aylantirish uchun maxsus ishlab chiqilgan yuqori konversiyali, 3 tilli landing page va to'liq avtomatlashtirilgan backend tizimi.

---

## 🌟 Asosiy Xususiyatlar

- 📱 **90% Mobile-First Dizayn:** Instagram va Facebook reklamalaridan kiruvchi mobil foydalanuvchilar uchun maxsus optimallashtirilgan, tezkor va qulay interfeys.
- 🎨 **3 Ta Jonli Dizayn Varianti (Live Switcher):**
  - **Variant A:** Minimal & Zamonaviy (toza oq fon, yengil stil).
  - **Variant B:** To'liq Brend Bold (`#0054DF` ko'k gradient fon, yuqori energiya).
  - **Variant C:** Premium & Hashamatli (to'q ko'k-qora hashamatli fon, nozik oltin aksentlar).
- 🌐 **3 Tilli Tizim (i18n):** O'zbekcha (asosiy), Ruscha va Inglizcha to'liq lokalizatsiya.
- 📝 **Kuchli Lead Forma:**
  - Yo'nalishni erkin qo'lda kiritish.
  - O'zbekiston telefon raqamlari uchun avtomatik `+998 (XX) XXX-XX-XX` maskasi.
  - Yashirin **Honeypot** spam-bot filtri.
  - Reklama kampaniyasi teglari (UTM parameters: `utm_source`, `utm_campaign` va h.k.) avtomatik ushlanadi.
- 🤖 **Telegram Real-Vaqt Integratsiyasi:** Yangi ariza kelgan zahoti belgilangan Telegram guruhiga to'liq ma'lumotlar bilan yuboriladi.
- 📊 **Kunlik Avtomatik Hisobot (Cron):** Har kuni soat **00:01** da (Toshkent vaqti) o'tgan kunning tashriflari, arizalar soni va konversiya foizi hisoblanib, shaxsiy chatga yuboriladi.
- 📈 **Google Sheets Sinxronizatsiyasi:** Google Apps Script Webhook orqali har bir yangi ariza to'g'ridan-to'g'ri Google Jadvalga yangi qator bo'lib tushadi.
- ⚡ **Zero-Dependency Backend:** Node.js v22+ ichki `node:sqlite` bazasi orqali qo'shimcha og'ir kutubxonalarsiz ishlaydi.

---

## 🚀 Ishga Tushirish

### 1. Talablar
- Node.js (v18 yoki undan yuqori)

### 2. Sozlash (.env)
`.env.example` faylidan nusxa olib, `.env` faylini yarating:
```bash
cp .env.example .env
```
Kerakli parametrlarni kiriting:
```env
PORT=3000
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
TELEGRAM_CHAT_ID=-1004491595905
TELEGRAM_REPORT_CHAT_ID=552003748
REPORT_TIME=00:01
GOOGLE_SHEETS_WEBHOOK_URL=
```

### 3. Serverni ishga tushirish
```bash
node server/server.js
```
Brauzerda ochish: `http://localhost:3000`

---

## 📁 Loyiha Tuzilishi

```
ucharbek-landing/
├── public/
│   ├── index.html           # Asosiy landing page
│   ├── css/
│   │   └── style.css        # Brend stillari va 3 ta variant mavzulari
│   ├── js/
│   │   ├── app.js           # Forma validatsiyasi, maska, UTM ushlash
│   │   ├── translations.js  # UZ, RU, EN lug'ati
│   │   └── variants.js      # Variant A, B, C jonli almashtirgich
│   └── assets/              # Rasmiy logotip, realistik fotosuratlar
├── server/
│   ├── server.js            # Node.js HTTP server
│   ├── database.js          # SQLite jadvallari (visits, leads)
│   ├── telegram.js          # Telegram Bot API integratsiyasi
│   ├── cron.js              # Kunlik avtomatik hisobot rejalashtiruvchi
│   └── googlesheets.js      # Google Sheets integratsiyasi
├── google_apps_script.js    # Google Sheet Apps Script webhook kodi
├── .env.example             # Konfiguratsiya namunasi
├── BRAND_GUIDE.md           # Brend standartlari va ranglar kodi
└── README.md
```

---

## 📄 Litsenziya
© 2026 Ucharbek Innovatsion Turizm Agentligi. Barcha huquqlar himoyalangan.
