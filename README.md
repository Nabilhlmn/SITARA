# 🌾 SITARA - Sistem Informasi Tata Kelola Beras Zakat

Aplikasi web untuk manajemen distribusi dan penjualan beras zakat fitrah secara real-time. Dibangun menggunakan **React + Firebase** dengan sistem multi-role (Admin & Petugas).

## ✨ Fitur Utama

### 👨‍💼 Dashboard Admin
- **Monitoring real-time** stok pusat, penjualan, dan pendapatan
- **Manajemen stok** per stand/dukuh (distribusi, transfer antar stand)
- **Pesanan WhatsApp** — kelola pesanan online dengan status pembayaran & pengantaran
- **Laporan & Rekapitulasi** — ringkasan keuangan lengkap, cetak & download CSV
- **Manajemen pengguna** — kelola akun petugas dan hak akses
- **Transfer stok** — pindahkan stok antar stand dengan approval system
- **Setoran** — catat dan pantau setoran uang dari setiap stand

### 🧑‍💻 Dashboard Petugas
- **Kasir** — proses penjualan langsung di stand dengan riwayat transaksi harian
- **Pesanan WA** — terima dan kelola pesanan WhatsApp
- **Pengantaran** — kelola pengiriman pesanan
- **Transfer stok** — ajukan dan terima transfer stok antar stand
- **Setoran** — catat setoran uang ke admin

## 🛠️ Tech Stack

| Teknologi | Keterangan |
|-----------|------------|
| **React** | Frontend framework |
| **Vite** | Build tool |
| **Tailwind CSS** | Styling |
| **Firebase Auth** | Autentikasi pengguna |
| **Cloud Firestore** | Database real-time |
| **Recharts** | Grafik & visualisasi data |
| **Lucide React** | Icon library |

## 📦 Instalasi

```bash
# Clone repository
git clone https://github.com/username/AppZakat.git
cd AppZakat

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

## ⚙️ Konfigurasi Firebase

1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Aktifkan **Authentication** (Email/Password)
3. Aktifkan **Cloud Firestore**
4. Salin konfigurasi Firebase ke `src/firebase/config.js`
5. Deploy Firestore Rules dari file `firestore.rules`

## 🗂️ Struktur Dukuh/Stand

Aplikasi mendukung beberapa stand penjualan:
- Botoan, Kebaron, Gading, Karangan, Cepagan, Luar Cepagan

## 📄 Lisensi

Dibuat untuk kebutuhan pengelolaan beras zakat fitrah.




