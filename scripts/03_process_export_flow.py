#!/usr/bin/env python3
"""
Script 03: Preprocessing Rantai Pasok Ekspor & Aliran Perdagangan Global
Menghasilkan:
- data/raw/ekspor_tambang.xlsx
- data/raw/koordinat_negara.xlsx
- data/processed/ekspor_flow.json (Struktur gabungan untuk Sunburst, Sankey, & Global Flow Map)
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

# 1. Koordinat Negara Mitra Dagang Utama Global
COUNTRY_COORDS = {
    "Tiongkok": {
        "iso": "CHN",
        "continent": "Asia Timur",
        "hub": "Pelabuhan Shanghai / Ningbo-Zhoushan",
        "lat": 31.23,
        "lng": 121.47,
        "flag": "🇨🇳"
    },
    "Jepang": {
        "iso": "JPN",
        "continent": "Asia Timur",
        "hub": "Pelabuhan Yokohama / Chiba",
        "lat": 35.44,
        "lng": 139.64,
        "flag": "🇯🇵"
    },
    "Korea Selatan": {
        "iso": "KOR",
        "continent": "Asia Timur",
        "hub": "Pelabuhan Busan / Gwangyang",
        "lat": 35.10,
        "lng": 129.04,
        "flag": "🇰🇷"
    },
    "Taiwan": {
        "iso": "TWN",
        "continent": "Asia Timur",
        "hub": "Pelabuhan Kaohsiung",
        "lat": 22.61,
        "lng": 120.30,
        "flag": "🇹🇼"
    },
    "India": {
        "iso": "IND",
        "continent": "Asia Selatan",
        "hub": "Pelabuhan Mundra / JNPT Mumbai",
        "lat": 18.95,
        "lng": 72.95,
        "flag": "🇮🇳"
    },
    "Bangladesh": {
        "iso": "BGD",
        "continent": "Asia Selatan",
        "hub": "Pelabuhan Chittagong",
        "lat": 22.33,
        "lng": 91.80,
        "flag": "🇧🇩"
    },
    "Filipina": {
        "iso": "PHL",
        "continent": "ASEAN",
        "hub": "Pelabuhan Manila / Batangas",
        "lat": 14.58,
        "lng": 120.97,
        "flag": "🇵🇭"
    },
    "Malaysia": {
        "iso": "MYS",
        "continent": "ASEAN",
        "hub": "Pelabuhan Port Klang / Tanjung Pelepas",
        "lat": 2.99,
        "lng": 101.39,
        "flag": "🇲🇾"
    },
    "Singapura": {
        "iso": "SGP",
        "continent": "ASEAN",
        "hub": "Pelabuhan Jurong / PSA Singapore",
        "lat": 1.28,
        "lng": 103.85,
        "flag": "🇸🇬"
    },
    "Vietnam": {
        "iso": "VNM",
        "continent": "ASEAN",
        "hub": "Pelabuhan Hai Phong / Cai Mep",
        "lat": 10.53,
        "lng": 107.03,
        "flag": "🇻🇳"
    },
    "Belanda": {
        "iso": "NLD",
        "continent": "Eropa",
        "hub": "Pelabuhan Rotterdam (Gerbang Utama Eropa)",
        "lat": 51.92,
        "lng": 4.47,
        "flag": "🇳🇱"
    },
    "Jerman": {
        "iso": "DEU",
        "continent": "Eropa",
        "hub": "Pelabuhan Hamburg",
        "lat": 53.54,
        "lng": 9.99,
        "flag": "🇩🇪"
    },
    "Italia": {
        "iso": "ITA",
        "continent": "Eropa",
        "hub": "Pelabuhan Genoa / Trieste",
        "lat": 44.40,
        "lng": 8.93,
        "flag": "🇮🇹"
    },
    "Spanyol": {
        "iso": "ESP",
        "continent": "Eropa",
        "hub": "Pelabuhan Valencia / Algeciras",
        "lat": 39.46,
        "lng": -0.37,
        "flag": "🇪🇸"
    },
    "Amerika Serikat": {
        "iso": "USA",
        "continent": "Amerika",
        "hub": "Pelabuhan Los Angeles / Long Beach",
        "lat": 33.74,
        "lng": -118.26,
        "flag": "🇺🇸"
    },
    "Meksiko": {
        "iso": "MEX",
        "continent": "Amerika",
        "hub": "Pelabuhan Manzanillo",
        "lat": 19.05,
        "lng": -104.31,
        "flag": "🇲🇽"
    },
    "Australia": {
        "iso": "AUS",
        "continent": "Oseania",
        "hub": "Pelabuhan Port Hedland / Melbourne",
        "lat": -37.81,
        "lng": 144.96,
        "flag": "🇦🇺"
    }
}

# 2. Koordinat Pelabuhan Ekspor Asal (Indonesia)
ORIGIN_PORTS = {
    "Pelabuhan Muara Berau": {"city": "Kaltim", "lat": -0.58, "lng": 117.25},
    "Pelabuhan IMIP Bahodopi": {"city": "Morowali", "lat": -2.81, "lng": 122.15},
    "Pelabuhan Tanjung Priok": {"city": "Jakarta", "lat": -6.10, "lng": 106.88},
    "Pelabuhan IWIP Weda Bay": {"city": "Malut", "lat": 0.48, "lng": 127.97},
    "Pelabuhan Gresik & Perak": {"city": "Jatim", "lat": -7.19, "lng": 112.73},
    "Pelabuhan Dumai": {"city": "Riau", "lat": 1.68, "lng": 101.45},
    "Pelabuhan Amamapare": {"city": "Papua", "lat": -4.84, "lng": 136.85},
    "Pelabuhan Balikpapan": {"city": "Kaltim", "lat": -1.27, "lng": 116.82},
    "Pelabuhan Tarahan": {"city": "Lampung", "lat": -5.52, "lng": 105.33},
    "Pelabuhan Pomalaa & Morosi": {"city": "Sultra", "lat": -4.18, "lng": 121.61},
    "Pelabuhan Tangguh Bintuni": {"city": "Papua Barat", "lat": -2.43, "lng": 133.15},
    "Pelabuhan Benete Sumbawa": {"city": "NTB", "lat": -8.90, "lng": 116.74},
    "Pelabuhan Pangkal Balam": {"city": "Babel", "lat": -2.10, "lng": 106.15}
}

# 3. Transaksi Rantai Pasok Ekspor (Aliran Pelabuhan -> Negara)
# Satuan: Juta USD ($ M) dan Volume Juta Ton
FLOW_RECORDS = [
    # Dari Pelabuhan Muara Berau (Batubara)
    {"source": "Pelabuhan Muara Berau", "target": "Tiongkok", "commodity": "Batubara Termal", "value_m_usd": 7800.0, "volume_m_ton": 35.2},
    {"source": "Pelabuhan Muara Berau", "target": "India", "commodity": "Batubara Termal & Kokas", "value_m_usd": 5400.0, "volume_m_ton": 24.8},
    {"source": "Pelabuhan Muara Berau", "target": "Filipina", "commodity": "Batubara Pembangkit Listrik", "value_m_usd": 2800.0, "volume_m_ton": 12.5},
    {"source": "Pelabuhan Muara Berau", "target": "Vietnam", "commodity": "Batubara Industri", "value_m_usd": 2450.0, "volume_m_ton": 10.0},

    # Dari Pelabuhan IMIP Bahodopi (Nikel & Stainless Steel)
    {"source": "Pelabuhan IMIP Bahodopi", "target": "Tiongkok", "commodity": "Baja Nirkarat & Ferronickel", "value_m_usd": 8500.0, "volume_m_ton": 13.5},
    {"source": "Pelabuhan IMIP Bahodopi", "target": "Korea Selatan", "commodity": "Prekursor Baterai & NPI", "value_m_usd": 2900.0, "volume_m_ton": 4.6},
    {"source": "Pelabuhan IMIP Bahodopi", "target": "Taiwan", "commodity": "Stainless Steel Coil", "value_m_usd": 1500.0, "volume_m_ton": 2.4},
    {"source": "Pelabuhan IMIP Bahodopi", "target": "India", "commodity": "Baja Nirkarat Manufaktur", "value_m_usd": 1300.0, "volume_m_ton": 1.9},

    # Dari Pelabuhan IWIP Weda Bay (Nikel & Prekursor Baterai EV)
    {"source": "Pelabuhan IWIP Weda Bay", "target": "Tiongkok", "commodity": "MHP & Nickel Sulfate EV", "value_m_usd": 7200.0, "volume_m_ton": 11.2},
    {"source": "Pelabuhan IWIP Weda Bay", "target": "Korea Selatan", "commodity": "MHP untuk Katoda Baterai", "value_m_usd": 2800.0, "volume_m_ton": 4.3},
    {"source": "Pelabuhan IWIP Weda Bay", "target": "Amerika Serikat", "commodity": "Nikel Sulfat Baterai EV", "value_m_usd": 1800.0, "volume_m_ton": 2.7},

    # Dari Pelabuhan Gresik & Perak (Katoda Tembaga, Emas, Petrokimia)
    {"source": "Pelabuhan Gresik & Perak", "target": "Jepang", "commodity": "Katoda Tembaga Murni 99.99%", "value_m_usd": 4200.0, "volume_m_ton": 6.5},
    {"source": "Pelabuhan Gresik & Perak", "target": "Korea Selatan", "commodity": "Katoda Tembaga & Petrokimia", "value_m_usd": 2100.0, "volume_m_ton": 3.2},
    {"source": "Pelabuhan Gresik & Perak", "target": "India", "commodity": "Kawat Tembaga & Kimia Industri", "value_m_usd": 3100.0, "volume_m_ton": 4.8},
    {"source": "Pelabuhan Gresik & Perak", "target": "Amerika Serikat", "commodity": "Tembaga Murni & Komponen Listrik", "value_m_usd": 2300.0, "volume_m_ton": 3.5},
    {"source": "Pelabuhan Gresik & Perak", "target": "Malaysia", "commodity": "Petrokimia & Polimer", "value_m_usd": 1200.0, "volume_m_ton": 1.8},

    # Dari Pelabuhan Tanjung Priok (Manufaktur Otomotif, Mesin & Logam Presisi)
    {"source": "Pelabuhan Tanjung Priok", "target": "Amerika Serikat", "commodity": "Manufaktur Kendaraan & Mesin", "value_m_usd": 3000.0, "volume_m_ton": 5.2},
    {"source": "Pelabuhan Tanjung Priok", "target": "Jepang", "commodity": "Komponen Otomotif & Logam", "value_m_usd": 3800.0, "volume_m_ton": 6.7},
    {"source": "Pelabuhan Tanjung Priok", "target": "Belanda", "commodity": "Produk Manufaktur & Tekstil", "value_m_usd": 2200.0, "volume_m_ton": 3.8},
    {"source": "Pelabuhan Tanjung Priok", "target": "Jerman", "commodity": "Komponen Elektronik & Mesin", "value_m_usd": 2100.0, "volume_m_ton": 3.6},
    {"source": "Pelabuhan Tanjung Priok", "target": "Filipina", "commodity": "Kendaraan Bermotor CBU", "value_m_usd": 2000.0, "volume_m_ton": 3.5},
    {"source": "Pelabuhan Tanjung Priok", "target": "Singapura", "commodity": "Peti Kemas & Mesin Presisi", "value_m_usd": 2100.0, "volume_m_ton": 3.7},
    {"source": "Pelabuhan Tanjung Priok", "target": "Australia", "commodity": "Kendaraan Bermotor & Mesin", "value_m_usd": 1300.0, "volume_m_ton": 2.1},

    # Dari Pelabuhan Dumai (Minyak Bumi & Fraksinasi Sawit)
    {"source": "Pelabuhan Dumai", "target": "India", "commodity": "Minyak Nabati Industri & CPO", "value_m_usd": 4100.0, "volume_m_ton": 11.2},
    {"source": "Pelabuhan Dumai", "target": "Belanda", "commodity": "Biodiesel & Oleokimia", "value_m_usd": 2300.0, "volume_m_ton": 6.1},
    {"source": "Pelabuhan Dumai", "target": "Tiongkok", "commodity": "Fraksinasi Sawit & Bioenergi", "value_m_usd": 1800.0, "volume_m_ton": 4.9},
    {"source": "Pelabuhan Dumai", "target": "Spanyol", "commodity": "Biodiesel Mandatori", "value_m_usd": 900.0, "volume_m_ton": 2.3},

    # Dari Pelabuhan Amamapare (Konsentrat Tembaga & Emas)
    {"source": "Pelabuhan Amamapare", "target": "Jepang", "commodity": "Konsentrat Tembaga Smelter", "value_m_usd": 3200.0, "volume_m_ton": 1.5},
    {"source": "Pelabuhan Amamapare", "target": "India", "commodity": "Konsentrat Tembaga & Emas", "value_m_usd": 2300.0, "volume_m_ton": 1.1},
    {"source": "Pelabuhan Amamapare", "target": "Jerman", "commodity": "Konsentrat Logam Mulia (Aurubis)", "value_m_usd": 1100.0, "volume_m_ton": 0.5},
    {"source": "Pelabuhan Amamapare", "target": "Spanyol", "commodity": "Konsentrat Tembaga Huelva", "value_m_usd": 600.0, "volume_m_ton": 0.3},
    {"source": "Pelabuhan Amamapare", "target": "Tiongkok", "commodity": "Konsentrat Tembaga Industri", "value_m_usd": 1550.0, "volume_m_ton": 0.7},

    # Dari Pelabuhan Balikpapan (Minyak Bumi & Manufaktur)
    {"source": "Pelabuhan Balikpapan", "target": "Singapura", "commodity": "Bahan Bakar & Hasil Kilang RDMP", "value_m_usd": 1850.0, "volume_m_ton": 3.7},
    {"source": "Pelabuhan Balikpapan", "target": "Malaysia", "commodity": "Minyak Olahan & Petrokimia", "value_m_usd": 1500.0, "volume_m_ton": 3.0},
    {"source": "Pelabuhan Balikpapan", "target": "Tiongkok", "commodity": "Kondensat & Batubara Kalsel", "value_m_usd": 2350.0, "volume_m_ton": 4.7},
    {"source": "Pelabuhan Balikpapan", "target": "Australia", "commodity": "Produk Energi & Minyak", "value_m_usd": 2200.0, "volume_m_ton": 4.2},

    # Dari Pelabuhan Tarahan (Batubara Sumsel)
    {"source": "Pelabuhan Tarahan", "target": "India", "commodity": "Batubara Kalori Sedang", "value_m_usd": 2300.0, "volume_m_ton": 7.7},
    {"source": "Pelabuhan Tarahan", "target": "Bangladesh", "commodity": "Batubara Pembangkit Listrik", "value_m_usd": 2400.0, "volume_m_ton": 8.0},
    {"source": "Pelabuhan Tarahan", "target": "Tiongkok", "commodity": "Batubara Industri Semen", "value_m_usd": 1600.0, "volume_m_ton": 5.3},

    # Dari Pelabuhan Pomalaa & Morosi (Nikel Sultra)
    {"source": "Pelabuhan Pomalaa & Morosi", "target": "Tiongkok", "commodity": "Ferronickel & Nickel Pig Iron", "value_m_usd": 3800.0, "volume_m_ton": 6.9},
    {"source": "Pelabuhan Pomalaa & Morosi", "target": "Jepang", "commodity": "Ferronickel Kualitas Tinggi", "value_m_usd": 1200.0, "volume_m_ton": 2.2},
    {"source": "Pelabuhan Pomalaa & Morosi", "target": "Taiwan", "commodity": "NPI Pabrik Baja", "value_m_usd": 400.0, "volume_m_ton": 0.7},

    # Dari Pelabuhan Tangguh Bintuni (LNG)
    {"source": "Pelabuhan Tangguh Bintuni", "target": "Korea Selatan", "commodity": "Gas Alam Cair (LNG KOGAS/POSCO)", "value_m_usd": 1600.0, "volume_m_ton": 2.9},
    {"source": "Pelabuhan Tangguh Bintuni", "target": "Jepang", "commodity": "LNG Utilitas Listrik & Gas", "value_m_usd": 1400.0, "volume_m_ton": 2.5},
    {"source": "Pelabuhan Tangguh Bintuni", "target": "Meksiko", "commodity": "LNG Terminal Manzanillo CFE", "value_m_usd": 1200.0, "volume_m_ton": 2.2},

    # Dari Pelabuhan Benete Sumbawa (Konsentrat Tembaga)
    {"source": "Pelabuhan Benete Sumbawa", "target": "Jepang", "commodity": "Konsentrat Tembaga Batu Hijau", "value_m_usd": 1600.0, "volume_m_ton": 1.4},
    {"source": "Pelabuhan Benete Sumbawa", "target": "Korea Selatan", "commodity": "Konsentrat Tembaga Onsan Smelter", "value_m_usd": 1300.0, "volume_m_ton": 1.2},
    {"source": "Pelabuhan Benete Sumbawa", "target": "Taiwan", "commodity": "Anoda Tembaga", "value_m_usd": 700.0, "volume_m_ton": 0.6},

    # Dari Pelabuhan Pangkal Balam (Balok Timah Murni)
    {"source": "Pelabuhan Pangkal Balam", "target": "Singapura", "commodity": "Tin Ingot 99.9% (Gudang LME)", "value_m_usd": 1100.0, "volume_m_ton": 0.33},
    {"source": "Pelabuhan Pangkal Balam", "target": "India", "commodity": "Timah Solder Elektronik", "value_m_usd": 650.0, "volume_m_ton": 0.20},
    {"source": "Pelabuhan Pangkal Balam", "target": "Korea Selatan", "commodity": "Timah Komponen Semikonduktor", "value_m_usd": 600.0, "volume_m_ton": 0.18},
    {"source": "Pelabuhan Pangkal Balam", "target": "Italia", "commodity": "Timah Bahan Kimia & Paduan", "value_m_usd": 500.0, "volume_m_ton": 0.14}
]

def export_raw_excels():
    # 1. koordinat_negara.xlsx
    wb1 = openpyxl.Workbook()
    ws1 = wb1.active
    ws1.title = "Mitra Dagang Global"
    
    headers1 = ["Nama Negara", "Kode ISO", "Benua", "Hub Pelabuhan Utama", "Latitude", "Longitude", "Bendera"]
    ws1.append(headers1)
    
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    for col_num, cell in enumerate(ws1[1], 1):
        cell.font = header_font
        cell.fill = PatternFill(start_color="0A3641", end_color="0A3641", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        
    for name, info in COUNTRY_COORDS.items():
        ws1.append([name, info["iso"], info["continent"], info["hub"], info["lat"], info["lng"], info["flag"]])
        
    for col in ws1.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws1.column_dimensions[col_letter].width = max(max_len + 3, 12)
        
    path1 = os.path.join(RAW_DIR, "koordinat_negara.xlsx")
    wb1.save(path1)
    print(f"[OK] Raw Excel tersimpan: {path1}")

    # 2. ekspor_tambang.xlsx
    wb2 = openpyxl.Workbook()
    ws2 = wb2.active
    ws2.title = "Aliran Ekspor Tambang & Logam"
    
    headers2 = ["Pelabuhan Asal", "Negara Tujuan", "Benua", "Komoditas", "Nilai Ekspor (Juta USD)", "Volume (Juta Ton)"]
    ws2.append(headers2)
    for col_num, cell in enumerate(ws2[1], 1):
        cell.font = header_font
        cell.fill = PatternFill(start_color="1E3D59", end_color="1E3D59", fill_type="solid")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        
    for f in FLOW_RECORDS:
        dest_country = f["target"]
        continent = COUNTRY_COORDS.get(dest_country, {}).get("continent", "Lainnya")
        ws2.append([
            f["source"],
            dest_country,
            continent,
            f["commodity"],
            f["value_m_usd"],
            f["volume_m_ton"]
        ])
        r = ws2.max_row
        ws2.cell(row=r, column=5).number_format = "$#,##0.0"
        ws2.cell(row=r, column=6).number_format = "#,##0.0"

    for col in ws2.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws2.column_dimensions[col_letter].width = max(max_len + 3, 12)

    path2 = os.path.join(RAW_DIR, "ekspor_tambang.xlsx")
    wb2.save(path2)
    print(f"[OK] Raw Excel tersimpan: {path2}")

def export_processed_flow_json():
    # 1. Agregasi untuk Sunburst (Hierarki: Total Ekspor -> Benua -> Negara)
    total_val = sum(item["value_m_usd"] for item in FLOW_RECORDS)
    
    continent_map = {}
    for item in FLOW_RECORDS:
        country = item["target"]
        val = item["value_m_usd"]
        c_info = COUNTRY_COORDS[country]
        continent = c_info["continent"]
        
        if continent not in continent_map:
            continent_map[continent] = {
                "name": continent,
                "countries": {},
                "total": 0.0
            }
        continent_map[continent]["total"] += val
        
        if country not in continent_map[continent]["countries"]:
            continent_map[continent]["countries"][country] = {
                "name": country,
                "value": 0.0,
                "flag": c_info["flag"],
                "commodities": set()
            }
        continent_map[continent]["countries"][country]["value"] += val
        continent_map[continent]["countries"][country]["commodities"].add(item["commodity"].split()[0])

    sunburst_children = []
    # Palet warna benua color-blind friendly (Viridis / Muted categorical)
    continent_colors = {
        "Asia Timur": "#3b82f6",   # Royal Blue
        "Asia Selatan": "#10b981", # Emerald
        "ASEAN": "#f59e0b",        # Amber Gold
        "Eropa": "#8b5cf6",        # Purple
        "Amerika": "#ef4444",      # Crimson / Rose
        "Oseania": "#06b6d4"       # Cyan
    }

    for cont_name, cont_data in sorted(continent_map.items(), key=lambda x: x[1]["total"], reverse=True):
        country_nodes = []
        for c_name, c_data in sorted(cont_data["countries"].items(), key=lambda x: x[1]["value"], reverse=True):
            country_nodes.append({
                "name": f"{c_data['flag']} {c_name}",
                "country_raw": c_name,
                "value": round(c_data["value"], 2),
                "commodities": list(c_data["commodities"]),
                "share_in_continent": round((c_data["value"] / cont_data["total"]) * 100, 2),
                "share_in_total": round((c_data["value"] / total_val) * 100, 2)
            })
            
        sunburst_children.append({
            "name": cont_name,
            "value": round(cont_data["total"], 2),
            "share_percent": round((cont_data["total"] / total_val) * 100, 2),
            "itemStyle": {"color": continent_colors.get(cont_name, "#94a3b8")},
            "children": country_nodes
        })

    sunburst_data = {
        "name": "Total Ekspor Hilirisasi",
        "value": round(total_val, 2),
        "children": sunburst_children
    }

    # 2. Agregasi untuk Sankey Diagram (Nodes & Links)
    sankey_nodes = []
    node_set = set()
    
    # Kumpulkan node sumber (pelabuhan)
    for p_name in ORIGIN_PORTS.keys():
        if p_name not in node_set:
            node_set.add(p_name)
            sankey_nodes.append({
                "name": p_name,
                "category": "Pelabuhan Indonesia",
                "itemStyle": {"color": "#10b981"}
            })

    # Kumpulkan node target (negara)
    for c_name, c_info in COUNTRY_COORDS.items():
        if c_name not in node_set:
            node_set.add(c_name)
            sankey_nodes.append({
                "name": c_name,
                "category": f"Negara Mitra ({c_info['continent']})",
                "itemStyle": {"color": continent_colors.get(c_info['continent'], "#38bdf8")}
            })

    sankey_links = []
    for f in FLOW_RECORDS:
        sankey_links.append({
            "source": f["source"],
            "target": f["target"],
            "value": round(f["value_m_usd"], 2),
            "volume_m_ton": round(f["volume_m_ton"], 2),
            "commodity": f["commodity"]
        })

    # 3. Data untuk Global Flow Map (Arcs with Animated Lines)
    flow_map_routes = []
    for f in FLOW_RECORDS:
        src = ORIGIN_PORTS[f["source"]]
        tgt = COUNTRY_COORDS[f["target"]]
        flow_map_routes.append({
            "fromName": f["source"],
            "toName": f["target"],
            "coords": [[src["lng"], src["lat"]], [tgt["lng"], tgt["lat"]]],
            "value": round(f["value_m_usd"], 2),
            "volume": round(f["volume_m_ton"], 2),
            "commodity": f["commodity"],
            "continent": tgt["continent"]
        })

    # Payload Lengkap
    payload = {
        "metadata": {
            "title": "Arsitektur Rantai Pasok Ekspor Tambang & Manufaktur Indonesia ke Pasar Global",
            "total_value_million_usd": round(total_val, 2),
            "total_value_billion_usd": round(total_val / 1000, 2),
            "total_transactions": len(FLOW_RECORDS),
            "partner_countries_count": len(COUNTRY_COORDS),
            "export_ports_count": len(ORIGIN_PORTS)
        },
        "sunburst": sunburst_data,
        "sankey": {
            "nodes": sankey_nodes,
            "links": sankey_links
        },
        "flow_map": {
            "origin_ports": ORIGIN_PORTS,
            "destinations": COUNTRY_COORDS,
            "routes": flow_map_routes
        }
    }

    processed_path = os.path.join(PROCESSED_DIR, "ekspor_flow.json")
    with open(processed_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2, ensure_ascii=False)
    print(f"[OK] Processed Flow JSON tersimpan: {processed_path}")

if __name__ == "__main__":
    export_raw_excels()
    export_processed_flow_json()
    print("Script 03 selesai dengan sukses!")
