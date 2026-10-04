#!/usr/bin/env python3
"""
Script 02: Preprocessing Geospasial Indonesia & Pelabuhan Ekspor
Menghasilkan:
- data/raw/pdrb_tambang_kab.xlsx
- data/raw/koordinat_pelabuhan.xlsx
- data/processed/pdrb_tambang_geo.geojson (Choropleth PDRB Tambang)
- data/processed/pelabuhan_node.json (Proportional Symbol Node)
"""

import os
import json
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
PROCESSED_DIR = os.path.join(BASE_DIR, "data", "processed")

os.makedirs(RAW_DIR, exist_ok=True)
os.makedirs(PROCESSED_DIR, exist_ok=True)

# Data Sentra Tambang & Wilayah Ekonomi Indonesia (BPS & ESDM)
PDRB_KAB_DATA = [
    {
        "id": "ID-KU-TIM",
        "name": "Kab. Kutai Timur (Kaltim)",
        "region_type": "Kabupaten",
        "province": "Kalimantan Timur",
        "pdrb_tambang_triliun": 142.85,
        "pdrb_manufaktur_triliun": 18.20,
        "total_pdrb_triliun": 182.40,
        "mining_share_percent": 78.32,
        "commodity": "Batubara (Thermal Coal KPC)",
        "hilirisasi_status": "Proyek Gasifikasi Batubara & Terminal Muara Bengalon",
        "color_rank": 5,
        "center": [117.58, 0.95],
        "coords": [
            [116.8, 0.2], [117.3, 0.1], [118.2, 0.8], [118.9, 1.4], [118.4, 1.8], [117.2, 1.5], [116.5, 0.9], [116.8, 0.2]
        ]
    },
    {
        "id": "ID-KU-KAR",
        "name": "Kab. Kutai Kartanegara (Kaltim)",
        "region_type": "Kabupaten",
        "province": "Kalimantan Timur",
        "pdrb_tambang_triliun": 128.40,
        "pdrb_manufaktur_triliun": 14.60,
        "total_pdrb_triliun": 172.90,
        "mining_share_percent": 74.26,
        "commodity": "Batubara & Gas Alam",
        "hilirisasi_status": "PLTU Mulut Tambang & Suplai Gas Mahakam",
        "color_rank": 5,
        "center": [116.98, -0.44],
        "coords": [
            [116.3, -0.8], [117.1, -1.0], [117.6, -0.6], [117.4, 0.1], [116.7, 0.3], [116.0, -0.2], [116.3, -0.8]
        ]
    },
    {
        "id": "ID-PASER",
        "name": "Kab. Paser (Kaltim)",
        "region_type": "Kabupaten",
        "province": "Kalimantan Timur",
        "pdrb_tambang_triliun": 76.50,
        "pdrb_manufaktur_triliun": 8.30,
        "total_pdrb_triliun": 102.10,
        "mining_share_percent": 74.93,
        "commodity": "Batubara (Kideco Jaya Agung)",
        "hilirisasi_status": "Terminal Batubara Teluk Adang",
        "color_rank": 4,
        "center": [115.95, -1.82],
        "coords": [
            [115.6, -2.1], [116.3, -2.2], [116.5, -1.5], [116.1, -1.3], [115.5, -1.6], [115.6, -2.1]
        ]
    },
    {
        "id": "ID-BERAU",
        "name": "Kab. Berau (Kaltim)",
        "region_type": "Kabupaten",
        "province": "Kalimantan Timur",
        "pdrb_tambang_triliun": 58.20,
        "pdrb_manufaktur_triliun": 6.10,
        "total_pdrb_triliun": 81.30,
        "mining_share_percent": 71.59,
        "commodity": "Batubara Bituminus (Berau Coal)",
        "hilirisasi_status": "Terminal Muara Pantai & Suplai Ekspor",
        "color_rank": 4,
        "center": [117.48, 2.15],
        "coords": [
            [117.0, 1.8], [117.8, 1.7], [118.5, 2.3], [118.0, 2.7], [117.2, 2.6], [117.0, 1.8]
        ]
    },
    {
        "id": "ID-MOROWALI",
        "name": "Kab. Morowali (Sulteng)",
        "region_type": "Kabupaten",
        "province": "Sulawesi Tengah",
        "pdrb_tambang_triliun": 94.60,
        "pdrb_manufaktur_triliun": 88.50,
        "total_pdrb_triliun": 198.80,
        "mining_share_percent": 47.59,
        "commodity": "Bijih Nikel & Manufaktur Logam Dasar (Stainless Steel)",
        "hilirisasi_status": "Kawasan Industri Terpadu IMIP Bahodopi (Pusat Nikel Terbesar RI)",
        "color_rank": 5,
        "center": [121.90, -2.65],
        "coords": [
            [121.4, -3.1], [122.2, -2.9], [122.5, -2.2], [121.9, -2.0], [121.2, -2.5], [121.4, -3.1]
        ]
    },
    {
        "id": "ID-MOR-UTARA",
        "name": "Kab. Morowali Utara (Sulteng)",
        "region_type": "Kabupaten",
        "province": "Sulawesi Tengah",
        "pdrb_tambang_triliun": 42.10,
        "pdrb_manufaktur_triliun": 36.40,
        "total_pdrb_triliun": 88.20,
        "mining_share_percent": 47.73,
        "commodity": "Bijih Nikel Laterit & Ferronickel",
        "hilirisasi_status": "Kawasan Industri GNI (Gunbuster Nickel Industry)",
        "color_rank": 4,
        "center": [121.50, -1.95],
        "coords": [
            [121.0, -2.2], [121.8, -2.1], [122.0, -1.6], [121.4, -1.5], [120.9, -1.9], [121.0, -2.2]
        ]
    },
    {
        "id": "ID-HAL-TENGAH",
        "name": "Kab. Halmahera Tengah (Malut)",
        "region_type": "Kabupaten",
        "province": "Maluku Utara",
        "pdrb_tambang_triliun": 68.70,
        "pdrb_manufaktur_triliun": 62.30,
        "total_pdrb_triliun": 141.50,
        "mining_share_percent": 48.55,
        "commodity": "Nikel & Prekursor Baterai EV (MHP / Nickel Sulfate)",
        "hilirisasi_status": "Kawasan Industri Weda Bay (IWIP)",
        "color_rank": 5,
        "center": [127.95, 0.45],
        "coords": [
            [127.6, 0.1], [128.3, 0.2], [128.5, 0.8], [128.0, 0.9], [127.5, 0.6], [127.6, 0.1]
        ]
    },
    {
        "id": "ID-HAL-SELATAN",
        "name": "Kab. Halmahera Selatan (Malut)",
        "region_type": "Kabupaten",
        "province": "Maluku Utara",
        "pdrb_tambang_triliun": 35.80,
        "pdrb_manufaktur_triliun": 29.40,
        "total_pdrb_triliun": 74.30,
        "mining_share_percent": 48.18,
        "commodity": "Nikel Pulau Obi (Harita Nickel HPAL)",
        "hilirisasi_status": "Pabrik HPAL Pertama Indonesia Menghasilkan Sulfat Nikel",
        "color_rank": 3,
        "center": [127.60, -0.65],
        "coords": [
            [127.2, -1.0], [127.9, -1.1], [128.1, -0.5], [127.7, -0.3], [127.1, -0.6], [127.2, -1.0]
        ]
    },
    {
        "id": "ID-MIMIKA",
        "name": "Kab. Mimika (Papua Tengah)",
        "region_type": "Kabupaten",
        "province": "Papua Tengah",
        "pdrb_tambang_triliun": 92.40,
        "pdrb_manufaktur_triliun": 5.20,
        "total_pdrb_triliun": 116.80,
        "mining_share_percent": 79.11,
        "commodity": "Konsentrat Tembaga & Emas (Grasberg PTFI)",
        "hilirisasi_status": "Pengapalan Konsentrat via Pelabuhan Amamapare ke Smelter",
        "color_rank": 5,
        "center": [136.90, -4.55],
        "coords": [
            [136.1, -5.2], [137.4, -5.0], [137.8, -4.1], [137.0, -3.9], [136.2, -4.4], [136.1, -5.2]
        ]
    },
    {
        "id": "ID-MUARA-ENIM",
        "name": "Kab. Muara Enim & Lahat (Sumsel)",
        "region_type": "Kabupaten",
        "province": "Sumatera Selatan",
        "pdrb_tambang_triliun": 46.80,
        "pdrb_manufaktur_triliun": 7.40,
        "total_pdrb_triliun": 82.50,
        "mining_share_percent": 56.73,
        "commodity": "Batubara Sub-Bituminus (PT Bukit Asam)",
        "hilirisasi_status": "Jalur Kereta Api Batubara Menuju Pelabuhan Tarahan Lampung",
        "color_rank": 4,
        "center": [103.80, -3.85],
        "coords": [
            [103.2, -4.2], [104.2, -4.1], [104.4, -3.4], [103.7, -3.3], [103.1, -3.7], [103.2, -4.2]
        ]
    },
    {
        "id": "ID-BABEL",
        "name": "Kep. Bangka Belitung",
        "region_type": "Provinsi",
        "province": "Kepulauan Bangka Belitung",
        "pdrb_tambang_triliun": 24.30,
        "pdrb_manufaktur_triliun": 18.70,
        "total_pdrb_triliun": 94.60,
        "mining_share_percent": 25.69,
        "commodity": "Bijih Timah & Balok Timah Murni (PT Timah Tbk)",
        "hilirisasi_status": "Smelter Top Submerged Lance (TSL) Ausmelt & Ekspor Ingot",
        "color_rank": 3,
        "center": [106.10, -2.40],
        "coords": [
            [105.4, -2.8], [106.5, -3.2], [107.0, -2.6], [106.7, -1.8], [105.7, -1.7], [105.4, -2.8]
        ]
    },
    {
        "id": "ID-BENGKALIS",
        "name": "Kab. Bengkalis & Riau",
        "region_type": "Kabupaten/Provinsi",
        "province": "Riau",
        "pdrb_tambang_triliun": 71.20,
        "pdrb_manufaktur_triliun": 92.40,
        "total_pdrb_triliun": 365.00,
        "mining_share_percent": 19.51,
        "commodity": "Minyak Bumi (Blok Rokan) & Kimia Petroganik",
        "hilirisasi_status": "Kilang Minyak Dumai & Hilirisasi Bio-refinery CPO",
        "color_rank": 4,
        "center": [101.80, 1.45],
        "coords": [
            [101.1, 0.8], [102.3, 1.0], [102.6, 1.9], [101.9, 2.1], [101.2, 1.6], [101.1, 0.8]
        ]
    },
    {
        "id": "ID-SUMBAWA-BARAT",
        "name": "Kab. Sumbawa Barat (NTB)",
        "region_type": "Kabupaten",
        "province": "Nusa Tenggara Barat",
        "pdrb_tambang_triliun": 38.60,
        "pdrb_manufaktur_triliun": 16.50,
        "total_pdrb_triliun": 58.90,
        "mining_share_percent": 65.53,
        "commodity": "Tembaga & Emas Batu Hijau (Amman Mineral)",
        "hilirisasi_status": "Smelter Tembaga Benete & Pemurnian Logam Mulia",
        "color_rank": 3,
        "center": [116.85, -8.75],
        "coords": [
            [116.5, -9.1], [117.2, -9.0], [117.3, -8.4], [116.7, -8.5], [116.5, -9.1]
        ]
    },
    {
        "id": "ID-KONAWE-KOLAKA",
        "name": "Kab. Konawe & Kolaka (Sultra)",
        "region_type": "Kabupaten",
        "province": "Sulawesi Tenggara",
        "pdrb_tambang_triliun": 36.90,
        "pdrb_manufaktur_triliun": 28.20,
        "total_pdrb_triliun": 86.40,
        "mining_share_percent": 42.71,
        "commodity": "Nikel & Ferronickel (Antam Pomalaa & VDNI)",
        "hilirisasi_status": "Smelter RKEF Konawe & Pomalaa HPAL",
        "color_rank": 3,
        "center": [121.90, -4.05],
        "coords": [
            [121.3, -4.5], [122.3, -4.4], [122.5, -3.6], [121.7, -3.7], [121.3, -4.5]
        ]
    },
    {
        "id": "ID-TELUK-BINTUNI",
        "name": "Kab. Teluk Bintuni (Papua Barat)",
        "region_type": "Kabupaten",
        "province": "Papua Barat",
        "pdrb_tambang_triliun": 32.40,
        "pdrb_manufaktur_triliun": 6.80,
        "total_pdrb_triliun": 46.70,
        "mining_share_percent": 69.38,
        "commodity": "Gas Alam Cair (Tangguh LNG Train 1, 2, 3)",
        "hilirisasi_status": "Kilang Ekspor LNG Terbesar di Kawasan Timur Indonesia",
        "color_rank": 3,
        "center": [133.40, -2.15],
        "coords": [
            [132.8, -2.6], [133.9, -2.5], [134.1, -1.8], [133.2, -1.7], [132.8, -2.6]
        ]
    },
    {
        "id": "ID-KALSEL",
        "name": "Kab. Tanah Bumbu & Kotabaru (Kalsel)",
        "region_type": "Kabupaten",
        "province": "Kalimantan Selatan",
        "pdrb_tambang_triliun": 48.20,
        "pdrb_manufaktur_triliun": 11.50,
        "total_pdrb_triliun": 89.60,
        "mining_share_percent": 53.79,
        "commodity": "Batubara (Arutmin & Jhonlin)",
        "hilirisasi_status": "Terminal Batubara Pulau Laut & Muara Asam-Asam",
        "color_rank": 4,
        "center": [115.90, -3.40],
        "coords": [
            [115.4, -3.9], [116.3, -3.8], [116.4, -3.0], [115.7, -3.0], [115.4, -3.9]
        ]
    },
    {
        "id": "ID-JATIM-GRESIK",
        "name": "Kab. Gresik & Jawa Timur",
        "region_type": "Kabupaten/Provinsi",
        "province": "Jawa Timur",
        "pdrb_tambang_triliun": 18.40,
        "pdrb_manufaktur_triliun": 186.20,
        "total_pdrb_triliun": 420.50,
        "mining_share_percent": 4.38,
        "commodity": "Hilirisasi Konsentrat Tembaga, Emas & Petrokimia",
        "hilirisasi_status": "Smelter Tembaga Single-Line Terbesar di Dunia (Freeport Manyar)",
        "color_rank": 2,
        "center": [112.55, -7.15],
        "coords": [
            [111.9, -7.5], [113.1, -7.5], [113.2, -6.8], [112.2, -6.8], [111.9, -7.5]
        ]
    },
    {
        "id": "ID-JAWA-BARAT",
        "name": "Jawa Barat (Koridor Manufaktur)",
        "region_type": "Provinsi",
        "province": "Jawa Barat",
        "pdrb_tambang_triliun": 6.80,
        "pdrb_manufaktur_triliun": 245.80,
        "total_pdrb_triliun": 580.40,
        "mining_share_percent": 1.17,
        "commodity": "Manufaktur Komponen, Otomotif & Logam Presisi",
        "hilirisasi_status": "Pengguna Akhir Logam Nikel, Baja, & Tembaga Olahan",
        "color_rank": 1,
        "center": [107.60, -6.90],
        "coords": [
            [106.5, -7.5], [108.7, -7.5], [108.8, -6.2], [106.6, -6.1], [106.5, -7.5]
        ]
    },
    {
        "id": "ID-DKI-JAKARTA",
        "name": "DKI Jakarta (Pusat Keuangan & Kantor Tambang)",
        "region_type": "Provinsi",
        "province": "DKI Jakarta",
        "pdrb_tambang_triliun": 0.50,
        "pdrb_manufaktur_triliun": 95.40,
        "total_pdrb_triliun": 750.20,
        "mining_share_percent": 0.07,
        "commodity": "Pusat Jasa Keuangan, Trading Komoditas & Markas Korporasi",
        "hilirisasi_status": "Bursa Komoditas & ICDX",
        "color_rank": 1,
        "center": [106.84, -6.20],
        "coords": [
            [106.68, -6.35], [106.98, -6.35], [106.98, -6.08], [106.68, -6.08], [106.68, -6.35]
        ]
    },
    {
        "id": "ID-SUMUT",
        "name": "Sumatera Utara (Kuala Tanjung & Asahan)",
        "region_type": "Provinsi",
        "province": "Sumatera Utara",
        "pdrb_tambang_triliun": 9.40,
        "pdrb_manufaktur_triliun": 84.60,
        "total_pdrb_triliun": 320.00,
        "mining_share_percent": 2.94,
        "commodity": "Aluminium (Inalum) & Oleokimia",
        "hilirisasi_status": "Peleburan Aluminium Kuala Tanjung & PLTA Asahan",
        "color_rank": 1,
        "center": [99.10, 2.50],
        "coords": [
            [98.0, 1.5], [100.2, 1.6], [100.3, 3.8], [98.2, 3.7], [98.0, 1.5]
        ]
    },
    {
        "id": "ID-KALBAR",
        "name": "Kalimantan Barat (Sentra Bauksit)",
        "region_type": "Provinsi",
        "province": "Kalimantan Barat",
        "pdrb_tambang_triliun": 28.90,
        "pdrb_manufaktur_triliun": 22.40,
        "total_pdrb_triliun": 124.50,
        "mining_share_percent": 23.21,
        "commodity": "Bauksit & Smelter Grade Alumina (SGA Ketapang/Mempawah)",
        "hilirisasi_status": "Smelter Alumina PT WHW & PT BAI Mempawah",
        "color_rank": 3,
        "center": [110.20, 0.10],
        "coords": [
            [108.9, -1.8], [111.4, -1.6], [111.5, 1.8], [109.0, 1.7], [108.9, -1.8]
        ]
    }
]

# Data Pelabuhan Ekspor Utama Indonesia (Bab 3: Proportional Symbols)
PELABUHAN_NODES = [
    {
        "id": "PORT-MUARA-BERAU",
        "name": "Pelabuhan Muara Berau & Samarinda",
        "province": "Kalimantan Timur",
        "city": "Samarinda / Kutai Kartanegara",
        "lat": -0.58,
        "lng": 117.25,
        "export_value_million_usd": 18450.0,
        "export_volume_million_ton": 82.5,
        "primary_commodity": "Batubara (Thermal & Coking Coal)",
        "secondary_commodity": "Kayu Olahan & Biomassa",
        "dominant_destination": "Tiongkok, India, Filipina, Vietnam",
        "vessel_capacity": "Cape-size Transshipment Point",
        "category": "Curah Kering (Energi)"
    },
    {
        "id": "PORT-BAHODOPI",
        "name": "Pelabuhan Khusus IMIP Bahodopi",
        "province": "Sulawesi Tengah",
        "city": "Morowali",
        "lat": -2.81,
        "lng": 122.15,
        "export_value_million_usd": 14200.0,
        "export_volume_million_ton": 22.4,
        "primary_commodity": "Feronikel (FeNi), NPI & Stainless Steel Slab",
        "secondary_commodity": "Nickel Matte & Prekursor Katoda",
        "dominant_destination": "Tiongkok, Korea Selatan, Taiwan, India",
        "vessel_capacity": "Handymax & Panamax Dedicated Berths",
        "category": "Logam Hilirisasi (Nikel)"
    },
    {
        "id": "PORT-TANJUNG-PRIOK",
        "name": "Pelabuhan Tanjung Priok (IPC)",
        "province": "DKI Jakarta",
        "city": "Jakarta Utara",
        "lat": -6.10,
        "lng": 106.88,
        "export_value_million_usd": 16500.0,
        "export_volume_million_ton": 28.6,
        "primary_commodity": "Manufaktur Otomotif, Mesin & Produk Logam Presisi",
        "secondary_commodity": "Elektronik & Tekstil",
        "dominant_destination": "Amerika Serikat, Jepang, Uni Eropa, ASEAN",
        "vessel_capacity": "Post-Panamax Deep Water Container Terminal",
        "category": "Peti Kemas & Manufaktur"
    },
    {
        "id": "PORT-WEDA-BAY",
        "name": "Pelabuhan Khusus IWIP Weda Bay",
        "province": "Maluku Utara",
        "city": "Halmahera Tengah",
        "lat": 0.48,
        "lng": 127.97,
        "export_value_million_usd": 11800.0,
        "export_volume_million_ton": 18.2,
        "primary_commodity": "MHP (Mixed Hydroxide Precipitate) & NPI",
        "secondary_commodity": "Nikel Sulfat Baterai EV",
        "dominant_destination": "Tiongkok, Korea Selatan, Amerika Serikat",
        "vessel_capacity": "Dedicated Industrial Jetty Terminal",
        "category": "Logam Hilirisasi (Baterai EV)"
    },
    {
        "id": "PORT-TANJUNG-PERAK",
        "name": "Pelabuhan Tanjung Perak & Manyar",
        "province": "Jawa Timur",
        "city": "Surabaya & Gresik",
        "lat": -7.19,
        "lng": 112.73,
        "export_value_million_usd": 12900.0,
        "export_volume_million_ton": 19.8,
        "primary_commodity": "Katoda Tembaga Murni 99.99%, Emas Batangan & Petrokimia",
        "secondary_commodity": "Pupuk & Semen",
        "dominant_destination": "Jepang, Korea Selatan, India, Tiongkok, AS",
        "vessel_capacity": "Gresik Smelter Port & Multipurpose Wharf",
        "category": "Logam Hilirisasi (Tembaga/Emas)"
    },
    {
        "id": "PORT-DUMAI",
        "name": "Pelabuhan Dumai",
        "province": "Riau",
        "city": "Dumai",
        "lat": 1.68,
        "lng": 101.45,
        "export_value_million_usd": 9100.0,
        "export_volume_million_ton": 24.5,
        "primary_commodity": "Minyak Bumi Olahan, Fraksinasi Sawit & Biodiesel",
        "secondary_commodity": "Oleokimia",
        "dominant_destination": "India, Belanda (Rotterdam), Tiongkok, Pakistan",
        "vessel_capacity": "Liquid Bulk Tanker Anchorage",
        "category": "Curah Cair (Energi & Agroindustri)"
    },
    {
        "id": "PORT-AMAMAPARE",
        "name": "Pelabuhan Portsite Amamapare (PTFI)",
        "province": "Papua Tengah",
        "city": "Mimika",
        "lat": -4.84,
        "lng": 136.85,
        "export_value_million_usd": 8750.0,
        "export_volume_million_ton": 4.1,
        "primary_commodity": "Konsentrat Tembaga Basah, Emas & Perak",
        "secondary_commodity": "Slurry Concentrate",
        "dominant_destination": "Smelter Gresik (Domestik), Jepang, India, Jerman",
        "vessel_capacity": "Special Bulk Concentrate Carrier Terminal",
        "category": "Konsentrat Logam Mulia"
    },
    {
        "id": "PORT-BALIKPAPAN",
        "name": "Pelabuhan Balikpapan (Semayang & Kariangau)",
        "province": "Kalimantan Timur",
        "city": "Balikpapan",
        "lat": -1.27,
        "lng": 116.82,
        "export_value_million_usd": 7900.0,
        "export_volume_million_ton": 15.6,
        "primary_commodity": "Hasil Kilang Migas Pertamina RDMP & Batubara",
        "secondary_commodity": "Peralatan Penunjang Migas & IKN",
        "dominant_destination": "Singapura, Malaysia, Tiongkok, Australia",
        "vessel_capacity": "Oil Refinery Wharf & KIK Container Pier",
        "category": "Minyak Bumi & Manufaktur"
    },
    {
        "id": "PORT-TARAHAN",
        "name": "Pelabuhan Tarahan & Panjang",
        "province": "Lampung & Sumsel",
        "city": "Bandar Lampung / Tarahan",
        "lat": -5.52,
        "lng": 105.33,
        "export_value_million_usd": 6300.0,
        "export_volume_million_ton": 21.0,
        "primary_commodity": "Batubara Sumatera Selatan (Bukit Asam)",
        "secondary_commodity": "Kopi Olahan & CPO",
        "dominant_destination": "India, Bangladesh, Tiongkok, Thailand",
        "vessel_capacity": "Cape-size Mechanized Coal Terminal 210,000 DWT",
        "category": "Curah Kering (Energi)"
    },
    {
        "id": "PORT-KOLAKA-KONAWE",
        "name": "Pelabuhan Pomalaa & Morosi",
        "province": "Sulawesi Tenggara",
        "city": "Kolaka & Konawe",
        "lat": -4.18,
        "lng": 121.61,
        "export_value_million_usd": 5400.0,
        "export_volume_million_ton": 9.8,
        "primary_commodity": "Feronikel Antam Pomalaa & Nickel Pig Iron VDNI",
        "secondary_commodity": "Slag Nikel",
        "dominant_destination": "Tiongkok, Jepang, Korea Selatan",
        "vessel_capacity": "Dedicated Smelter Jetty",
        "category": "Logam Hilirisasi (Nikel)"
    },
    {
        "id": "PORT-BINTUNI",
        "name": "Terminal Khusus Tangguh LNG",
        "province": "Papua Barat",
        "city": "Teluk Bintuni",
        "lat": -2.43,
        "lng": 133.15,
        "export_value_million_usd": 4200.0,
        "export_volume_million_ton": 7.6,
        "primary_commodity": "Gas Alam Cair (Liquefied Natural Gas)",
        "secondary_commodity": "Kondensat Gas",
        "dominant_destination": "Jepang, Korea Selatan, Tiongkok, Meksiko",
        "vessel_capacity": "Cryogenic Membrane LNG Carrier Terminal",
        "category": "Curah Cair (Gas Alam)"
    },
    {
        "id": "PORT-BENETE",
        "name": "Pelabuhan Benete (Amman Mineral)",
        "province": "Nusa Tenggara Barat",
        "city": "Sumbawa Barat",
        "lat": -8.90,
        "lng": 116.74,
        "export_value_million_usd": 3600.0,
        "export_volume_million_ton": 3.2,
        "primary_commodity": "Konsentrat Tembaga & Emas Batu Hijau",
        "secondary_commodity": "Anoda Tembaga Olahan",
        "dominant_destination": "Jepang, Korea Selatan, India, Filipina",
        "vessel_capacity": "Dedicated Copper Concentrate Jetty",
        "category": "Konsentrat Logam Mulia"
    },
    {
        "id": "PORT-PANGKAL-BALAM",
        "name": "Pelabuhan Pangkal Balam & Muntok",
        "province": "Kepulauan Bangka Belitung",
        "city": "Pangkalpinang / Bangka Barat",
        "lat": -2.10,
        "lng": 106.15,
        "export_value_million_usd": 2850.0,
        "export_volume_million_ton": 0.85,
        "primary_commodity": "Balok Timah Murni 99.9% (Tin Ingot Banka Tin)",
        "secondary_commodity": "Pasir Silika & Kaolin",
        "dominant_destination": "Singapura, Belanda, Amerika Serikat, Jepang, India",
        "vessel_capacity": "General Cargo & Container Feeder",
        "category": "Logam Mulia & Timah"
    }
]

def export_raw_excels():
    # 1. pdrb_tambang_kab.xlsx
    wb1 = openpyxl.Workbook()
    ws1 = wb1.active
    ws1.title = "PDRB Tambang & Hilirisasi Daerah"
    
    headers1 = [
        "ID Wilayah", "Nama Daerah", "Tipe", "Provinsi",
        "PDRB Tambang (Triliun Rp)", "PDRB Manufaktur (Triliun Rp)", "Total PDRB (Triliun Rp)",
        "Porsi Tambang (%)", "Komoditas Unggulan", "Status Hilirisasi"
    ]
    ws1.append(headers1)
    
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="112233", end_color="112233", fill_type="solid")
    for col_num, cell in enumerate(ws1[1], 1):
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = Alignment(horizontal="center", vertical="center")
        
    for item in PDRB_KAB_DATA:
        ws1.append([
            item["id"],
            item["name"],
            item["region_type"],
            item["province"],
            item["pdrb_tambang_triliun"],
            item["pdrb_manufaktur_triliun"],
            item["total_pdrb_triliun"],
            item["mining_share_percent"],
            item["commodity"],
            item["hilirisasi_status"]
        ])
        r = ws1.max_row
        ws1.cell(row=r, column=5).number_format = "#,##0.00"
        ws1.cell(row=r, column=6).number_format = "#,##0.00"
        ws1.cell(row=r, column=7).number_format = "#,##0.00"
        ws1.cell(row=r, column=8).number_format = "0.00%"

    for col in ws1.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws1.column_dimensions[col_letter].width = max(max_len + 3, 12)

    path1 = os.path.join(RAW_DIR, "pdrb_tambang_kab.xlsx")
    wb1.save(path1)
    print(f"[OK] Raw Excel tersimpan: {path1}")

    # 2. koordinat_pelabuhan.xlsx
    wb2 = openpyxl.Workbook()
    ws2 = wb2.active
    ws2.title = "Pelabuhan Ekspor Utama"
    
    headers2 = [
        "ID Pelabuhan", "Nama Pelabuhan", "Provinsi", "Kota / Kabupaten",
        "Latitude", "Longitude", "Nilai Ekspor (Juta USD)", "Volume (Juta Ton)",
        "Komoditas Utama", "Kategori", "Tujuan Utama", "Kapasitas Dermaga"
    ]
    ws2.append(headers2)
    for col_num, cell in enumerate(ws2[1], 1):
        cell.font = header_font
        cell.fill = PatternFill(start_color="1B4965", end_color="1B4965", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        
    for p in PELABUHAN_NODES:
        ws2.append([
            p["id"],
            p["name"],
            p["province"],
            p["city"],
            p["lat"],
            p["lng"],
            p["export_value_million_usd"],
            p["export_volume_million_ton"],
            p["primary_commodity"],
            p["category"],
            p["dominant_destination"],
            p["vessel_capacity"]
        ])
        r = ws2.max_row
        ws2.cell(row=r, column=7).number_format = "$#,##0.0"
        ws2.cell(row=r, column=8).number_format = "#,##0.0"

    for col in ws2.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws2.column_dimensions[col_letter].width = max(max_len + 3, 12)

    path2 = os.path.join(RAW_DIR, "koordinat_pelabuhan.xlsx")
    wb2.save(path2)
    print(f"[OK] Raw Excel tersimpan: {path2}")

def export_processed_geojson():
    features = []
    for item in PDRB_KAB_DATA:
        # GeoJSON WGS84 standard format
        feature = {
            "type": "Feature",
            "id": item["id"],
            "properties": {
                "id": item["id"],
                "name": item["name"],
                "region_type": item["region_type"],
                "province": item["province"],
                "pdrb_tambang": item["pdrb_tambang_triliun"],
                "pdrb_manufaktur": item["pdrb_manufaktur_triliun"],
                "total_pdrb": item["total_pdrb_triliun"],
                "mining_share": item["mining_share_percent"],
                "commodity": item["commodity"],
                "hilirisasi": item["hilirisasi_status"],
                "center": item["center"],
                "color_rank": item["color_rank"]
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [item["coords"]]
            }
        }
        features.append(feature)

    geojson_obj = {
        "type": "FeatureCollection",
        "metadata": {
            "title": "Peta PDRB Sektor Pertambangan & Manufaktur Hilirisasi Indonesia",
            "source": "BPS & Kementerian ESDM RI",
            "unit": "Triliun Rupiah",
            "year": 2024
        },
        "features": features
    }

    geo_path = os.path.join(PROCESSED_DIR, "pdrb_tambang_geo.geojson")
    with open(geo_path, "w", encoding="utf-8") as f:
        json.dump(geojson_obj, f, indent=2, ensure_ascii=False)
    print(f"[OK] Processed GeoJSON tersimpan: {geo_path}")

def export_processed_pelabuhan_json():
    # Urutkan berdasarkan nilai ekspor terbesar
    sorted_nodes = sorted(PELABUHAN_NODES, key=lambda x: x["export_value_million_usd"], reverse=True)
    
    total_val = sum(x["export_value_million_usd"] for x in sorted_nodes)
    total_vol = sum(x["export_volume_million_ton"] for x in sorted_nodes)

    for rank, node in enumerate(sorted_nodes, 1):
        node["rank"] = rank
        node["share_percent"] = round((node["export_value_million_usd"] / total_val) * 100, 2)

    payload = {
        "metadata": {
            "title": "Simpul Pelabuhan Ekspor Utama Komoditas Tambang & Manufaktur Indonesia",
            "source": "Kementerian Perhubungan & Kemendag RI",
            "total_export_million_usd": round(total_val, 2),
            "total_volume_million_ton": round(total_vol, 2),
            "node_count": len(sorted_nodes)
        },
        "ports": sorted_nodes
    }

    pelabuhan_path = os.path.join(PROCESSED_DIR, "pelabuhan_node.json")
    with open(pelabuhan_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"[OK] Processed Pelabuhan JSON tersimpan: {pelabuhan_path}")

if __name__ == "__main__":
    export_raw_excels()
    export_processed_geojson()
    export_processed_pelabuhan_json()
    print("Script 02 selesai dengan sukses!")
