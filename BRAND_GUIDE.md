# Ucharbek Innovatsion Turizm Agentligi — Brend Yo'riqnomasi va Tizim Hujjati

Ushbu hujjat "Ucharbek" sayohat agentligi brend identifikatsiyasi, vizual standartlari va texnik tizimni ishlatish qo'llanmasini o'z ichiga oladi.

---

## 1. Brend Ranglari (Color Palette)

Logotip va brend identifikatsiyasi asosida aniq shakllantirilgan ranglar palitrasi:

| Rang Turi | Hex Kodi | RGB | Qo'llanish Sohasi |
| :--- | :--- | :--- | :--- |
| 🔵 **Asosiy Ko'k (Primary Blue)** | `#0054DF` | `rgb(0, 84, 223)` | Logotip asosiy qismi, ishonch belgilari, havolalar, Variant B foni |
| 🟡 **Asosiy Sariq/Oltin (Accent Yellow)** | `#F9CB02` | `rgb(249, 203, 2)` | Asosiy CTA tugmalar, aksentlar, "BEK" yozuvi, narx belgilar |
| ⚪ **Neytral Oq (Pure White)** | `#FFFFFF` | `rgb(255, 255, 255)` | Fon (Variant A), kontrastli matnlar, kartalar |
| ⚫ **Matn To'q Kulrang (Dark Charcoal)** | `#1A1A1A` | `rgb(26, 26, 26)` | Asosiy sarlavhalar va o'qish qulay matnlar |
| 🔷 **Och Ko'k (Soft Blue Accent)** | `#E8F0FE` | `rgb(232, 240, 254)` | Ikonka foni, yengil ajratgichlar |

---

## 2. Tipografika (Typography)

- **Asosiy Shrift:** `Inter` (yoki `Manrope`), zamonaviy geometrik sans-serif.
- **Sarlavhalar:** Qalin (`font-weight: 800` yoki `900`), ixcham harflararo masofa (`letter-spacing: -0.8px`).
- **Tavsif matnlari:** Regular/Medium (`font-weight: 400` yoki `500`), satrlararo masofa `1.55`.
- **Tugmalar:** Ekstra-qalin (`font-weight: 800`), harflar balandligi 18px.

---

## 3. Uchta Dizayn Varianti Xarakteristikasi

Mijoz taqqoslab tanlashi uchun tayyorlangan 3 ta dizayn uslubi:

### Variant A — Minimal & Zamonaviy (Tavsiya etiladi)
- **Vizual uslub:** Oq/och fon, toza havo, ko'p bo'sh joy, ko'k va sariq ranglar faqat tugma va aksentlarda.
- **Afzalligi:** Eng yengil va tez yuklanuvchi, ko'zni charchatmaydi, konversiyaga maksimal e'tibor qaratadi.

### Variant B — To'liq Brend Rangida (Bold & Energetic)
- **Vizual uslub:** To'q ko'k (`#0054DF`) gradient fon, sariq/oltin matn va yorqin tugmalar.
- **Afzalligi:** Logotipdagi kuchli energiya va dinamikani to'liq namoyon etadi, Meta/Instagram reklamalari bilan kuchli vizual bog'liqlik hosil qiladi.

### Variant C — Premium & Hashamatli (Luxury Night)
- **Vizual uslub:** Chuqur qora/to'q-ko'k hashamatli gradient, oltin chiziqlar va jiloli CTA tugmalar.
- **Afzalligi:** VIP, Umra yoki eksklyuziv turlar uchun elita taassurotini uyg'otadi.

---

## 4. Tizimni Ishga Tushirish va Boshqarish

### Talablar:
- Node.js (v18+) yoki Antigravity ichidagi `agy-node`.

### Ishga tushirish:
```bash
# Oddiy Node.js bilan:
node server/server.js

# Antigravity muhitida:
& "C:\Users\El\AppData\Roaming\Antigravity\bin\agy-node.cmd" server/server.js
```

### Brauzerda ochish:
- Asosiy sahifa: `http://localhost:3000`
- To'g'ridan-to'g'ri Variant A: `http://localhost:3000/?variant=a`
- To'g'ridan-to'g'ri Variant B: `http://localhost:3000/?variant=b`
- To'g'ridan-to'g'ri Variant C: `http://localhost:3000/?variant=c`
- Rus tilida ochish: `http://localhost:3000/?lang=ru`
- Ingliz tilida ochish: `http://localhost:3000/?lang=en`

---

## 5. Telegram Integratsiyasini Sozlash

1. Telegramda [@BotFather](https://t.me/BotFather) orqali yangi bot yarating va `TELEGRAM_BOT_TOKEN` ni oling.
2. Botni arizalar tushadigan Telegram guruhingizga qo'shing va unga administrator huquqini bering.
3. Guruh ID raqamini oling (masalan, [@userinfobot](https://t.me/userinfobot) orqali) va `.env` fayliga kiriting:
   ```env
   TELEGRAM_BOT_TOKEN=123456789:ABCDefGhIJklMNopQRstUVwxyz
   TELEGRAM_CHAT_ID=-1001234567890
   REPORT_TIME=21:00
   ```
4. Serverni qayta ishga tushiring.

### Test xabarnoma va hisobot:
- Test arizani sahifadagi formani to'ldirib yuboring.
- Kunlik hisobot formulasini darhol tekshirish uchun brauzerda: `http://localhost:3000/api/report/test`
