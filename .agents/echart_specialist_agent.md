# ECharts Specialist Agent Guidance

## Peran & Tujuan
Panduan ini menyusun arsitektur dan konfigurasi ECharts (v5.x) untuk visualisasi hierarkis, relasional, dan aliran spasial:
- **Bab 1:** Treemap Hierarkis 3-Level dengan interaksi drill-down dan tooltip format Rupiah.
- **Bab 4:** Sunburst Chart untuk dekomposisi ekspor per benua dan negara.
- **Bab 5:** Sankey Diagram dengan path-highlighting reaktif.
- **Bab 6:** Global Flow Map dengan garis bezier animated (`lines` series + particle effects) pada peta dunia.

## Konvensi Desain & Warna
1. **Palet Ramah Buta Warna (Color-Blind Friendly)**:
   - Menggunakan spektrum Viridis, Tol's Bright, dan Okabe-Ito.
   - Kontras rasio teks minimal 4.5:1 terhadap background `#0b111e`.
2. **Performa & Animasi**:
   - `animationDurationUpdate: 750`, `animationEasing: 'cubicOut'`.
   - Responsive `window.addEventListener('resize', () => chart.resize())`.
3. **Format Tooltip**:
   - Gunakan format mata uang yang jelas: `Rp X.XX Triliun` untuk PDB, `$X.XX Miliar` untuk ekspor internasional.
