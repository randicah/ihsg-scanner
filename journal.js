// ============================================
// JOURNAL.JS — Trade Journal + Edge Statistics
// ============================================

function getJournal() {
  try {
    return JSON.parse(localStorage.getItem('tradeJournal') || '[]');
  } catch { return []; }
}

function saveJournal(journal) {
  localStorage.setItem('tradeJournal', JSON.stringify(journal));
}

function logTrade() {
  const ticker = document.getElementById('jTicker').value.trim().toUpperCase();
  const date = document.getElementById('jDate').value;
  const entry = parseFloat(document.getElementById('jEntry').value);
  const exit = parseFloat(document.getElementById('jExit').value);
  const layers = document.getElementById('jLayers').value;
  const volRatio = parseFloat(document.getElementById('jVolRatio').value) || 0;
  const ihsg = document.getElementById('jIhsg').value;
  const notes = document.getElementById('jNotes').value.trim();

  if (!ticker || !date || !entry || !exit) {
    showToast('Lengkapi Ticker, Tanggal, Entry, dan Exit dulu', 'error');
    return;
  }

  const pnlPct = ((exit - entry) / entry) * 100;
  const isProfit = pnlPct > 0;

  const trade = {
    id: Date.now(),
    ticker,
    date,
    entry,
    exit,
    pnlPct: parseFloat(pnlPct.toFixed(2)),
    isProfit,
    layers,
    volRatio,
    ihsg,
    notes,
    createdAt: new Date().toISOString(),
  };

  const journal = getJournal();
  journal.unshift(trade);
  saveJournal(journal);

  // Sync to Google Sheets if configured
  syncToSheets(trade);

  // Reset form
  document.getElementById('jTicker').value = '';
  document.getElementById('jEntry').value = '';
  document.getElementById('jExit').value = '';
  document.getElementById('jVolRatio').value = '';
  document.getElementById('jNotes').value = '';

  renderJournal();
  renderEdgeStats();
  showToast(`Trade ${ticker} disimpan — ${isProfit ? '✅ Profit' : '❌ Loss'} ${pnlPct.toFixed(2)}%`, isProfit ? 'success' : 'error');
}

function deleteTrade(id) {
  if (!confirm('Hapus trade ini?')) return;
  const journal = getJournal().filter(t => t.id !== id);
  saveJournal(journal);
  renderJournal();
  renderEdgeStats();
  showToast('Trade dihapus', 'info');
}

function renderJournal() {
  const container = document.getElementById('journalList');
  const journal = getJournal();

  if (journal.length === 0) {
    container.innerHTML = '<div class="empty-state">Belum ada trade yang dicatat.</div>';
    return;
  }

  container.innerHTML = journal.map(t => `
    <div class="journal-entry">
      <div>
        <div class="j-ticker">${t.ticker}</div>
        <div class="j-date">${t.date}</div>
      </div>
      <div>
        <div style="font-size:10px;color:var(--text3)">Entry → Exit</div>
        <div style="font-size:12px">Rp ${Math.round(t.entry).toLocaleString('id-ID')} → Rp ${Math.round(t.exit).toLocaleString('id-ID')}</div>
      </div>
      <div class="j-layers">${t.layers}</div>
      <div style="font-size:10px;color:var(--text3)">
        Vol: ${t.volRatio ? t.volRatio + 'x' : '—'}<br>
        IHSG: ${t.ihsg === 'up' ? '↑' : t.ihsg === 'down' ? '↓' : '→'}
      </div>
      <div class="j-result ${t.isProfit ? 'profit' : 'loss'}">
        ${t.isProfit ? '+' : ''}${t.pnlPct}%
      </div>
      <button class="j-delete" onclick="deleteTrade(${t.id})">×</button>
    </div>
  `).join('');
}

// ============================================
// EDGE STATISTICS
// ============================================

function renderEdgeStats() {
  const container = document.getElementById('edgeGrid');
  const journal = getJournal();

  if (journal.length < 5) {
    container.innerHTML = `<div class="empty-state">Log minimal 5 trade untuk melihat edge statistics.<br><span class="hint">Semakin banyak data, semakin akurat analisisnya.</span></div>`;
    return;
  }

  const layerGroups = {};
  journal.forEach(t => {
    if (!layerGroups[t.layers]) layerGroups[t.layers] = [];
    layerGroups[t.layers].push(t);
  });

  const overallStats = calcStats(journal);
  const byIhsg = {
    up: calcStats(journal.filter(t => t.ihsg === 'up')),
    down: calcStats(journal.filter(t => t.ihsg === 'down')),
    flat: calcStats(journal.filter(t => t.ihsg === 'flat')),
  };

  let html = '';

  // Overall stats card
  html += `
    <div class="edge-card">
      <h3>Overall Performance</h3>
      ${renderStatMetrics(overallStats)}
      <div class="win-bar"><div class="win-bar-fill" style="width:${overallStats.winRate}%"></div></div>
    </div>
  `;

  // Per layer combination
  Object.entries(layerGroups).sort((a, b) => b[1].length - a[1].length).forEach(([layers, trades]) => {
    const stats = calcStats(trades);
    html += `
      <div class="edge-card">
        <h3>${layers}</h3>
        ${renderStatMetrics(stats)}
        <div class="win-bar"><div class="win-bar-fill" style="width:${stats.winRate}%"></div></div>
      </div>
    `;
  });

  // IHSG context breakdown
  html += `
    <div class="edge-card">
      <h3>Konteks IHSG</h3>
      ${['up', 'flat', 'down'].map(ctx => {
        const s = byIhsg[ctx];
        if (s.total === 0) return '';
        const label = ctx === 'up' ? 'IHSG Naik' : ctx === 'flat' ? 'IHSG Flat' : 'IHSG Turun';
        return `
          <div class="edge-metric">
            <span class="edge-metric-label">${label} (${s.total}x)</span>
            <span class="edge-metric-value ${s.winRate >= 50 ? 'positive' : 'negative'}">${s.winRate}%</span>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Expectancy summary
  const exp = overallStats.expectancy;
  html += `
    <div class="edge-card">
      <h3>Kesimpulan Edge</h3>
      <div class="edge-metric">
        <span class="edge-metric-label">Expectancy per trade</span>
        <span class="edge-metric-value ${exp >= 0 ? 'positive' : 'negative'}">${exp >= 0 ? '+' : ''}${exp}%</span>
      </div>
      <div class="edge-metric">
        <span class="edge-metric-label">Status</span>
        <span class="edge-metric-value ${exp >= 0.5 ? 'positive' : exp >= 0 ? 'neutral' : 'negative'}">
          ${exp >= 0.5 ? '✅ Edge Ada' : exp >= 0 ? '⚠️ Marginal' : '❌ No Edge'}
        </span>
      </div>
      <div class="edge-metric">
        <span class="edge-metric-label">Total Sample</span>
        <span class="edge-metric-value neutral">${overallStats.total} trade</span>
      </div>
      <div style="font-size:10px;color:var(--text3);margin-top:12px;line-height:1.6">
        ${exp >= 0.5
          ? 'Edge terdeteksi. Lanjutkan dengan disiplin dan tambah sample size.'
          : exp >= 0
          ? 'Edge masih marginal. Butuh lebih banyak data atau penyesuaian parameter.'
          : 'Belum ada edge yang terdeteksi. Evaluasi parameter 3-layer dan coba variasi lain.'}
      </div>
    </div>
  `;

  container.innerHTML = html;
}

function calcStats(trades) {
  if (trades.length === 0) return { total: 0, wins: 0, losses: 0, winRate: 0, avgWin: 0, avgLoss: 0, expectancy: 0 };

  const wins = trades.filter(t => t.isProfit);
  const losses = trades.filter(t => !t.isProfit);
  const winRate = parseFloat(((wins.length / trades.length) * 100).toFixed(1));
  const avgWin = wins.length > 0
    ? parseFloat((wins.reduce((a, t) => a + t.pnlPct, 0) / wins.length).toFixed(2))
    : 0;
  const avgLoss = losses.length > 0
    ? parseFloat((losses.reduce((a, t) => a + Math.abs(t.pnlPct), 0) / losses.length).toFixed(2))
    : 0;

  // Expectancy = (WinRate * AvgWin) - (LossRate * AvgLoss)
  const expectancy = parseFloat(
    ((winRate / 100 * avgWin) - ((1 - winRate / 100) * avgLoss)).toFixed(2)
  );

  return { total: trades.length, wins: wins.length, losses: losses.length, winRate, avgWin, avgLoss, expectancy };
}

function renderStatMetrics(s) {
  if (s.total === 0) return '<div style="font-size:11px;color:var(--text3)">Belum ada data</div>';
  return `
    <div class="edge-metric">
      <span class="edge-metric-label">Win Rate</span>
      <span class="edge-metric-value ${s.winRate >= 50 ? 'positive' : 'negative'}">${s.winRate}%</span>
    </div>
    <div class="edge-metric">
      <span class="edge-metric-label">Avg Win</span>
      <span class="edge-metric-value positive">+${s.avgWin}%</span>
    </div>
    <div class="edge-metric">
      <span class="edge-metric-label">Avg Loss</span>
      <span class="edge-metric-value negative">-${s.avgLoss}%</span>
    </div>
    <div class="edge-metric">
      <span class="edge-metric-label">Sample</span>
      <span class="edge-metric-value neutral">${s.total} trade</span>
    </div>
  `;
}
