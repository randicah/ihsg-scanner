// ============================================
// SHEETS.JS — Google Sheets Integration
// ============================================

function getSheetsUrl() {
  return localStorage.getItem('sheetsUrl') || '';
}

function saveSheetsUrl() {
  const url = document.getElementById('sheetsUrl').value.trim();
  if (!url) {
    showToast('URL tidak boleh kosong', 'error');
    return;
  }
  localStorage.setItem('sheetsUrl', url);
  showToast('URL Google Sheets disimpan', 'success');
  document.getElementById('sheetsStatus').className = 'sheets-status ok';
  document.getElementById('sheetsStatus').textContent = '✅ URL tersimpan. Sync aktif untuk trade berikutnya.';
}

async function syncToSheets(trade) {
  const url = getSheetsUrl();
  if (!url) return; // Silently skip if not configured

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors', // Google Apps Script requires no-cors
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'addTrade',
        data: trade
      })
    });
    // no-cors means we can't read response, but if no error thrown, assume success
    console.log('Synced to Sheets:', trade.ticker);
  } catch (err) {
    console.warn('Sheets sync failed:', err.message);
  }
}

async function exportAllToSheets() {
  const url = getSheetsUrl();
  if (!url) {
    showToast('Setup Google Sheets URL dulu di Settings', 'error');
    return;
  }

  const journal = getJournal();
  if (journal.length === 0) {
    showToast('Tidak ada data untuk di-export', 'info');
    return;
  }

  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'bulkExport',
        data: journal
      })
    });
    showToast(`${journal.length} trade di-export ke Sheets`, 'success');
  } catch (err) {
    showToast('Export gagal: ' + err.message, 'error');
  }
}

function loadSheetsUrlFromStorage() {
  const url = getSheetsUrl();
  const input = document.getElementById('sheetsUrl');
  const status = document.getElementById('sheetsStatus');
  if (input && url) {
    input.value = url;
    status.className = 'sheets-status ok';
    status.textContent = '✅ URL tersimpan';
  }
}
