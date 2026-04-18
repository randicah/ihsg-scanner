# Setup Google Sheets untuk Trade Journal

Ikuti langkah ini untuk mengaktifkan sync journal ke Google Sheets.

---

## Step 1 — Buat Google Sheet Baru

1. Buka [sheets.google.com](https://sheets.google.com)
2. Buat spreadsheet baru, beri nama: **IHSG Journal**
3. Di Row 1, buat header ini (satu per kolom):

```
ID | Ticker | Date | Entry | Exit | PnL% | Profit | Layers | VolRatio | IHSG | Notes | CreatedAt
```

---

## Step 2 — Buat Google Apps Script

1. Di spreadsheet tadi, klik menu **Extensions → Apps Script**
2. Hapus semua kode yang ada
3. Paste kode ini:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const body = JSON.parse(e.postData.contents);
    
    if (body.action === 'addTrade') {
      const t = body.data;
      sheet.appendRow([
        t.id,
        t.ticker,
        t.date,
        t.entry,
        t.exit,
        t.pnlPct,
        t.isProfit ? 'PROFIT' : 'LOSS',
        t.layers,
        t.volRatio,
        t.ihsg,
        t.notes,
        t.createdAt
      ]);
    }
    
    if (body.action === 'bulkExport') {
      const trades = body.data;
      // Clear existing data (keep header)
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.deleteRows(2, lastRow - 1);
      }
      // Add all trades
      trades.forEach(t => {
        sheet.appendRow([
          t.id, t.ticker, t.date, t.entry, t.exit,
          t.pnlPct, t.isProfit ? 'PROFIT' : 'LOSS',
          t.layers, t.volRatio, t.ihsg, t.notes, t.createdAt
        ]);
      });
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Klik **Save** (ikon floppy disk)

---

## Step 3 — Deploy sebagai Web App

1. Klik tombol **Deploy → New deployment**
2. Klik ikon ⚙️ di sebelah "Select type" → pilih **Web app**
3. Isi settings:
   - Description: `IHSG Journal Sync`
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Klik **Deploy**
5. Klik **Authorize access** → pilih akun Google lo → Allow
6. Copy URL yang muncul (format: `https://script.google.com/macros/s/...../exec`)

---

## Step 4 — Paste URL ke Scanner

1. Buka dashboard IHSG Scanner
2. Klik tab **Settings**
3. Paste URL tadi ke kolom **Google Sheets Integration**
4. Klik **Simpan URL**

Selesai. Setiap trade yang lo log akan otomatis tersimpan ke Google Sheets.
