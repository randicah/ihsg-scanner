// ============================================
// SCANNER.JS — 3-Layer Filter Engine
// ============================================

// Yahoo Finance proxy — menggunakan allorigins untuk bypass CORS
const YF_PROXY = 'https://query1.finance.yahoo.com/v8/finance/chart/';
const CORS_PROXY = 'https://api.allorigins.win/raw?url=';

let scanResults = [];
let isScanning = false;

// ============================================
// FETCH STOCK DATA FROM YAHOO FINANCE
// ============================================

async function fetchStockData(ticker) {
  const symbol = `${ticker}.JK`;
  const url = `${YF_PROXY}${symbol}?interval=5m&range=1d&includePrePost=false`;

  try {
    const res = await fetch(CORS_PROXY + encodeURIComponent(url));
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();

    const chart = data?.chart?.result?.[0];
    if (!chart) return null;

    const meta = chart.meta;
    const timestamps = chart.timestamp || [];
    const quotes = chart.indicators?.quote?.[0] || {};
    const volumes = quotes.volume || [];
    const closes = quotes.close || [];
    const highs = quotes.high || [];

    if (closes.length === 0) return null;

    // Current price
    const currentPrice = meta.regularMarketPrice || closes.filter(Boolean).slice(-1)[0];
    const prevClose = meta.previousClose || meta.chartPreviousClose;
    const priceChange = currentPrice - prevClose;
    const priceChangePct = (priceChange / prevClose) * 100;

    // Volume analysis
    const validVolumes = volumes.filter(v => v !== null && v > 0);
    const currentVolume = validVolumes.slice(-1)[0] || 0;
    const totalDayVolume = validVolumes.reduce((a, b) => a + b, 0);

    // Average volume per candle (exclude last candle)
    const avgVolumePerCandle = validVolumes.length > 1
      ? validVolumes.slice(0, -1).reduce((a, b) => a + b, 0) / (validVolumes.length - 1)
      : 0;

    const volumeRatio = avgVolumePerCandle > 0
      ? currentVolume / avgVolumePerCandle
      : 0;

    // Price structure
    const validCloses = closes.filter(Boolean);
    const validHighs = highs.filter(Boolean);
    const dayHigh = Math.max(...validHighs);
    const high5d = await fetch5DayHigh(ticker);

    return {
      ticker,
      currentPrice,
      prevClose,
      priceChange,
      priceChangePct,
      currentVolume,
      totalDayVolume,
      avgVolumePerCandle,
      volumeRatio,
      dayHigh,
      high5d,
      candleCount: validVolumes.length,
    };
  } catch (err) {
    console.warn(`Failed to fetch ${ticker}:`, err.message);
    return null;
  }
}

async function fetch5DayHigh(ticker) {
  const symbol = `${ticker}.JK`;
  const url = `${YF_PROXY}${symbol}?interval=1d&range=5d`;

  try {
    const res = await fetch(CORS_PROXY + encodeURIComponent(url));
    const data = await res.json();
    const highs = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.high || [];
    // Exclude today (last item) for "high kemarin / 5 hari"
    const pastHighs = highs.slice(0, -1).filter(Boolean);
    return pastHighs.length > 0 ? Math.max(...pastHighs) : null;
  } catch {
    return null;
  }
}

// ============================================
// 3-LAYER EVALUATION
// ============================================

function evaluateLayers(stock, config) {
  const { minVolumeRatio, ihsgContext } = config;

  // LAYER 1: Volume Spike
  const layer1Pass = stock.volumeRatio >= minVolumeRatio;
  const layer1Value = stock.volumeRatio.toFixed(2) + 'x';

  // LAYER 2: Price Structure
  // Breakout above yesterday's high OR 5-day high
  const breakoutYesterday = stock.high5d && stock.currentPrice > stock.high5d;
  const breakoutDay = stock.currentPrice >= stock.dayHigh * 0.998; // within 0.2% of day high
  const layer2Pass = breakoutYesterday || breakoutDay;
  const layer2Value = breakoutYesterday ? 'Break 5D High' : breakoutDay ? 'At Day High' : 'Below Resistance';

  // LAYER 3: Market Context
  const layer3Pass = ihsgContext === 'up';
  const layer3Partial = ihsgContext === 'flat';
  const layer3Value = ihsgContext === 'up' ? 'IHSG ↑' : ihsgContext === 'flat' ? 'IHSG →' : 'IHSG ↓';

  // Count passed layers
  const passCount = [layer1Pass, layer2Pass, layer3Pass].filter(Boolean).length;
  const partialCount = layer3Partial ? 0.5 : 0;

  // Grade
  let grade = 'C';
  if (layer1Pass && layer2Pass && layer3Pass) grade = 'A';
  else if (layer1Pass && layer2Pass) grade = 'B';
  else if (layer1Pass && (layer3Pass || layer3Partial)) grade = 'B';

  return {
    layer1: { pass: layer1Pass, value: layer1Value },
    layer2: { pass: layer2Pass, value: layer2Value },
    layer3: { pass: layer3Pass, partial: layer3Partial, value: layer3Value },
    passCount,
    grade,
  };
}

// ============================================
// MAIN SCANNER RUN
// ============================================

async function runScanner() {
  if (isScanning) return;
  isScanning = true;

  const btn = document.getElementById('btnRefresh');
  const icon = document.getElementById('refreshIcon');
  btn.classList.add('loading');
  icon.classList.add('spinning');

  const grid = document.getElementById('scannerGrid');
  grid.innerHTML = `<div class="empty-state"><p>Scanning ${getAllTickers().length} saham...</p><p class="hint">Mengambil data dari Yahoo Finance, mohon tunggu</p></div>`;

  const minVolumeRatio = parseFloat(document.getElementById('minVolumeRatio').value) || 2.5;
  const ihsgContext = document.getElementById('ihsgContext').value;
  const layerFilter = document.getElementById('layerFilter').value;

  const config = { minVolumeRatio, ihsgContext };
  const allTickers = getAllTickers();
  scanResults = [];

  // Fetch in batches of 5 to avoid rate limiting
  const batchSize = 5;
  let processed = 0;

  for (let i = 0; i < allTickers.length; i += batchSize) {
    const batch = allTickers.slice(i, i + batchSize);
    const results = await Promise.allSettled(
      batch.map(s => fetchStockData(s.ticker))
    );

    results.forEach((result, idx) => {
      processed++;
      if (result.status === 'fulfilled' && result.value) {
        const stockData = result.value;
        const stockInfo = batch[idx];
        const layers = evaluateLayers(stockData, config);

        // Only include if Layer 1 passes (volume is gate)
        if (layers.layer1.pass) {
          scanResults.push({
            ...stockData,
            ...stockInfo,
            layers,
          });
        }
      }
    });

    // Update progress
    grid.innerHTML = `<div class="empty-state"><p>Scanning... ${processed}/${allTickers.length} saham</p><p class="hint">Ini membutuhkan ~${Math.ceil(allTickers.length / batchSize * 1.5)} detik</p></div>`;

    // Small delay between batches
    if (i + batchSize < allTickers.length) {
      await sleep(800);
    }
  }

  // Sort by volume ratio descending
  scanResults.sort((a, b) => b.layers.passCount - a.layers.passCount || b.volumeRatio - a.volumeRatio);

  // Filter by layer requirement
  let filtered = scanResults;
  if (layerFilter === '3') filtered = scanResults.filter(s => s.layers.passCount === 3);
  else if (layerFilter === '2') filtered = scanResults.filter(s => s.layers.passCount >= 2);

  renderScanResults(filtered);

  // Update last scan time
  document.getElementById('lastUpdate').textContent = 'Scan: ' + new Date().toLocaleTimeString('id-ID');

  btn.classList.remove('loading');
  icon.classList.remove('spinning');
  isScanning = false;

  showToast(`${filtered.length} saham lolos filter dari ${allTickers.length} yang di-scan`, 'success');
}

function renderScanResults(results) {
  const grid = document.getElementById('scannerGrid');

  if (results.length === 0) {
    grid.innerHTML = `<div class="empty-state">
      <p>Tidak ada saham yang lolos filter saat ini</p>
      <p class="hint">Coba turunkan threshold Volume Ratio atau ubah Layer Filter</p>
    </div>`;
    return;
  }

  grid.innerHTML = results.map((s, i) => createStockCard(s, i)).join('');
}

function createStockCard(s, index) {
  const { layers } = s;
  const changeClass = s.priceChangePct >= 0 ? 'up' : 'down';
  const changeSign = s.priceChangePct >= 0 ? '+' : '';

  const l1Badge = layers.layer1.pass
    ? `<span class="badge pass">L1 Vol ${layers.layer1.value}</span>`
    : `<span class="badge fail">L1 —</span>`;

  const l2Badge = layers.layer2.pass
    ? `<span class="badge pass">L2 ${layers.layer2.value}</span>`
    : `<span class="badge fail">L2 Below Resist</span>`;

  const l3Badge = layers.layer3.pass
    ? `<span class="badge pass">L3 ${layers.layer3.value}</span>`
    : layers.layer3.partial
      ? `<span class="badge partial">L3 ${layers.layer3.value}</span>`
      : `<span class="badge fail">L3 ${layers.layer3.value}</span>`;

  const gradeColor = s.layers.grade === 'A' ? 'var(--green)' : s.layers.grade === 'B' ? 'var(--gold)' : 'var(--orange)';

  return `
    <div class="stock-card grade-${s.layers.grade}" style="animation-delay: ${index * 0.05}s">
      <div class="card-header">
        <div>
          <div class="ticker-name">${s.ticker}</div>
          <div class="company-name">${s.name}</div>
          <div style="font-size:9px;color:var(--text3);margin-top:3px;letter-spacing:1px">${s.sector || ''}</div>
        </div>
        <div class="price-block">
          <div class="price">Rp ${formatPrice(s.currentPrice)}</div>
          <div class="price-change ${changeClass}">${changeSign}${s.priceChangePct?.toFixed(2)}%</div>
          <div style="font-size:10px;margin-top:4px;color:${gradeColor};font-weight:700">GRADE ${s.layers.grade}</div>
        </div>
      </div>

      <div class="layer-badges">
        ${l1Badge}${l2Badge}${l3Badge}
      </div>

      <div class="metrics">
        <div class="metric">
          <div class="metric-label">Vol Ratio</div>
          <div class="metric-value highlight">${s.volumeRatio.toFixed(1)}x</div>
        </div>
        <div class="metric">
          <div class="metric-label">Vol (lot)</div>
          <div class="metric-value">${formatVolume(s.currentVolume)}</div>
        </div>
        <div class="metric">
          <div class="metric-label">Layers</div>
          <div class="metric-value">${s.layers.passCount}/3</div>
        </div>
      </div>

      <button class="card-action" onclick="prefillJournal('${s.ticker}', ${s.currentPrice}, '${s.layers.layer1.pass ? 'L1' : ''}${s.layers.layer2.pass ? '+L2' : ''}${s.layers.layer3.pass ? '+L3' : ''}')">
        + Log ke Journal
      </button>
    </div>
  `;
}

function prefillJournal(ticker, price, layers) {
  switchTab('journal');
  document.getElementById('jTicker').value = ticker;
  document.getElementById('jEntry').value = price;
  document.getElementById('jDate').value = new Date().toISOString().split('T')[0];
  showToast(`${ticker} siap di-log ke journal`, 'info');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatPrice(price) {
  if (!price) return '—';
  return Math.round(price).toLocaleString('id-ID');
}

function formatVolume(vol) {
  if (!vol) return '—';
  if (vol >= 1000000) return (vol / 1000000).toFixed(1) + 'M';
  if (vol >= 1000) return (vol / 1000).toFixed(0) + 'K';
  return vol.toString();
}
