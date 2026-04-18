# IHSG Scanner — Volume Breakout 3-Layer Filter

Dashboard untuk screening saham IHSG berdasarkan volume anomali dan price structure.

## Fitur

- **Scanner** — Auto-fetch data dari Yahoo Finance, filter 3 layer otomatis
- **Journal** — Catat setiap trade dan hasilnya
- **Edge Stats** — Kalkulasi win rate dan expectancy per kombinasi layer
- **Google Sheets Sync** — Backup journal ke cloud

## 3-Layer Framework

| Layer | Kriteria | Gate |
|-------|----------|------|
| L1 Volume Spike | Volume saat ini > 2.5x rata-rata | Wajib lolos |
| L2 Price Structure | Harga menembus resistance (high 5 hari) | Konfirmasi |
| L3 Market Context | IHSG sedang uptrend hari itu | Konteks |

## Setup

1. Buka `https://[username].github.io/ihsg-scanner`
2. Klik **Scan** untuk mulai screening
3. Saham yang lolos L1 otomatis masuk hasil scan
4. Log setiap trade di tab **Journal**
5. Monitor edge lo di tab **Edge Stats**

## Data Source

Yahoo Finance via allorigins CORS proxy. Delay ~15 menit dari harga real-time. Cukup untuk pre-market scanner dan trend following.

## Google Sheets Integration

Lihat panduan setup di file `SHEETS_SETUP.md`.
