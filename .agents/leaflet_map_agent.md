# Leaflet Map Specialist Agent Guidance

## Peran & Tujuan
Panduan ini mengatur implementasi Leaflet.js untuk Bab 2 (Choropleth PDRB Tambang) dan Bab 3 (Peta Simbol Proporsional Pelabuhan Ekspor):
- **Base Tile**: Menggunakan CartoDB Dark Matter / Alidade Smooth Dark untuk menjaga estetika visual jurnalisme modern.
- **Choropleth Layer**: Rendering poligon batas wilayah Indonesia dengan visual encoding gradien *Viridis*.
- **Proportional Symbol**: `L.circleMarker` dengan radius proporsional $\sqrt{\text{Nilai Ekspor}}$ agar representasi persepsi visual luas lingkaran akurat (Flannery Compensation).

## Interaksi & Transisi Scrollytelling
- Kontrol layer dinamis: saat pengguna bergulir dari Bab 2 ke Bab 3, layer titik pelabuhan diaktifkan secara transisi lembut (fade-in) di atas choropleth wilayah.
- Custom popup & hover highlight dengan informasi sentra tambang, jenis komoditas (Nikel, Batubara, Tembaga, Bauksit, Emas), dan volume ekspor.
