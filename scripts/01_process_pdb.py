#!/usr/bin/env python3
"""
Script 01: Preprocessing Struktur Produk Domestik Bruto (PDB) Indonesia
Menghasilkan struktur_pdb.xlsx (raw) dan struktur_pdb.json (processed)
Hierarki: Total PDB -> Sektor (Primer, Sekunder, Tersier) -> 17 Lapangan Usaha BPS
Satuan: Triliun Rupiah & Persentase
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

# Data Resmi PDB Atas Dasar Harga Berlaku (ADHB) BPS Indonesia (Total ~Rp 20.892,4 Triliun)
PDB_DATA = {
    "name": "Produk Domestik Bruto (PDB) Indonesia",
    "total_rupiah_triliun": 20892.4,
    "year": 2024,
    "source": "Badan Pusat Statistik (BPS) RI",
    "children": [
        {
            "name": "Sektor Primer",
            "code": "PRIMER",
            "description": "Sektor ekstraktif dan pemanfaatan langsung sumber daya alam",
            "children": [
                {
                    "name": "A. Pertanian, Kehutanan, & Perikanan",
                    "code": "A",
                    "value": 2611.55,
                    "share_percent": 12.50,
                    "growth_percent": 1.76,
                    "subsector": "Pertanian Tanaman Pangan, Perkebunan Sawit, Perikanan",
                    "color": "#2d8a4e"
                },
                {
                    "name": "B. Pertambangan & Penggalian",
                    "code": "B",
                    "value": 2193.70,
                    "share_percent": 10.50,
                    "growth_percent": 6.12,
                    "subsector": "Batubara, Bijih Logam (Nikel, Tembaga, Bauksit), Minyak & Gas Bumi",
                    "color": "#1f5f38"
                }
            ]
        },
        {
            "name": "Sektor Sekunder",
            "code": "SEKUNDER",
            "description": "Transformasi bahan mentah menjadi barang jadi, manufaktur & konstruksi",
            "children": [
                {
                    "name": "C. Industri Pengolahan (Manufaktur)",
                    "code": "C",
                    "value": 3906.88,
                    "share_percent": 18.70,
                    "growth_percent": 4.64,
                    "subsector": "Hilirisasi Logam Dasar, Makanan Minuman, Kimia & Farmasi, Alat Angkutan",
                    "color": "#2a6f97"
                },
                {
                    "name": "D. Pengadaan Listrik & Gas",
                    "code": "D",
                    "value": 229.82,
                    "share_percent": 1.10,
                    "growth_percent": 4.88,
                    "subsector": "Pembangkitan Listrik Tenaga Uap/Gas/EBT & Distribusi Gas",
                    "color": "#468faf"
                },
                {
                    "name": "E. Pengadaan Air & Pengelolaan Sampah",
                    "code": "E",
                    "value": 18.80,
                    "share_percent": 0.09,
                    "growth_percent": 3.92,
                    "subsector": "Treatment Air Bersih, Daur Ulang Logam & Plastik",
                    "color": "#61a5c2"
                },
                {
                    "name": "F. Konstruksi",
                    "code": "F",
                    "value": 2070.45,
                    "share_percent": 9.91,
                    "growth_percent": 6.15,
                    "subsector": "Infrastruktur Proyek Strategis Nasional, Smelter & Jalan Tol",
                    "color": "#89c2d9"
                }
            ]
        },
        {
            "name": "Sektor Tersier",
            "code": "TERSIER",
            "description": "Layanan jasa, logistik, perdagangan, teknologi, dan finansial",
            "children": [
                {
                    "name": "G. Perdagangan Besar & Eceran; Reparasi",
                    "code": "G",
                    "value": 2695.12,
                    "share_percent": 12.90,
                    "growth_percent": 4.85,
                    "subsector": "Perdagangan Ekspor-Impor, Grosir & Distribusi Ritel",
                    "color": "#d97706"
                },
                {
                    "name": "H. Transportasi & Pergudangan",
                    "code": "H",
                    "value": 1274.44,
                    "share_percent": 6.10,
                    "growth_percent": 13.96,
                    "subsector": "Angkutan Laut Komoditas, Terminal Curah, Logistik Peti Kemas",
                    "color": "#f59e0b"
                },
                {
                    "name": "I. Penyediaan Akomodasi & Makan Minum",
                    "code": "I",
                    "value": 585.00,
                    "share_percent": 2.80,
                    "growth_percent": 10.01,
                    "subsector": "Hotel, Restoran & Kawasan Industri Hospitality",
                    "color": "#fbbf24"
                },
                {
                    "name": "J. Informasi & Komunikasi",
                    "code": "J",
                    "value": 877.48,
                    "share_percent": 4.20,
                    "growth_percent": 7.59,
                    "subsector": "Telekomunikasi Seluler, Pusat Data, Software Industri",
                    "color": "#fcd34d"
                },
                {
                    "name": "K. Jasa Keuangan & Asuransi",
                    "code": "K",
                    "value": 856.59,
                    "share_percent": 4.10,
                    "growth_percent": 5.11,
                    "subsector": "Perbankan Korporasi, Sindikasi Pembiayaan Tambang",
                    "color": "#9333ea"
                },
                {
                    "name": "L. Real Estat",
                    "code": "L",
                    "value": 543.20,
                    "share_percent": 2.60,
                    "growth_percent": 1.83,
                    "subsector": "Kawasan Industri, Perumahan Pekerja Industri",
                    "color": "#a855f7"
                },
                {
                    "name": "M,N. Jasa Perusahaan",
                    "code": "M,N",
                    "value": 376.06,
                    "share_percent": 1.80,
                    "growth_percent": 8.12,
                    "subsector": "Surveyor Tambang, Konsultan Geologi & Rekayasa Teknik",
                    "color": "#c084fc"
                },
                {
                    "name": "O. Administrasi Pemerintahan & Pertahanan",
                    "code": "O",
                    "value": 626.77,
                    "share_percent": 3.00,
                    "growth_percent": 2.45,
                    "subsector": "Regulasi Mineral Batubara, Perizinan OSS, PNBP Tambang",
                    "color": "#64748b"
                },
                {
                    "name": "P. Jasa Pendidikan",
                    "code": "P",
                    "value": 647.66,
                    "share_percent": 3.10,
                    "growth_percent": 3.20,
                    "subsector": "Politeknik Manufaktur, Vokasi Industri Tambang",
                    "color": "#94a3b8"
                },
                {
                    "name": "Q. Jasa Kesehatan & Kegiatan Sosial",
                    "code": "Q",
                    "value": 271.60,
                    "share_percent": 1.30,
                    "growth_percent": 5.80,
                    "subsector": "Fasilitas Kesehatan Kawasan Industri & BPJS Ketenagakerjaan",
                    "color": "#cbd5e1"
                },
                {
                    "name": "R,S,T,U. Jasa Lainnya",
                    "code": "R,S,T,U",
                    "value": 727.26,
                    "share_percent": 3.48,
                    "growth_percent": 8.75,
                    "subsector": "Aktivitas Organisasi, Reparasi Mesin, Jasa Personel",
                    "color": "#e2e8f0"
                }
            ]
        }
    ]
}

def export_raw_excel():
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Struktur PDB Indonesia"

    headers = ["Kategori", "Kode BPS", "Nama Lapangan Usaha", "Nilai (Triliun Rupiah)", "Pangsa Pasar (%)", "Pertumbuhan (%)", "Subsektor Utama"]
    ws.append(headers)

    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")
    header_fill = PatternFill(start_color="1B365D", end_color="1B365D", fill_type="solid")
    center_align = Alignment(horizontal="center", vertical="center")
    
    for col_num, cell in enumerate(ws[1], 1):
        cell.font = header_font
        cell.fill = header_fill
        cell.alignment = center_align

    thin_border = Border(
        left=Side(style="thin", color="CCCCCC"),
        right=Side(style="thin", color="CCCCCC"),
        top=Side(style="thin", color="CCCCCC"),
        bottom=Side(style="thin", color="CCCCCC")
    )

    for cat in PDB_DATA["children"]:
        for item in cat["children"]:
            ws.append([
                cat["name"],
                item["code"],
                item["name"],
                item["value"],
                item["share_percent"],
                item["growth_percent"],
                item["subsector"]
            ])
            row = ws.max_row
            for cell in ws[row]:
                cell.border = thin_border
            ws.cell(row=row, column=4).number_format = "#,##0.00"
            ws.cell(row=row, column=5).number_format = "0.00%"
            ws.cell(row=row, column=6).number_format = "0.00%"

    for col in ws.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = openpyxl.utils.get_column_letter(col[0].column)
        ws.column_dimensions[col_letter].width = max(max_len + 3, 12)

    raw_path = os.path.join(RAW_DIR, "struktur_pdb.xlsx")
    wb.save(raw_path)
    print(f"[OK] Raw Excel tersimpan: {raw_path}")

def export_processed_json():
    # Hitung total agregat untuk setiap sektor tingkat 1
    for sector in PDB_DATA["children"]:
        sec_total = sum(child["value"] for child in sector["children"])
        sector["value"] = round(sec_total, 2)
        sector["share_percent"] = round((sec_total / PDB_DATA["total_rupiah_triliun"]) * 100, 2)

    processed_path = os.path.join(PROCESSED_DIR, "struktur_pdb.json")
    with open(processed_path, "w", encoding="utf-8") as f:
        json.dump(PDB_DATA, f, indent=2, ensure_ascii=False)
    print(f"[OK] Processed JSON tersimpan: {processed_path}")

if __name__ == "__main__":
    export_raw_excel()
    export_processed_json()
    print("Script 01 selesai dengan sukses!")
