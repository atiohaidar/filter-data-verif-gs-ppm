# 🎓 Dashboard Verifikasi Publikasi Dosen

> **Sistem filter dan verifikasi data publikasi dosen yang user-friendly, diproses langsung di browser tanpa upload ke server!**

[![Demo](https://img.shields.io/badge/🌐_Live_Demo-atiohaidar.github.io-blue?style=for-the-badge)](https://atiohaidar.github.io/filter-data-verif-gs-ppm/)
[![Local](https://img.shields.io/badge/🖥️_Local-CSV_Processing-green?style=for-the-badge)](#)
[![Security](https://img.shields.io/badge/🔒_Privacy-100%25_Secure-orange?style=for-the-badge)](#)

---

## 🚀 Apa itu Dashboard Verifikasi Publikasi?

Dashboard ini adalah **aplikasi web interaktif** yang membantu institusi pendidikan, terutama **Tim PPM (Penelitian dan Pengabdian Masyarakat)**, untuk:

- ✅ **Memverifikasi** data publikasi dosen secara efisien
- 🔍 **Mendeteksi masalah** dalam data publikasi secara otomatis  
- 📊 **Menganalisis statistik** publikasi dengan visual yang menarik
- 🎯 **Memfilter data** berdasarkan berbagai kriteria
- 📈 **Mengekspor hasil** verifikasi ke format CSV


### 🔍 **Deteksi Masalah Otomatis**
Dashboard secara otomatis mendeteksi **14+ jenis masalah** dalam data publikasi:

| Kategori | Jenis Masalah | Contoh |
|----------|---------------|---------|
| **🔗 Link Issues** | Link tidak valid | `http://example` (bukan https) |
| | PDF links | Link langsung ke file PDF |
| | Link download | Link menuju halaman download |
| **🏛️ Platform Issues** | ResearchGate | Link ke ResearchGate |
| | Semantic Scholar | Link ke Semantic Scholar |
| | Garuda Kemdikbud | Link ke portal Garuda |
| **📚 Repository Issues** | EBSCOhost | Database EBSCOhost |
| | Link Library | Link ke perpustakaan |
| **📖 Publication Type** | AIP Proceedings | Publikasi proceedings AIP |
| | IOS Book Chapter | Chapter dalam buku IOS |
| **✅ Data Consistency** | Valid tapi Tipe None | Artikel valid tanpa kategori |
| | Inkonsistensi Jurnal | Jurnal sama, tipe berbeda |

### 📊 **Statistik & Analisis Mendalam**

#### 📈 **6 Jenis Statistik Interaktif**
1. **Status Verifikasi** - Berapa yang sudah/belum diverifikasi
2. **Validitas Artikel** - Distribusi artikel valid/tidak valid  
3. **Tipe Publikasi** - Breakdown jenis publikasi
4. **Potensi Masalah** - Statistik masalah yang terdeteksi
5. **Domain Link** - Analisis domain website publikasi
6. **Nama Jurnal** - Analisis distribusi jurnal & konsistensi

#### 🎯 **Filter Interaktif dengan Chips**
- **Klik statistik** untuk langsung filter data
- **Visual chips** menunjukkan filter aktif
- **Toggle on/off** filter dengan mudah
- **Kombinasi multiple filter** untuk analisis mendalam

### 🛠️ **Tools Produktivitas**

#### 📋 **Copy & Export Fleksibel**
- **Copy halaman ini** - Salin data yang terlihat
- **Copy semua hasil** - Salin seluruh hasil filter
- **Export CSV filter** - Download hasil filter
- **Export status verifikasi** - Download status verifikasi

#### 🔄 **Import/Export Status**
- **Simpan progress** verifikasi ke file CSV
- **Import status** verifikasi dari file sebelumnya
- **Backup & restore** pekerjaan verifikasi

---

## 🎬 Cara Menggunakan (Super Mudah!)

### 📁 **Step 1: Siapkan File CSV**
Pastikan CSV Anda memiliki kolom-kolom ini:
```
ID, Judul Artikel, Penulis, Penulis Internal, Tipe Publikasi, 
Nama Jurnal/Conference, Tahun Publikasi, Tautan Publikasi, Validitas Artikel
```

### 🖱️ **Step 2: Upload Data**
1. **Buka dashboard** di browser
2. **Drag & drop** file CSV ke area upload, atau
3. **Klik area upload** untuk pilih file

### ⚙️ **Step 3: Konfigurasi Filter**
1. **Pilih sumber nama** - Penulis Internal / Semua Penulis
2. **Set filter cepat** - Judul, Tipe, Dosen
3. **Toggle otomatis** - Filter realtime saat mengetik

### 🔍 **Step 4: Analisis & Verifikasi**
1. **Lihat statistik** - 6 tabel analisis otomatis
2. **Klik statistik** untuk filter data
3. **Centang checkbox** untuk tandai verifikasi
4. **Review masalah** di kolom "Potensi Masalah"

### 💾 **Step 5: Export Hasil**
1. **Export CSV** - Hasil filter lengkap
2. **Export Status** - Progress verifikasi
3. **Copy data** - Untuk paste ke Excel/Sheets

---
## 🚦 Quick Start Guide

### 🌐 **Option 1: Online (Recommended)**
```bash
# Langsung buka di browser:
https://atiohaidar.github.io/filter-data-verif-gs-ppm/
```

### 💻 **Option 2: Local Development**
```bash
# Clone repository
git clone https://github.com/atiohaidar/filter-data-verif-gs-ppm.git

# Masuk folder
cd filter-data-verif-gs-ppm

# Buka di browser (pilih salah satu)
# Windows
start index.html

# Mac  
open index.html

# Linux
xdg-open index.html
```

### 📁 **Option 3: Download & Use**
1. Download ZIP dari [GitHub](https://github.com/atiohaidar/filter-data-verif-gs-ppm)
2. Extract ke folder
3. Double-click `index.html`

---

## 📚 FAQ (Frequently Asked Questions)


### ❓ **Apakah perlu koneksi internet?**
**Ya, untuk pertama kali** download library CSS/JS. Setelah itu bisa offline (cache browser). Untuk penggunaan optimal gunakan koneksi internet.

### ❓ **Bisa export ke format selain CSV?**
Saat ini **hanya CSV**, tapi hasil bisa di-copy paste ke Excel, Google Sheets, atau aplikasi spreadsheet lainnya dengan format TSV (Tab Separated Values).

### ❓ **Bagaimana kalau ada bug atau request fitur?**
Silakan buat **GitHub Issue** di repository ini atau kontak developer. Kami sangat welcome untuk feedback dan improvement!

### ❓ **Apakah bisa diintegrasikan dengan sistem lain?**
**Ya!** Dashboard ini bisa dijadikan iframe, atau dimodifikasi untuk integrasi dengan sistem existing. Source code open source dan mudah dikustomisasi.

---

## 🤝 Contributing & Support

### 🐛 **Found a Bug?**
1. Buka [GitHub Issues](https://github.com/atiohaidar/filter-data-verif-gs-ppm/issues)
2. Jelaskan bug dengan detail
3. Sertakan screenshot jika perlu
4. Mention browser & OS yang digunakan

### 💡 **Feature Request?**
1. Cek dulu di [Issues](https://github.com/atiohaidar/filter-data-verif-gs-ppm/issues) apakah sudah ada
2. Buat issue baru dengan label "enhancement"
3. Jelaskan use case dan benefit-nya
4. Berikan contoh konkret jika ada

### 🔧 **Want to Contribute?**
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch  
5. Create Pull Request

---


### 🙏 **Credits**
- **Developer**: [atiohaidar](https://github.com/atiohaidar)
- **AI Assistant**: GitHub Copilot  
- **CSV Parser**: [PapaParse](https://www.papaparse.com/)
- **Charts**: [Chart.js](https://www.chartjs.org/)
- **Icons**: Unicode Emojis

---

## 📞 Contact & Links

### 🔗 **Important Links**
- 🌐 **Live Demo**: [atiohaidar.github.io/filter-data-verif-gs-ppm](https://atiohaidar.github.io/filter-data-verif-gs-ppm/)
- 📁 **Source Code**: [GitHub Repository](https://github.com/atiohaidar/filter-data-verif-gs-ppm)
- 🐛 **Issues**: [GitHub Issues](https://github.com/atiohaidar/filter-data-verif-gs-ppm/issues)
- 📖 **Documentation**: [Wiki](https://github.com/atiohaidar/filter-data-verif-gs-ppm/wiki)


---

<div align="center">

### 🎉 **Selamat Menggunakan Dashboard Verifikasi Publikasi!**


</div>
