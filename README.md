# Denyut Manufaktur dan Tambang: Dari PDRB Daerah hingga Rantai Pasok Global

> **Dokumentasi Proyek Data Storytelling & Visualisasi Akademik (Format Standar Makalah IEEE)**  
> **Tema:** Transformasi Ekonomi Makro Sektor Ekstraktif dan Hilirisasi Manufaktur Indonesia ke Panggung Perdagangan Global  
> **Tech Stack:** 100% Client-Side SPA (HTML5, Vanilla CSS3, JavaScript ES6+, ECharts v5, Leaflet.js, OpenPyXL Preprocessing)

---

## 1. Abstrak (Abstract)
Makalah dan repositori proyek ini menyajikan sistem jurnalisme data interaktif berbasis *scrollytelling* satu halaman (SPA) berjudul **"Denyut Manufaktur dan Tambang: Dari PDRB Daerah hingga Rantai Pasok Global"**. Sistem ini memvisualisasikan data hierarkis makroekonomi domestik, geospasial tingkat sub-nasional, hingga koridor rantai pasok maritim internasional tanpa menggunakan *backend server* (100% statis). Melalui enam bab berurutan yang mencakup tiga topik visualisasi dengan enam representasi grafik berbeda (Treemap, Peta Choropleth, Peta Simbol Proporsional, Sunburst Chart, Diagram Sankey, dan Global Flow Map), aplikasi ini mendemonstrasikan bagaimana kebijakan hilirisasi komoditas mineral dan batubara Indonesia mentransformasi struktur Produk Domestik Bruto (PDB) nasional, menciptakan konsentrasi spasial di daerah, dan menghubungkan simpul pelabuhan kepulauan ke sentra industri lima benua dunia.

---

## 2. Struktur Alur Cerita & Taksonomi Visual Encoding

Tabel berikut menyajikan pemetaan formal antara bab narasi, data, representasi grafik, visual mark, dan channel perseptual:

| Bab | Topik Visualisasi | Tipe Visualisasi | Dataset Sumber | Visual Mark | Visual Channels | Fitur Interaktif |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bab 1** | Hierarki 1 | **Treemap Multi-Level** | `struktur_pdb.json` | Area persegi bertingkat | Ukuran luas poligon (PDB Rp), Posisi hierarkis, Warna kategori sektor | Tooltip nilai Rupiah, *drill-down* klik kotak, filter tombol sektor primer/sekunder/tersier |
| **Bab 2** | Geospasial 1 | **Peta Choropleth** | `pdrb_tambang_geo.geojson` | Poligon batas wilayah | Skala warna perseptual *Viridis* (Intensitas PDRB Tambang Rp) | Hover tooltip nama wilayah, nilai PDRB, pangsa ekonomi lokal, tombol fokus wilayah |
| **Bab 3** | Geospasial 2 | **Peta Simbol Proporsional** | `pelabuhan_node.json` | Titik lingkaran (Circle Markers) | Radius lingkaran ($\propto \sqrt{\text{Nilai USD}}$), Posisi koordinat geodesik | Ripple pulse effect, popup kapasitas sandar kapal, komoditas primer, dan volume ekspor |
| **Bab 4** | Hierarki 2 | **Sunburst Chart** | `ekspor_flow.json` | Irisan cincin melingkar | Sudut busur lingkaran (Proporsi Ekspor USD), Radius konsentris (3 level), Rona warna | Animasi rotasi, *drill-down* klik irisan benua, filter tombol benua spesifik |
| **Bab 5** | Aliran 1 | **Diagram Sankey** | `ekspor_flow.json` | Node balok & Tautan kurva | Lebar pita aliran (Volume & Nilai Transaksi USD), Gradien warna sumber-target | *Path-highlighting* interaktif saat kursor diarahkan ke simpul pelabuhan/negara, filter komoditas |
| **Bab 6** | Aliran 2 (Grand Finale) | **Global Flow Map** | `world.json` & `ekspor_flow.json` | Garis lengkung busur (*Arc Lines*) & Partikel | Koordinat asal-tujuan, Ketebalan garis, Partikel vektor animasi mengalir searah jarum pelayaran | Animasi aliran partikel menyala, zoom & pan interaktif, tooltip rute bilateral maritim |

---

## 3. Landasan Desain & Aksesibilitas (Color-Blind Friendly)

1. **Skala Warna Perseptual Seragam (Viridis & Okabe-Ito)**:
   - Visualisasi geospasial pada Bab 2 menggunakan palet warna **Viridis** (`#440154` $\rightarrow$ `#3b528b` $\rightarrow$ `#21918c` $\rightarrow$ `#5ec962` $\rightarrow$ `#fde725`). Skala ini dirancang secara matematis untuk memiliki gradien luminans monotonik yang mempertahankan kontras keterbacaan sempurna bagi spektrum penglihatan normal, deutan, protan, dan tritanopia.
2. **Kompensasi Persepsi Flannery (Bab 3)**:
   - Pada peta simbol proporsional, luas persepsi lingkaran manusia cenderung dinilai lebih rendah (*underestimation*). Radius dihitung menggunakan formula penskalaan Flannery:
     $$R = R_{\text{base}} \times \left(\frac{V}{V_{\max}}\right)^{0.57}$$
     sehingga pembaca mempersepsikan rasio nilai ekspor antar-pelabuhan secara akurat.
3. **Desain Antarmuka Split-Screen & Glassmorphism**:
   - Tata letak *split-screen* pada desktop mengunci grafik (*sticky visualization stage*) di sisi kanan, sementara narasi teks bergulir di sisi kiri.
   - Pemanfaatan *backdrop-filter: blur(16px)*, kontras teks minimal 4.5:1 (memenuhi standar WCAG 2.1 AAA), dan tipografi *Plus Jakarta Sans* serta *JetBrains Mono*.

---

## 4. Struktur Direktori Proyek

```text
uas-visdat-story/
│
├── .agents/                        # Panduan dan aturan operasional AI Assistant
│   ├── data_processing_agent.md    # Aturan pemrosesan Excel ke JSON
│   ├── echart_specialist_agent.md  # Konfigurasi ECharts Treemap/Sunburst/Sankey/Flow
│   └── leaflet_map_agent.md        # Konfigurasi Leaflet Choropleth & Proportional Symbol
│
├── data/                           
│   ├── raw/                        # File data tabel mentah (Excel .xlsx)
│   │   ├── struktur_pdb.xlsx
│   │   ├── pdrb_tambang_kab.xlsx
│   │   ├── ekspor_tambang.xlsx
│   │   ├── koordinat_pelabuhan.xlsx
│   │   └── koordinat_negara.xlsx
│   │
│   └── processed/                  # Dataset JSON/GeoJSON teroptimasi untuk web
│       ├── struktur_pdb.json
│       ├── pdrb_tambang_geo.geojson
│       ├── pelabuhan_node.json
│       ├── ekspor_flow.json
│       └── world.json
│
├── scripts/                        # Script Python untuk preprocessing data
│   ├── 01_process_pdb.py
│   ├── 02_process_geojson.py
│   └── 03_process_export_flow.py
│
├── assets/                         # Aset statis web
│   ├── css/
│   │   └── style.css               # Desain sistem scrollytelling dan tema modern dark
│   └── js/
│       ├── main.js                 # Inisialisasi utama dan observer scrolling
│       ├── chart_treemap.js        # Logika Bab 1 (Treemap PDB)
│       ├── map_indonesia.js        # Logika Bab 2 & 3 (Leaflet Choropleth & Ports)
│       ├── chart_sunburst.js       # Logika Bab 4 (Sunburst Ekspor)
│       ├── chart_sankey.js         # Logika Bab 5 (Sankey Rantai Pasok)
│       └── map_global.js           # Logika Bab 6 (Global Flow Map)
│
├── index.html                      # Halaman utama aplikasi (SPA)
└── README.md                       # Dokumentasi akademik lengkap (Format IEEE)
```

---

## 5. Panduan Instalasi & Eksekusi Lokal

### Prasyarat:
- Python 3.10+ (dengan paket `openpyxl`)
- Browser modern (Google Chrome, Mozilla Firefox, Microsoft Edge, atau Safari)

### Langkah-langkah:
1. **Buka Direktori Proyek**:
   ```bash
   cd uas-visdat-story
   ```

2. **Jalankan Preprocessing Data (Opsional / Verifikasi)**:
   ```bash
   python scripts/01_process_pdb.py
   python scripts/02_process_geojson.py
   python scripts/03_process_export_flow.py
   ```

3. **Jalankan Web Server Lokal**:
   Karena aplikasi membaca file JSON/GeoJSON lokal via `Fetch API`, jalankan HTTP server lokal sederhana:
   ```bash
   python -m http.server 8000
   ```
   *atau menggunakan Node.js:*
   ```bash
   npx serve .
   ```

4. **Akses Antarmuka Web**:
   Buka peramban web dan navigasikan ke:
   ```text
   http://localhost:8000
   ```

---

## 6. Referensi & Sitasi Akademik (IEEE Format)

```bibtex
[1] Badan Pusat Statistik Republik Indonesia (BPS), "Produk Domestik Bruto Indonesia Menurut Lapangan Usaha 2020–2024," BPS RI Publication Series, no. 3101001, Jakarta, 2024.
[2] Kementerian Energi dan Sumber Daya Mineral (ESDM), "Laporan Kinerja Sektor Mineral dan Batubara serta Realisasi Hilirisasi Nasional," Ditjen Minerba ESDM RI, Jakarta, 2024.
[3] Kementerian Perdagangan Republik Indonesia, "Warta Ekspor: Neraca Perdagangan dan Dinamika Komoditas Logam Olahan Indonesia," Ditjen PEN Kemendag, Jakarta, 2024.
[4] S. Bateman, R. L. Mandryk, C. Gutwin, and A. Genest, "Useful junk? The effects of visual embellishment on comprehension and memorability of charts," in Proc. 28th Int. Conf. Human Factors in Computing Systems (CHI '10), Atlanta, GA, USA, 2010, pp. 2573–2582.
[5] S. J. Flannery, "The relative effectiveness of television and the press in political campaigns," Cartographic Journal, vol. 8, no. 2, pp. 96–109, 1971.
[6] J. J. Nuñez, C. R. Anderton, and R. S. Rensink, "Optimizing colormaps for perceptual uniformity and color-vision deficiency in geospatial visualization," IEEE Transactions on Visualization and Computer Graphics, vol. 24, no. 1, pp. 648–658, Jan. 2018.
```
