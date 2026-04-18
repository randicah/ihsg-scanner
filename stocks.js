// ============================================
// STOCKS.JS — LQ45 Default List + Custom Tickers
// ============================================

const LQ45_LIST = [
  { ticker: "AALI", name: "Astra Agro Lestari", sector: "Agriculture" },
  { ticker: "ADRO", name: "Adaro Energy", sector: "Mining" },
  { ticker: "AKRA", name: "AKR Corporindo", sector: "Trade" },
  { ticker: "AMRT", name: "Sumber Alfaria Trijaya", sector: "Trade" },
  { ticker: "ANTM", name: "Aneka Tambang", sector: "Mining" },
  { ticker: "ASII", name: "Astra International", sector: "Automotive" },
  { ticker: "BBCA", name: "Bank Central Asia", sector: "Finance" },
  { ticker: "BBNI", name: "Bank Negara Indonesia", sector: "Finance" },
  { ticker: "BBRI", name: "Bank Rakyat Indonesia", sector: "Finance" },
  { ticker: "BBTN", name: "Bank Tabungan Negara", sector: "Finance" },
  { ticker: "BFIN", name: "BFI Finance Indonesia", sector: "Finance" },
  { ticker: "BMRI", name: "Bank Mandiri", sector: "Finance" },
  { ticker: "BRIS", name: "Bank Syariah Indonesia", sector: "Finance" },
  { ticker: "BRPT", name: "Barito Pacific", sector: "Chemical" },
  { ticker: "CPIN", name: "Charoen Pokphand Indonesia", sector: "Agriculture" },
  { ticker: "EMTK", name: "Elang Mahkota Teknologi", sector: "Technology" },
  { ticker: "ESSA", name: "PT Essa Industries", sector: "Chemical" },
  { ticker: "EXCL", name: "XL Axiata", sector: "Telecom" },
  { ticker: "GGRM", name: "Gudang Garam", sector: "Consumer" },
  { ticker: "GOTO", name: "GoTo Gojek Tokopedia", sector: "Technology" },
  { ticker: "HMSP", name: "HM Sampoerna", sector: "Consumer" },
  { ticker: "HRUM", name: "Harum Energy", sector: "Mining" },
  { ticker: "ICBP", name: "Indofood CBP Sukses Makmur", sector: "Consumer" },
  { ticker: "INCO", name: "Vale Indonesia", sector: "Mining" },
  { ticker: "INDF", name: "Indofood Sukses Makmur", sector: "Consumer" },
  { ticker: "INKP", name: "Indah Kiat Pulp & Paper", sector: "Industry" },
  { ticker: "INTP", name: "Indocement Tunggal Prakarsa", sector: "Industry" },
  { ticker: "ITMG", name: "Indo Tambangraya Megah", sector: "Mining" },
  { ticker: "JPFA", name: "Japfa Comfeed Indonesia", sector: "Agriculture" },
  { ticker: "JSMR", name: "Jasa Marga", sector: "Infrastructure" },
  { ticker: "KLBF", name: "Kalbe Farma", sector: "Health" },
  { ticker: "MAPI", name: "Mitra Adiperkasa", sector: "Trade" },
  { ticker: "MBMA", name: "Merdeka Battery Materials", sector: "Mining" },
  { ticker: "MDKA", name: "Merdeka Copper Gold", sector: "Mining" },
  { ticker: "MEDC", name: "Medco Energi Internasional", sector: "Energy" },
  { ticker: "MIKA", name: "Mitra Keluarga Karyasehat", sector: "Health" },
  { ticker: "MNCN", name: "Media Nusantara Citra", sector: "Media" },
  { ticker: "PGEO", name: "Pertamina Geothermal Energy", sector: "Energy" },
  { ticker: "PGAS", name: "Perusahaan Gas Negara", sector: "Energy" },
  { ticker: "PTBA", name: "Bukit Asam", sector: "Mining" },
  { ticker: "SMGR", name: "Semen Indonesia", sector: "Industry" },
  { ticker: "TBIG", name: "Tower Bersama Infrastructure", sector: "Infrastructure" },
  { ticker: "TKIM", name: "Pabrik Kertas Tjiwi Kimia", sector: "Industry" },
  { ticker: "TLKM", name: "Telkom Indonesia", sector: "Telecom" },
  { ticker: "TOWR", name: "Sarana Menara Nusantara", sector: "Infrastructure" },
  { ticker: "TPIA", name: "Chandra Asri Pacific", sector: "Chemical" },
  { ticker: "UNTR", name: "United Tractors", sector: "Automotive" },
  { ticker: "UNVR", name: "Unilever Indonesia", sector: "Consumer" },
  { ticker: "WINC", name: "Wintermar Offshore Marine", sector: "Transport" },
];

function getCustomTickers() {
  try {
    return JSON.parse(localStorage.getItem('customTickers') || '[]');
  } catch { return []; }
}

function saveCustomTickers(list) {
  localStorage.setItem('customTickers', JSON.stringify(list));
}

function getAllTickers() {
  const custom = getCustomTickers().map(t => ({
    ticker: t,
    name: "Custom",
    sector: "Custom",
    isCustom: true
  }));
  return [...LQ45_LIST, ...custom];
}

function addCustomTicker() {
  const input = document.getElementById('newTicker');
  const ticker = input.value.trim().toUpperCase();
  if (!ticker) return;

  const existing = getAllTickers().map(t => t.ticker);
  if (existing.includes(ticker)) {
    showToast(`${ticker} sudah ada di list`, 'info');
    return;
  }

  const custom = getCustomTickers();
  custom.push(ticker);
  saveCustomTickers(custom);
  input.value = '';
  renderCustomTickers();
  showToast(`${ticker} ditambahkan`, 'success');
}

function removeCustomTicker(ticker) {
  const custom = getCustomTickers().filter(t => t !== ticker);
  saveCustomTickers(custom);
  renderCustomTickers();
  showToast(`${ticker} dihapus`, 'info');
}

function renderCustomTickers() {
  const container = document.getElementById('customTickers');
  if (!container) return;
  const custom = getCustomTickers();
  if (custom.length === 0) {
    container.innerHTML = '<span style="font-size:11px;color:var(--text3)">Belum ada ticker custom</span>';
    return;
  }
  container.innerHTML = custom.map(t => `
    <div class="custom-ticker-tag">
      ${t}
      <button onclick="removeCustomTicker('${t}')" title="Hapus">×</button>
    </div>
  `).join('');
}

function renderDefaultTickers() {
  const container = document.getElementById('defaultTickers');
  if (!container) return;
  container.innerHTML = LQ45_LIST.map(s =>
    `<div class="ticker-chip">${s.ticker}</div>`
  ).join('');
}
