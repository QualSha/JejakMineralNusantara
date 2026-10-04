# Data Processing Agent Guidance

## Peran & Tujuan
Panduan ini ditujukan untuk memproses data mentah (BPS, Kementerian ESDM, Kementerian Perdagangan) dalam format Excel/CSV menjadi file JSON/GeoJSON terstruktur dan teroptimasi untuk web *scrollytelling* tanpa ketergantungan server runtime.

## Standar Output Data
Semua file output disimpan di direktori `data/processed/`:
1. `struktur_pdb.json`: Hierarki 3-level Produk Domestik Bruto (Nasional $\rightarrow$ Sektor Primer/Sekunder/Tersier $\rightarrow$ 17 Lapangan Usaha BPS).
2. `pdrb_tambang_geo.geojson`: FeatureCollection GeoJSON batas wilayah Indonesia dengan properti PDRB tambang, manufaktur, dan hilirisasi.
3. `pelabuhan_node.json`: Titik koordinat pelabuhan utama dengan atribut volume ekspor, komoditas primer, dan kapasitas infrastruktur.
4. `ekspor_flow.json`: Matriks aliran perdagangan komoditas (Pelabuhan asal $\rightarrow$ Negara tujuan $\rightarrow$ Nilai USD $\rightarrow$ Volume Ton).

## Aturan Validasi & Integritas Data
- **Presisi Numerik**: Simpan nilai moneter dalam satuan standar (Triliun Rupiah untuk PDB domestik, Juta/Miliar USD untuk ekspor global) untuk menghindari *floating point overflow*.
- **Geometri Valid**: GeoJSON harus menggunakan koordinat WGS84 (EPSG:4326), urutan `[longitude, latitude]`.
- **Hierarki Bersih**: Struktur Sunburst dan Treemap harus memiliki node daun bertipe `{ name, value, children? }` yang konsisten tanpa *null cycle*.
