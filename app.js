// ============================================
// APP.JS — Initialization & Utilities
// ============================================

// ============================================
// TAB NAVIGATION
// ============================================

function switchTab(tabName) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

  document.querySelectorAll('.tab').forEach(t => {
    if (t.getAttribute('onclick') === `switchTab('${tabName}')`) {
      t.classList.add('active');
    }
  });

  const content = document.getElementById(`tab-${tabName}`);
  if (content) content.classList.add('active');
}

// ============================================
// MARKET STATUS
// ============================================

function updateMarketStatus() {
  const now = new Date();
  const wib = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const hours = wib.getHours();
  const minutes = wib.getMinutes();
  const day = wib.getDay(); // 0=Sun, 6=Sat
  const totalMinutes = hours * 60 + minutes;

  const dot = document.querySelector('.dot');
  const text = document.getElementById('marketStatusText');

  const isWeekday = day >= 1 && day <= 5;
  const isPreOpen = totalMinutes >= 8 * 60 + 45 && totalMinutes < 9 * 60;
  const isSession1 = totalMinutes >= 9 * 60 && totalMinutes < 12 * 60;
  const isBreak = totalMinutes >= 12 * 60 && totalMinutes < 13 * 60 + 30;
  const isSession2 = totalMinutes >= 13 * 60 + 30 && totalMinutes < 15 * 60 + 50;
  const isPreClose = totalMinutes >= 15 * 60 + 50 && totalMinutes < 16 * 60;

  if (!isWeekday) {
    dot.className = 'dot closed';
    text.textContent = 'Market Tutup (Weekend)';
  } else if (isPreOpen) {
    dot.className = 'dot pre';
    text.textContent = 'Pre-Open';
  } else if (isSession1) {
    dot.className = 'dot live';
    text.textContent = 'Sesi 1 LIVE';
  } else if (isBreak) {
    dot.className = 'dot pre';
    text.textContent = 'Istirahat Siang';
  } else if (isSession2) {
    dot.className = 'dot live';
    text.textContent = 'Sesi 2 LIVE';
  } else if (isPreClose) {
    dot.className = 'dot pre';
    text.textContent = 'Pre-Close';
  } else {
    dot.className = 'dot closed';
    text.textContent = 'Market Tutup';
  }
}

// ============================================
// TOAST NOTIFICATIONS
// ============================================

function showToast(message, type = 'info') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ============================================
// RESET DATA
// ============================================

function resetData() {
  if (!confirm('Yakin mau hapus semua data journal? Ini tidak bisa di-undo.')) return;
  localStorage.removeItem('tradeJournal');
  renderJournal();
  renderEdgeStats();
  showToast('Semua data journal dihapus', 'info');
}

// ============================================
// SET DEFAULT DATE IN JOURNAL FORM
// ============================================

function setDefaultDate() {
  const dateInput = document.getElementById('jDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }
}

// ============================================
// AUTO-REFRESH DURING MARKET HOURS
// ============================================

function startAutoRefresh() {
  // Check every 30 seconds if we should auto-scan
  setInterval(() => {
    const dot = document.querySelector('.dot');
    if (dot && dot.classList.contains('live')) {
      // Market is live — auto scan every 15 minutes
      const lastScanText = document.getElementById('lastUpdate').textContent;
      if (lastScanText === '—') return; // Never scanned, don't auto-scan
      // Auto-refresh logic can be enabled by user in settings (future feature)
    }
  }, 30000);
}

// ============================================
// INIT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  // Market status
  updateMarketStatus();
  setInterval(updateMarketStatus, 60000);

  // Set default date
  setDefaultDate();

  // Render existing journal
  renderJournal();
  renderEdgeStats();

  // Render settings
  renderCustomTickers();
  renderDefaultTickers();

  // Load sheets URL
  loadSheetsUrlFromStorage();

  // Start auto-refresh watcher
  startAutoRefresh();

  console.log('IHSG Scanner initialized ✓');
  console.log('Total tickers in watchlist:', getAllTickers().length);
});
