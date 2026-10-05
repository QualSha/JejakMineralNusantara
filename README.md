# Jejak Mineral Nusantara di Peta Perdagangan Global

> **Dokumentasi Proyek Data Storytelling & Dashboard Visualisasi Interaktif**  
> **Ujian Akhir Semester (UAS) Visualisasi Data**  
> **Penyusun:** Haykal Pasha Siregar (NIM: 222313117 / Kelas: 3SD2)  
> **Institusi:** Politeknik Statistika STIS  
> **Tema:** Transformasi Ekonomi Makro Sektor Ekstraktif, Disparitas Wilayah, dan Rantai Pasok Maritim Global Indonesia  
> **Repositori GitHub:** [https://github.com/QualSha/JejakMineralNusantara](https://github.com/QualSha/JejakMineralNusantara)

---

## 1. Ikhtisar & Ringkasan Eksekutif

Aplikasi ini menyajikan investigasi data visual komparatif komprehensif mengenai peranan sektor pertambangan dan hilirisasi mineral Indonesia dalam struktur perekonomian domestik hingga jejaring perdagangan maritim internasional. Seluruh visualisasi dibangun secara mandiri (*100% Client-Side Static Architecture*) tanpa ketergantungan server backend, mengolah publikasi resmi **Badan Pusat Statistik (BPS) 2025**.

Platform ini menyediakan dua moda penjelajahan komplementer:
1. **Web Story Naratif ([web-story.html](file:///c:/Users/Haykal%20Pasha%20Siregar/Documents/Web/uas-visdat/web-story.html))**: Artikel jurnalisme data berbasis *scrollytelling* interaktif satu halaman (SPA) dengan *sticky visualization stage*, memandu pembaca menelusuri narasi enam bab investigatif secara runut.
2. **Dashboard Interaktif Eksploratif ([dashboard.html](file:///c:/Users/Haykal%20Pasha%20Siregar/Documents/Web/uas-visdat/dashboard.html))**: Dashboard analitik layar penuh (*fullscreen*) mandiri dengan 6 panel visualisasi, panel filter multi-kriteria, navigasi tab mandiri, serta fitur *deep-dive* eksplorasi data.

---

## 2. Struktur 6 Bab & Taksonomi Visual Encoding

Proyek ini menerapkan enam representasi visual berbeda untuk menjawab tiga dimensi analitis (hierarki makro, geospasial domestik, dan aliran rantai pasok global):

| Bab / Panel | Topik Analitik | Tipe Visualisasi | Dataset Sumber | Visual Mark | Visual Channels | Fitur Interaktif |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Bab 1** | Hierarki Makroekonomi | **Treemap Multi-Level** | `struktur_pdb.json` | Area persegi bertingkat (*rectangles*) | Luas poligon ($\propto \text{PDB Rp}$), Posisi hierarkis, Warna kategori sektor primer/sekunder/tersier | *Drill-down* klik sektor, tombol filter kategori sektor makro, *hover tooltip* nominal & persentase pangsa nasional. |
| **Bab 2** | Geospasial Sub-Nasional | **Peta Choropleth Disparitas Daerah** | `pdrb_tambang_geo.geojson` | Poligon batas 519 kabupaten/kota | Gradasi skala warna *Viridis* monotonik ($\propto \text{Intensitas PDRB Tambang}$) | *Hover tooltip* nama kabupaten/kota, nilai PDRB nominal, pangsa ekonomi lokal, tombol fokus wilayah pulau utama. |
| **Bab 3** | Geospasial Simpul Logistik | **Peta Simbol Proporsional** | `pelabuhan_node.json` & `pdrb_tambang_geo.geojson` | Titik lingkaran (*Circle Markers*) berdenyut (*pulse*) | Posisi koordinat geodesik, Radius lingkaran dihitung dengan formula Flannery ($R \propto V^{0.57}$) | *Popup modal* nama pelabuhan, komoditas muat dominan, volume metrik ton, dan total nilai ekspor USD. |
| **Bab 4** | Hierarki Pasar Global | **Sunburst Chart Multi-Tier** | `ekspor_flow.json` | Irisan cincin melingkar (*concentric arcs*) | Sudut busur lingkaran ($\propto \text{Nilai Ekspor USD}$), Radius konsentris (3 tingkatan), Rona warna benua | Rotasi smooth, *drill-down* klik segmen benua/negara, tombol navigasi fokus benua target. |
| **Bab 5** | Aliran Rantai Pasok 1 | **Diagram Sankey D3.js** | `ekspor_flow.json` | Balok vertikal (*nodes*) & Pita kurva bezier (*links*) | Lebar pita aliran ($\propto \text{Nilai Transaksi USD}$), Gradien warna sumber ke target | *Interactive path-highlighting* saat kursor melintasi simpul pelabuhan/negara, filter pemilihan kelompok komoditas. |
| **Bab 6** | Aliran Rantai Pasok 2 (Grand Finale) | **Global Flow Map Maritim** | `ekspor_flow.json` | Kurva busur geodesik (*arc routes*) & Partikel kapal SVG | Koordinat rute asal-tujuan, Ketebalan garis aliran, Partikel kapal animasi vektor berlayar real-time | Animasi pelayaran kapal kontinu, *dropdown filter* pelabuhan muat asal, tombol stage alur perdagangan antar-benua. |

---

## 3. Desain Sistem & Aksesibilitas

### A. Estetika *Softly Digital Minimalism* & Analog Paper Feel
- **Palet Warna Hangat**: Kanvas dasar menggunakan nuansa kertas hangat (*Warm Paper* `#FDFCF8`), kontras teks utama *Deep Charcoal* (`#292524`), serta aksen warna tematik *Terracotta Coral* (`#E07A5F`), *Deep Rust* (`#B83E28`), dan *Forest Emerald* (`#2D6A4F`).
- **Tekstur Taktil**: Lapisan *analog tactile paper grain overlay* dan *soft ambient background blobs* memberikan kedalaman visual tanpa mengorbankan keterbacaan data.
- **Tipografi Tri-Font**:
  - `Outfit`: Tipografi sans-serif geometris modern untuk judul, tajuk kartu, dan body copy.
  - `Geist Mono`: Font monospace berpresisi tinggi untuk representasi angka metrik, koordinat, dan figur data finansial.
  - `Reenie Beanie`: Aksentuasi editorial gaya tulisan tangan (*editorial callout*) untuk catatan kaki dan wawasan penekanan.

### B. Aksesibilitas & Faktor Manusia (*Human Factors*)
1. **Skala Warna Perseptual Ramah Buta Warna (*Color-Blind Friendly*)**:
   Visualisasi geospasial Bab 2 memanfaatkan skala kuantil **Viridis** (`#440154` $\rightarrow$ `#21918c` $\rightarrow$ `#fde725`) yang memiliki gradien luminans monotonik seragam, menjamin pembacaan data yang akurat bagi penglihatan normal maupun penderita *deuteranopia*, *protanopia*, dan *tritanopia*.
2. **Kompensasi Persepsi Luas Flannery**:
   Pada peta simbol proporsional (Bab 3), persepsi manusia terhadap luas lingkaran diakomodasi menggunakan formula penskalaan Flannery:
   $$R = R_{\text{base}} \times \left(\frac{V}{V_{\max}}\right)^{0.57}$$
   mencegah distorsi bawah-taksir (*underestimation*) pada simpul pelabuhan berkapasitas besar.
3. **Kontras & Keterbacaan**:
   Rasio kontras seluruh teks memenuhi kriteria **WCAG 2.1 AA/AAA** (minimal 4.5:1 untuk teks normal).
4. **Optimasi Tata Letak Seluler**:
   Dilengkapi komponen cerdas *Orientation Recommendation Overlay* pada perangkat mobile untuk merekomendasikan orientasi horizontal (lanskap) demi kenyamanan eksplorasi peta 519 daerah dan alur 535 rute maritim.

---

## 4. Struktur Direktori Proyek

```text
JejakMineralNusantara/
│
├── web-story.html                      # Halaman data storytelling naratif interaktif (Scrollytelling SPA)
├── dashboard.html                      # Halaman dashboard analitik eksploratif layar penuh (Standalone)
├── pdrb_tambang_geo.geojson            # Dataset geospasial batas wilayah 519 kabupaten/kota & nilai PDRB (22.5 MB)
├── favicon.ico / favicon.svg           # Identitas visual & favicon peramban web
│
├── assets/                             # Aset frontend aplikasi
│   ├── css/
│   │   └── style.css                   # Desain sistem Warm Paper, glassmorphism, dan utility layout
│   ├── js/
│   │   ├── main.js                     # Pengendali scrollama, navbar pill dinamis, & inisialisasi bab
│   │   ├── chart_treemap.js            # Modul ECharts Bab 1 (Struktur PDB Nasional)
│   │   ├── map_indonesia.js            # Modul Leaflet Bab 2 (Choropleth PDRB 519 Daerah)
│   │   ├── map_port.js                 # Modul Leaflet Bab 3 (Simbol Proporsional 74 Pelabuhan)
│   │   ├── chart_sunburst.js           # Modul ECharts Bab 4 (Sunburst Pangsa Benua & Negara)
│   │   ├── chart_sankey.js             # Modul D3.js Bab 5 (Diagram Sankey Rantai Pasok)
│   │   └── map_global.js               # Modul Leaflet & Arcs Bab 6 (Global Maritime Flow Map)
│   └── img/
│       ├── logo_editorial.svg          # Logo vektor identitas Jejak Mineral Nusantara
│       └── favicon.svg                 # Simbol kristal tambang facet
│
├── data/                               # Direktori data sumber dan hasil olahan
│   ├── processed/                      # Data terstruktur format JSON siap saji
│   │   ├── struktur_pdb.json           # Matriks hierarki PDB 17 sektor 2025
│   │   ├── pdrb_tambang_geo.geojson    # Salinan GeoJSON batas daerah teroptimasi
│   │   ├── pelabuhan_node.json         # Metadata 74 pelabuhan muat ekspor
│   │   ├── ekspor_flow.json            # Matriks 535 rute aliran ekspor & komoditas
│   │   └── world.json                  # Geometri peta poligon dunia
│   └── raw/                            # Data tabular sumber (BPS RI) format Excel (.xlsx)
│       ├── struktur_pdb.xlsx
│       ├── pdrb_tambang_kab.xlsx
│       ├── ekspor_tambang.xlsx
│       ├── koordinat_pelabuhan.xlsx
│       └── koordinat_negara.xlsx
│
├── .agents/                            # Konfigurasi AI agent directives, skills, & antislop rules
├── AGENTS.md / GEMINI.md               # Pointer direktif agen pengembangan
│
├── 3SD2_222313117_Haykal Pasha Siregar.docx # Naskah lengkap laporan UAS format IEEE
├── 3SD2_222313117_Haykal Pasha Siregar.pdf  # Dokumen final laporan UAS terpublikasi
├── package.json / package-lock.json    # Konfigurasi dependensi pendukung
└── README.md                           # Dokumentasi teknis proyek
```

---

## 5. Panduan Menjalankan Secara Lokal

Aplikasi ini menggunakan `Fetch API` peramban untuk memuat berkas JSON/GeoJSON lokal, sehingga membutuhkan server HTTP lokal sederhana agar tidak terhalang oleh pembatasan keamanan *CORS/file://*.

### Langkah-Langkah:

1. **Kloning Repositori**:
   ```bash
   git clone https://github.com/QualSha/JejakMineralNusantara.git
   cd JejakMineralNusantara
   ```

2. **Jalankan Server Lokal**:
   Gunakan salah satu perintah sederhana di bawah ini:
   
   - Menggunakan **Python 3**:
     ```bash
     python -m http.server 8000
     ```
   - *Atau* menggunakan **Node.js (npx)**:
     ```bash
     npx serve . -p 8000
     ```

3. **Buka Melalui Peramban Web**:
   - Untuk menjelajahi **Web Story Naratif**:  
     `http://localhost:8000/web-story.html`
   - Untuk membuka **Dashboard Interaktif Eksploratif**:  
     `http://localhost:8000/dashboard.html`

---

## 6. Sumber Data & Metodologi

1. **Produk Domestik Bruto (PDB) 2025**:
   Publikasi Produk Domestik Bruto Menurut Lapangan Usaha (Atas Dasar Harga Berlaku), Badan Pusat Statistik Republik Indonesia (BPS RI).
2. **Produk Domestik Regional Bruto (PDRB) 519 Daerah**:
   Publikasi PDRB Kabupaten/Kota Menurut Lapangan Usaha Sektor Pertambangan dan Penggalian (ADHB), BPS RI.
3. **Statistik Perdagangan Luar Negeri (Ekspor Tambang)**:
   Data Transaksi Ekspor Komoditas Tambang dan Mineral Berdasarkan Kode Harmonized System (HS 2-Digit: Bab 25, 26, dan 27), mencakup 74 pelabuhan muat asal di Indonesia menuju negara mitra dagang internasional di lima benua.
4. **Peta Geospasial**:
   Batas Administrasi Kabupaten/Kota Badan Informasi Geospasial (BIG)/BPS, dipadukan dengan *Esri World Light Gray Canvas Basemap* untuk peta maritim global.

---

## 7. Referensi Akademik (Format IEEE)

```text
[1] Badan Pusat Statistik Republik Indonesia (BPS), "Produk Domestik Bruto Indonesia Menurut Lapangan Usaha 2020–2025," Publikasi Statistik Nasional BPS RI, Jakarta, 2025.
[2] Badan Pusat Statistik Republik Indonesia (BPS), "Produk Domestik Regional Bruto Kabupaten/Kota di Indonesia 2020–2025," Direktorat Neraca Produksi BPS RI, Jakarta, 2025.
[3] Badan Pusat Statistik Republik Indonesia (BPS), "Statistik Ekspor Komoditas Pertambangan dan Migas Menurut Pelabuhan Muat dan Negara Tujuan 2024–2025," Direktorat Statistik Distribusi BPS RI, Jakarta, 2025.
[4] J. J. Nuñez, C. R. Anderton, and R. S. Rensink, "Optimizing colormaps for perceptual uniformity and color-vision deficiency in geospatial visualization," IEEE Transactions on Visualization and Computer Graphics, vol. 24, no. 1, pp. 648–658, Jan. 2018.
[5] S. J. Flannery, "The relative effectiveness of television and the press in political campaigns," Cartographic Journal, vol. 8, no. 2, pp. 96–109, 1971.
[6] S. Bateman, R. L. Mandryk, C. Gutwin, and A. Genest, "Useful junk? The effects of visual embellishment on comprehension and memorability of charts," in Proc. 28th Int. Conf. Human Factors in Computing Systems (CHI '10), Atlanta, GA, USA, 2010, pp. 2573–2582.
```
