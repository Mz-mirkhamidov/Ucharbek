/**
 * Google Apps Script - Ucharbek Leadlarni Avtomatik Google Sheet'ga yozish
 * 
 * QANDAY O'RNATILADI:
 * 1. Ushbu Google Jadvalni oching:
 *    https://docs.google.com/spreadsheets/d/1W-lf4O16MWs9zeBwBblBB8jo2xEfxHbnwmTRPPtut2I/edit?gid=692419783#gid=692419783
 * 2. Tepada menyudan: Kengaytmalar (Extensions) -> Apps Script (Скрипты) bo'limini bosing.
 * 3. Ochilgan kod muharriridagi eski kodlarni o'chirib, ushbu fayldagi barcha kodni qo'ying.
 * 4. Saqlash (Ctrl+S yoki disketa belgisi) tugmasini bosing.
 * 5. O'ng yuqoridagi "Deploy" (Развернуть) -> "New deployment" (Новое развертывание) ni bosing.
 * 6. Tishli g'ildirakcha (⚙️) belgisidan "Web app" (Веб-приложение) ni tanlang.
 * 7. Sozlamalar:
 *    - Description: Ucharbek Leads Webhook
 *    - Execute as: Me (mening nomimdan)
 *    - Who has access: Anyone (barcha foydalanuvchilar)
 * 8. "Deploy" ni bosing va berilgan "Web app URL" (https://script.google.com/macros/s/.../exec) nusxasini oling.
 * 9. Olingan URL manzilini .env faylidagi GOOGLE_SHEETS_WEBHOOK_URL qatoriga qo'ying.
 */

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    
    // Agar birinchi qator bo'sh bo'lsa, sarlavhalarni yaratamiz
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        "Sana va Vaqt (Toshkent)",
        "Ism",
        "Telefon raqami",
        "Yo'nalish / Davlat",
        "Til",
        "Reklama Manbasi (UTM Source)",
        "Kampaniya (UTM Campaign)",
        "UTM Medium",
        "Saytga Kelgan Manba (Referrer)"
      ]);
      
      // Sarlavha qatorini brend ko'k va oq yozuvda bezatish
      var headerRange = sheet.getRange(1, 1, 1, 9);
      headerRange.setBackground("#0054DF");
      headerRange.setFontColor("#FFFFFF");
      headerRange.setFontWeight("bold");
    }

    // Yangi kelgan arizani yangi qatorga qo'shish
    sheet.appendRow([
      data.created_at || new Date().toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" }),
      data.name,
      data.phone,
      data.destination,
      data.language || "uz",
      data.utm_source || "direct",
      data.utm_campaign || "",
      data.utm_medium || "",
      data.referrer || "direct"
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: "success", message: "Lead added successfully" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: "error", error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "ok", service: "Ucharbek Google Sheets Webhook Active" }))
    .setMimeType(ContentService.MimeType.JSON);
}
