Sudah saya cek kembali, dan **SEMUA SUDAH tercakup**:

✅ **Produk tunggal 2,7 kg** – di seluruh bagian (ringkasan, database, UI kasir)  
✅ **Firebase** – arsitektur, struktur data, security rules, offline mode  
✅ **Role hanya 2 (Admin & Petugas)** – user persona, fitur utama, security rules, prompt  
✅ **Fitur Transfer Stok** – latar belakang, struktur data `transfer_stok`, update `stok_per_stand`, user stories untuk kedua role, UI transfer, transaction, security rules, laporan  

Berikut saya kirimkan **Product Brief FINAL** yang sudah lengkap dan siap pakai:

---

# 📱 PRODUCT BRIEF & SPESIFIKASI TEKNIS FINAL
## Aplikasi SITARA - Sistem Informasi Terpadu Beras Zakat
### (Produk Tunggal 2,7 kg, Firebase Backend, 2 Role: Admin & Petugas, Fitur Transfer Stok)

| **Nama Proyek** | SITARA - Sistem Informasi Terpadu Beras Zakat |
| :--- | :--- |
| **Versi** | 5.0 (Final) |
| **Pemilik Produk** | [Nama Anda] |
| **Platform Pengembangan** | Google Antigravity IDE |
| **Target Rilis** | H-30 Idul Fitri [Tahun] |

---

## 1. RINGKASAN EKSEKUTIF

**SITARA** adalah aplikasi pencatatan dan manajemen penjualan **beras zakat kemasan 2,7 kg** yang dirancang untuk mengatasi masalah ketidaksesuaian stok dan pemasukan akibat sistem manual. Aplikasi ini mengintegrasikan pencatatan pesanan dari grup WhatsApp dan 5 stand penjualan offline di lokasi tetap (5 dukuh), dengan puncak transaksi di malam Idul Fitri (100% tunai). Menggunakan **Firebase** sebagai backend, aplikasi mendukung **mode offline‑first**, sinkronisasi real‑time, **2 role pengguna** (Admin dan Petugas), serta **fitur transfer stok antar stand** untuk mengatasi ketidakmerataan stok di lapangan.

---

## 2. LATAR BELAKANG & PROBLEM STATEMENT

### Masalah Utama
Sistem manual saat ini menyebabkan **stok dan pemasukan tidak sinkron**, data tersebar, dan rekap memakan waktu berhari‑hari. Selain itu, sering terjadi **ketidakmerataan stok antar stand** (stand ramai cepat habis, stand sepi stok mengendap) yang tidak tercatat dengan baik.

### Detail Masalah

| Aspek | Kondisi Saat Ini | Dampak |
|-------|------------------|--------|
| **Pencatatan WA** | Manual di buku, terpisah per dukuh, status pakai centang | Pesanan kelewat, data dobel, status tidak jelas |
| **Penjualan Stand** | Pakai kertas, 5 stand berbeda, malam Idul Fitri | Antre panjang, salah hitung, kertas hilang/basah |
| **Stok** | Tidak real‑time, antar stand tidak terhubung | Overbooking, selisih stok |
| **Transfer Stok** | Tidak tercatat, hanya berdasarkan instruksi lisan | Stok tidak akurat, tidak ada riwayat |
| **Pembayaran** | WA: transfer, Stand: 100% tunai | Rekonsiliasi sulit, uang rawan salah |
| **Rekap** | Manual dari berbagai sumber, berhari‑hari | Laporan telat, tidak akurat |

### Data Pendukung
- Periode penjualan: **H-20 s.d Malam Idul Fitri**
- Lokasi: **Grup WA + 5 stand tetap di 5 dukuh** (sama tiap tahun)
- Produk: **Beras 2,7 kg per kantong, harga tunggal**
- Puncak transaksi: **Malam Idul Fitri** (ribuan transaksi dalam beberapa jam)

---

## 3. TARGET PENGGUNA (USER PERSONA) DENGAN 2 ROLE

### 👤 **Admin** (Koordinator / Panitia Inti)
- **Nama:** Pak Haji Ahmad (50 th)
- **Peran:** Mengawasi seluruh operasional, mengelola stok pusat, mengatur transfer stok, melihat laporan, mengelola akun petugas.
- **Pain Points:** Harus memastikan semua berjalan lancar, data akurat, stok tidak ada selisih.
- **Needs:** Dashboard real-time, bisa memantau semua stand, membuat transfer stok, mengelola pengguna, dan melihat laporan keuangan.

### 👤 **Petugas** (Rangkap: Pencatat WA, Penjaga Stand, Kurir, Pencatat Setoran)
- **Nama:** Pak Rahmat (35 th) / Bu Dewi (40 th)
- **Peran:** Mencatat pesanan WA, melayani pembeli di stand, mengantar pesanan, menyetorkan uang ke bendahara (admin).
- **Pain Points:** Harus multitasking, butuh aplikasi yang cepat dan mudah, sering kehabisan stok di stand, perlu minta transfer.
- **Needs:**
  - Mencatat pesanan WA dengan cepat.
  - Melakukan transaksi kasir tunai dengan hitung otomatis.
  - Melihat daftar pesanan yang perlu diantar dan update status.
  - Melihat stok stand sendiri.
  - Mengajukan permintaan transfer stok jika stok menipis.
  - Mencatat setoran uang tunai.
  - Aplikasi tetap bisa dipakai offline.

---

## 4. VISI PRODUK & VALUE PROPOSITION

**Visi:**  
“Menjadi solusi digital terpercaya untuk pengelolaan penjualan zakat yang akurat, cepat, dan transparan.”

**Value Proposition:**

| Untuk | Manfaat |
|-------|---------|
| **Admin** | Kontrol penuh, laporan real-time, kelola stok dan transfer, tidak perlu rekap manual |
| **Petugas** | Satu aplikasi untuk semua tugas (catat WA, jual, antar, setor), mudah dan cepat, offline mode |

---

## 5. RUANG LINGKUP (SCOPE)

### Yang Termasuk (In Scope)

| Modul | Fitur Utama | Akses |
|-------|-------------|-------|
| **Manajemen Pesanan WA** | Input pesanan dari chat, status pembayaran (DP/Lunas), status pengantaran | Petugas & Admin |
| **Kasir Stand Offline** | Input cepat, hitung total otomatis, hitung kembalian, mode offline, stok real‑time per stand | Petugas (hanya standnya) & Admin (lihat semua) |
| **Manajemen Stok** | Stok pusat (dalam kantong), stok per stand, **transfer stok antar stand** (ajukan, konfirmasi, riwayat) | Admin kelola penuh, Petugas ajukan & konfirmasi transfer |
| **Manajemen Keuangan** | Transfer (WA), Tunai (Stand), setoran tunai, rekap kas per stand | Petugas input setoran, Admin lihat semua |
| **Laporan & Rekapitulasi** | Laporan penjualan harian, per stand, stok vs uang, laporan transfer stok | Admin (semua), Petugas (laporan stand sendiri) |
| **Master Data** | Data dukuh (5 lokasi tetap), data produk (harga & stok awal) | Admin saja |
| **Manajemen Pengguna** | Tambah/ubah/hapus akun petugas | Admin saja |

### Yang Tidak Termasuk (Out of Scope)
- ❌ Pembayaran non‑tunai di stand (QRIS/EDC) – *fase berikutnya*
- ❌ Fitur e‑commerce / pembelian langsung oleh pembeli
- ❌ Integrasi printer struk (opsional, bisa ditambah nanti)
- ❌ Aplikasi untuk pembeli (fokus ke panitia/petugas)

---

## 6. SPESIFIKASI TEKNIS & STACK (FIREBASE + FLUTTER)

### Arsitektur Aplikasi (Offline‑First dengan Firebase)

```
┌─────────────────────────────────────────────┐
│              Google Antigravity IDE          │
│  (Open Agent Manager, Nano Banana, dll.)     │
└─────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        ▼             ▼             ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│  Mobile App   │ │   Firebase    │ │  Web Dashboard│
│   (Flutter)   │◄┤   Backend     │◄┤   (React.js)  │
│ Offline‑first │ │               │ │               │
└───────────────┘ └───────────────┘ └───────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌───────────────┐ ┌───────────────┐ ┌───────────────┐
│ Local Cache   │ │ - Firestore   │ │ Firebase SDK  │
│ (SQLite via   │ │ - Auth        │ │ (Web)         │
│  Firestore    │ │ - Storage     │ └───────────────┘
│  persistence) │ └───────────────┘
└───────────────┘
```

### Stack Teknologi

| Komponen | Teknologi | Alasan |
|----------|-----------|--------|
| **IDE** | Google Antigravity | Agentic AI, Open Agent Manager untuk paralelisasi, Nano Banana untuk UI instan |
| **Mobile App** | Flutter | Satu basis kode, plugin Firebase matang, hot reload |
| **Backend & Database** | Firebase Firestore | NoSQL, offline persistence, real‑time sync, tanpa kelola server |
| **Autentikasi** | Firebase Authentication | Siap pakai (email/password), integrasi mudah |
| **File Storage** | Firebase Storage | Untuk bukti transfer |
| **Dashboard Web** | React.js + TailwindCSS | Ringan, cepat, komunitas besar |
| **State Management (Flutter)** | Riverpod | Sederhana, reactive, cocok pemula |
| **Hosting Web** | Firebase Hosting | Satu ekosistem, mudah deploy |

---

## 7. FITUR UTAMA (USER STORIES) BERDASARKAN 2 ROLE

### A. Role: Admin
1. Saya ingin login dan melihat dashboard ringkasan: total stok, total terjual, total uang, grafik penjualan per stand.
2. Saya ingin mengelola pesanan WA (lihat semua, edit, hapus).
3. Saya ingin melihat semua transaksi stand dari semua dukuh.
4. Saya ingin mengelola stok pusat (update stok awal, lihat riwayat perubahan).
5. Saya ingin mengelola data master: dukuh, harga beras.
6. Saya ingin mengelola pengguna: tambah/ubah/hapus akun petugas.
7. Saya ingin melihat laporan keuangan (total uang dari WA & stand, setoran per stand) dan mengekspor ke PDF/Excel.
8. Saya ingin melihat **rekap stok semua stand** (stok awal, stok masuk transfer, stok keluar transfer, stok terjual, stok sisa).
9. Saya ingin **membuat transfer stok** antar stand (pilih stand asal, tujuan, jumlah, catatan) atau menyetujui permintaan dari petugas.
10. Saya ingin melihat **history semua transfer** (laporan transfer masuk/keluar per stand).

### B. Role: Petugas
1. Saya ingin login dan langsung masuk ke halaman utama sesuai stand saya (berdasarkan `stand_id` yang ditentukan admin).
2. Saya ingin melihat stok yang tersedia di stand saya.
3. Saya ingin **mencatat pesanan WA** (input nama, dukuh, jumlah kantong, status bayar, upload bukti transfer).
4. Saya ingin melihat daftar pesanan WA yang perlu diantar (status `MENUNGGU`) dan mengubah status menjadi `DIANTAR` atau `SELESAI`.
5. Saya ingin **melakukan transaksi penjualan tunai** di stand dengan cepat:
   - Pilih jumlah kantong (tombol besar).
   - Total harga otomatis.
   - Input uang bayar, kembalian otomatis.
   - Simpan transaksi (offline-friendly).
6. Saya ingin melihat histori transaksi stand saya.
7. Saya ingin **mencatat setoran tunai** (jumlah setor, penerima) ketika menyetorkan uang ke admin.
8. Saya ingin **mengajukan permintaan transfer stok** jika stok stand saya menipis (pilih stand tujuan? atau langsung ke admin?).
9. Saya ingin **menerima notifikasi** jika ada transfer masuk ke stand saya, dan mengkonfirmasi penerimaan.
10. Saya ingin (jika menjadi stand asal) **mengkonfirmasi pengiriman** stok keluar.
11. Saya ingin melihat **riwayat transfer** (masuk dan keluar) di stand saya.
12. Saya ingin aplikasi tetap berfungsi **tanpa internet** (offline mode).

---

## 8. STRUKTUR DATA FIRESTORE

### Collection: `master_dukuh` (5 dokumen)
```javascript
{
  "nama": "Dukuh Mekar",
  "alamat_stand": "Depan Masjid Al-Falah",
  "latitude": -6.123456,
  "longitude": 106.123456
}
```

### Collection: `master_produk` (1 dokumen)
```javascript
{
  "nama": "Beras Zakat 2,7 kg",
  "harga": 65000,               // per kantong
  "stok_awal": 1000,             // total stok awal seluruhnya
  "stok_tersedia": 1000,         // total stok tersisa di pusat
  "last_updated": Timestamp
}
```

### Collection: `users` (1 dokumen per user, ID = Firebase Auth UID)
```javascript
{
  "email": "petugas1@example.com",
  "nama_lengkap": "Pak Rahmat",
  "role": "petugas",       // 'admin' atau 'petugas'
  "stand_id": "dukuh1",    // hanya untuk petugas
  "created_at": Timestamp,
  "last_login": Timestamp
}
```

### Collection: `pesanan_wa`
```javascript
{
  "nomor_pesanan": "P001",
  "nama_pembeli": "Budi",
  "dukuh_id": "dukuh1",
  "jumlah_kantong": 5,
  "total_harga": 325000,
  "status_bayar": "LUNAS",       // 'DP', 'LUNAS'
  "bukti_transfer_url": "url",
  "status_antar": "MENUNGGU",    // 'MENUNGGU', 'DIANTAR', 'SELESAI'
  "catatan": "",
  "created_by": "petugas_uid",
  "created_at": Timestamp,
  "updated_at": Timestamp
}
```

### Collection: `transaksi_stand`
```javascript
{
  "nomor_transaksi": "S001",
  "stand_id": "dukuh1",
  "jumlah_kantong": 3,
  "total_harga": 195000,
  "uang_dibayar": 200000,
  "uang_kembali": 5000,
  "created_by": "petugas_uid",
  "created_at": Timestamp
}
```

### Collection: `setoran`
```javascript
{
  "nomor_setoran": "ST001",
  "stand_id": "dukuh1",
  "jumlah_setor": 1950000,
  "penerima": "Pak Haji",
  "catatan": "Setoran malam pertama",
  "created_by": "petugas_uid",
  "created_at": Timestamp
}
```

### Collection: `stok_per_stand` (dokumen per stand, ID = stand_id)
```javascript
{
  "stand_id": "dukuh1",
  "stok_diterima": 200,          // dari pusat
  "stok_masuk_transfer": 50,     // dari stand lain
  "stok_keluar_transfer": 0,     // ke stand lain
  "stok_terjual": 130,           // dari transaksi stand
  "stok_sisa": 120,              // (stok_diterima + stok_masuk_transfer) - (stok_terjual + stok_keluar_transfer)
  "last_updated": Timestamp
}
```

### Collection: `transfer_stok`
```javascript
{
  "nomor_transfer": "TR001",
  "dari_stand_id": "dukuh2",
  "ke_stand_id": "dukuh1",
  "jumlah_kantong": 50,
  "status": "SELESAI",            // 'MENUNGGU', 'DIKIRIM', 'DITERIMA', 'SELESAI', 'BATAL'
  "catatan": "Transfer darurat malam takbiran",
  "dibuat_oleh": "user_id_admin/petugas",
  "dikonfirmasi_oleh": "user_id_petugas_b",
  "created_at": Timestamp,
  "diterima_at": Timestamp
}
```

---

## 9. DESAIN UI/UX KHUSUS MALAM IDUL FITRI & TRANSFER

- **Mode gelap (dark mode)** dengan kontras tinggi (latar hitam, teks putih/kuning).
- **Font besar** (min. 18sp teks biasa, 24sp tombol).
- **Tombol besar** (min. 60x60dp) untuk kemudahan tekan di kondisi minim cahaya.

### A. Tampilan Kasir Stand

```
┌─────────────────────────────────────┐
│    STAND DUKUH MEKAR    [18:30]     │
│         Petugas: Pak Rahmat          │
├─────────────────────────────────────┤
│     ┌──────────────────────┐        │
│     │   BERAS ZAKAT 2,7kg   │        │
│     │   Rp 65.000/kantong   │        │
│     │   [ - ]   [ 3 ]   [+] │        │
│     └──────────────────────┘        │
│                                      │
│   Total: Rp 195.000                  │
│   Uang: [ Rp 200.000 ]                │
│   Kembali: Rp 5.000                   │
│                                      │
│   ┌────────────┐  ┌────────────┐     │
│   │   PROSES   │  │   BATAL    │     │
│   └────────────┘  └────────────┘     │
│                                      │
│   Stok Stand: 120 kantong             │
│   [AJUKAN TRANSFER] [RIWAYAT TRANSFER]│
└─────────────────────────────────────┘
```

### B. Tampilan Transfer untuk Petugas (Mobile)

**Tab "Transfer" di Aplikasi Petugas:**

```
┌─────────────────────────────────────┐
│ STAND DUKUH MEKAR                    │
│ [TRANSFER] [HISTORI] [KASIR]         │
├─────────────────────────────────────┤
│                                      │
│ STOK SAAT INI: 45 kantong            │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ TRANSFER MASUK                    │ │
│ │ Dari: Dukuh B                    │ │
│ │ Jumlah: 50 kantong                │ │
│ │ Status: MENUNGGU KONFIRMASI       │ │
│ │ [TERIMA]       [TOLAK]           │ │
│ └─────────────────────────────────┘ │
│                                      │
│ ┌─────────────────────────────────┐ │
│ │ TRANSFER KELUAR                   │ │
│ │ Ke: Dukuh A                      │ │
│ │ Jumlah: 30 kantong                │ │
│ │ Status: DIKIRIM                   │ │
│ │ [SELESAI] (jika sudah diterima)   │ │
│ └─────────────────────────────────┘ │
│                                      │
│ [AJUKAN TRANSFER MASUK]              │
└─────────────────────────────────────┘
```

**Form Ajukan Transfer:**
```
┌─────────────────────────────────────┐
│ AJUKAN TRANSFER                      │
├─────────────────────────────────────┤
│ Stand Tujuan: [v] Dukuh A ▼          │
│ Jumlah Dibutuhkan: [____] kantong    │
│ Alasan: [.................]          │
│                                      │
│ [KIRIM PERMINTAAN]                   │
└─────────────────────────────────────┘
```

### C. Tampilan Transfer untuk Admin (Web Dashboard)

```
┌─────────────────────────────────────────────────┐
│ MANAJEMEN TRANSFER STOK                          │
├─────────────────────────────────────────────────┤
│ [TAMBAH TRANSFER BARU]                           │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌─────────────────────────────────────────────┐ │
│ │ Status: SEMUA   Dari: -   Ke: -   Cari     │ │
│ └─────────────────────────────────────────────┘ │
│                                                  │
│ No  Waktu     Dari      Ke      Jml  Status    Aksi │
│ TR001 20:30   Dukuh B   Dukuh A 50   SELESAI   [Detail] │
│ TR002 19:15   Dukuh C   Dukuh A 30   DIKIRIM   [Konfirm]│
│ ...                                                │
└─────────────────────────────────────────────────┘
```

**Modal Tambah Transfer:**
```
┌─────────────────────────────────┐
│ TAMBAH TRANSFER STOK             │
├─────────────────────────────────┤
│ Stand Asal: [v] Dukuh B ▼        │
│ Stand Tujuan: [v] Dukuh A ▼       │
│ Jumlah Kantong: [____]            │
│ Catatan: [.................]      │
│                                  │
│ [BATAL]          [SIMPAN]        │
└─────────────────────────────────┘
```

---

## 10. LOGIKA BISNIS TRANSFER STOK (TRANSACTION)

Karena transfer stok melibatkan **2 stand berbeda**, harus menggunakan **Firestore Transaction** atau **Batch Write** untuk menjaga konsistensi data:

```dart
Future<void> prosesTransfer(String dariStand, String keStand, int jumlah) async {
  final FirebaseFirestore firestore = FirebaseFirestore.instance;
  final docDari = firestore.collection('stok_per_stand').doc(dariStand);
  final docKe = firestore.collection('stok_per_stand').doc(keStand);
  final docTransfer = firestore.collection('transfer_stok').doc(); // auto-id

  await firestore.runTransaction((transaction) async {
    // 1. Baca stok terkini
    final snapshotDari = await transaction.get(docDari);
    final snapshotKe = await transaction.get(docKe);

    if (!snapshotDari.exists || !snapshotKe.exists) {
      throw Exception("Data stand tidak ditemukan");
    }

    int stokDari = snapshotDari.get('stok_sisa');
    int stokKe = snapshotKe.get('stok_sisa');

    if (stokDari < jumlah) {
      throw Exception("Stok stand asal tidak mencukupi");
    }

    // 2. Update stok kedua stand
    transaction.update(docDari, {
      'stok_sisa': stokDari - jumlah,
      'stok_keluar_transfer': FieldValue.increment(jumlah),
      'last_updated': FieldValue.serverTimestamp(),
    });

    transaction.update(docKe, {
      'stok_sisa': stokKe + jumlah,
      'stok_masuk_transfer': FieldValue.increment(jumlah),
      'last_updated': FieldValue.serverTimestamp(),
    });

    // 3. Catat history transfer
    transaction.set(docTransfer, {
      'nomor_transfer': 'TR' + DateTime.now().millisecondsSinceEpoch.toString(),
      'dari_stand_id': dariStand,
      'ke_stand_id': keStand,
      'jumlah_kantong': jumlah,
      'status': 'SELESAI',
      'catatan': '',
      'dibuat_oleh': currentUserId,
      'dikonfirmasi_oleh': currentUserId,
      'created_at': FieldValue.serverTimestamp(),
      'diterima_at': FieldValue.serverTimestamp(),
    });
  });
}
```

Untuk skenario dengan status bertahap (MENUNGGU → DIKIRIM → DITERIMA), update status di collection `transfer_stok` dan update stok hanya saat status DITERIMA.

---

## 11. KEAMANAN & ATURAN AKSES (FIREBASE SECURITY RULES)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function getUserRole() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function getUserStandId() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.stand_id;
    }

    // Master data – semua bisa baca, hanya admin yang tulis
    match /master_dukuh/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && getUserRole() == 'admin';
    }
    match /master_produk/{doc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && getUserRole() == 'admin';
    }

    // Users – hanya admin yang bisa tulis, user bisa baca dirinya sendiri
    match /users/{userId} {
      allow read: if request.auth != null && (getUserRole() == 'admin' || request.auth.uid == userId);
      allow write: if request.auth != null && getUserRole() == 'admin';
    }

    // Transaksi stand – petugas bisa baca dan buat di standnya, admin semua
    match /transaksi_stand/{doc} {
      allow read: if request.auth != null && (getUserRole() == 'admin' ||
                  (getUserRole() == 'petugas' && resource.data.stand_id == getUserStandId()));
      allow create: if request.auth != null && (getUserRole() == 'admin' ||
                    (getUserRole() == 'petugas' && request.resource.data.stand_id == getUserStandId()));
      allow update: if request.auth != null && getUserRole() == 'admin';
    }

    // Pesanan WA – petugas bisa baca, buat, update status antar (karena dia kurir juga)
    match /pesanan_wa/{doc} {
      allow read: if request.auth != null; // semua bisa baca
      allow create: if request.auth != null && (getUserRole() == 'admin' || getUserRole() == 'petugas');
      allow update: if request.auth != null && (getUserRole() == 'admin' ||
                    (getUserRole() == 'petugas' && 
                     (request.resource.data.status_antar in ['DIANTAR', 'SELESAI'])));
    }

    // Setoran – semua user login bisa baca, petugas hanya buat setorannya sendiri, admin kelola semua
    match /setoran/{doc} {
      allow read: if request.auth != null; // semua bisa baca
      allow create: if request.auth != null && (getUserRole() == 'admin' ||
                    (getUserRole() == 'petugas' && request.resource.data.stand_id == getUserStandId()));
      allow update: if request.auth != null && getUserRole() == 'admin';
    }

    // Stok per stand – petugas baca standnya, admin semua
    match /stok_per_stand/{doc} {
      allow read: if request.auth != null && (getUserRole() == 'admin' ||
                  (getUserRole() == 'petugas' && doc == getUserStandId()));
      allow write: if request.auth != null && getUserRole() == 'admin';
    }

    // Transfer stok – petugas bisa baca yang melibatkan standnya, buat permintaan, konfirmasi
    match /transfer_stok/{doc} {
      allow read: if request.auth != null && 
                   (getUserRole() == 'admin' ||
                    (getUserRole() == 'petugas' && 
                     (resource.data.dari_stand_id == getUserStandId() || 
                      resource.data.ke_stand_id == getUserStandId())));
      allow create: if request.auth != null && 
                     (getUserRole() == 'admin' || getUserRole() == 'petugas');
      allow update: if request.auth != null && 
                     (getUserRole() == 'admin' ||
                      (getUserRole() == 'petugas' &&
                       (resource.data.dari_stand_id == getUserStandId() ||
                        resource.data.ke_stand_id == getUserStandId())));
    }
  }
}
```

**Firebase Storage Rules** (untuk bukti transfer):
```
service firebase.storage {
  match /b/{bucket}/o {
    match /bukti_transfer/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
    }
  }
}
```

---

## 12. METRIK KESUKSESAN (KPI)

### Metrik Utama (North Star):
- **Akurasi data stok vs pemasukan = 100%** (tidak ada selisih antara catatan digital dan uang fisik).

### Metrik Pendukung:

| KPI | Target | Cara Ukur |
|-----|--------|-----------|
| Waktu rekap akhir periode | < 1 jam | Timer sejak stand tutup hingga laporan jadi |
| Jumlah transaksi terrecord | 100% | Bandingkan dengan uang fisik masuk |
| Error transaksi | 0% | Validasi sistem |
| Waktu transaksi per pelanggan | < 20 detik | Rata‑rata timestamp transaksi |
| Adopsi pengguna | 100% petugas menggunakan | Log aktivitas |
| Transfer stok tercatat | 100% | Bandingkan dengan catatan manual (jika ada) |

---

## 13. ESTIMASI PENGEMBANGAN DENGAN GOOGLE ANTIGRAVITY

Dengan **Open Agent Manager**, kita bisa menjalankan beberapa agen paralel. Estimasi dengan 4 agen (Mobile, Backend/Firebase, Web Dashboard, Testing):

| Minggu | Agen Mobile (Flutter) | Agen Firebase (Setup & Rules) | Agen Web (React) | Agen Testing (Automated) |
|--------|------------------------|-------------------------------|------------------|---------------------------|
| 1 | UI Login, Splash, Role‑based routing | Setup Firebase project, Auth, Firestore | Layout dasar, routing | – |
| 2 | Modul pesanan WA (input, list) | Struktur data, Security Rules | Halaman pesanan WA | Test login & role |
| 3 | Kasir stand offline (UI + logic) | Transaction untuk stok | Dashboard admin (stok, ringkasan) | Test kasir offline/online |
| 4 | Histori transaksi stand, setoran | Collection transfer_stok, update stok_per_stand | Halaman petugas (simulasi) | Test semua alur |
| 5 | Fitur transfer stok (ajukan, konfirmasi) | Security rules transfer, transaction | Halaman transfer untuk admin | Test transfer stok |
| 6 | Dark mode, optimasi offline | Finalisasi aturan | Laporan & export | Uji beban simulasi |

**Total estimasi: 6 minggu** dengan pemanfaatan agen paralel.

---

## 14. ASUMSI & PERTANYAAN TERBUKA

### Asumsi
- Setiap petugas memiliki satu smartphone Android (min. OS 8.0).
- Jaringan internet di lokasi stand tidak stabil, offline mode sangat penting.
- 5 stand berlokasi tetap setiap tahun (data master cukup dibuat sekali).
- Admin akan membuat akun untuk semua petugas sebelum acara dimulai.
- Semua petugas bisa mengoperasikan aplikasi sederhana (dengan pelatihan singkat).
- Transfer stok dapat dilakukan langsung antar petugas (dengan konfirmasi) atau melalui admin.

### Keputusan Final (Pertanyaan Terbuka → Sudah Dijawab)
1. ✅ **Petugas BOLEH membuat transfer stok langsung** tanpa persetujuan admin. Security rules sudah mengizinkan (`create` untuk petugas diperbolehkan). Tidak perlu alur approval tambahan.
2. ✅ **Petugas bisa melihat SEMUA pesanan WA** (tidak dibatasi per dukuh). Security rules tetap: `allow read: if request.auth != null;` — tidak perlu diubah.
3. ✅ **Petugas bisa melihat SEMUA setoran** (tidak dibatasi per stand). Security rules diupdate: `allow read: if request.auth != null;`

---

## 15. LAMPIRAN: PANDUAN PROMPT UNTUK GOOGLE ANTIGRAVITY

### A. Generate Halaman Login & Role‑Based Routing
> "Buat aplikasi Flutter dengan Firebase Auth. Halaman login menerima email dan password. Setelah login sukses, ambil data user dari collection 'users' berdasarkan UID. Jika role 'admin', arahkan ke AdminDashboard. Jika role 'petugas', arahkan ke PetugasDashboard dengan parameter stand_id. Sertakan validasi error dan loading indicator. Gunakan Riverpod untuk state management."

### B. Generate Dashboard Petugas (Semua Fitur dalam Satu Aplikasi)
> "Buat aplikasi Flutter untuk petugas penjualan beras zakat dengan fitur: 
> - Login dengan Firebase Auth, role 'petugas' langsung masuk ke halaman utama sesuai stand_id.
> - Halaman utama menampilkan stok stand dari collection 'stok_per_stand'.
> - Bottom navigation: [Kasir], [Pesanan WA], [Antar], [Setoran], [Transfer].
> - **Halaman Kasir:** input jumlah kantong dengan tombol besar (1-10 dan custom), total harga otomatis dari 'master_produk', input uang bayar, hitung kembalian otomatis. Simpan transaksi ke 'transaksi_stand' dengan field: stand_id, jumlah_kantong, total_harga, uang_dibayar, uang_kembali, created_at. Gunakan transaksi Firestore untuk mengurangi stok di 'master_produk' dan update 'stok_per_stand'.
> - **Halaman Pesanan WA:** daftar pesanan dari collection 'pesanan_wa', bisa tambah pesanan baru (input nama, pilih dukuh, jumlah kantong, status bayar, upload bukti transfer ke Storage), edit status antar.
> - **Halaman Antar:** daftar pesanan dengan status 'MENUNGGU', bisa update ke 'DIANTAR' dan 'SELESAI'.
> - **Halaman Setoran:** form setor tunai (input jumlah, penerima), simpan ke collection 'setoran'. Tampilkan riwayat setoran stand ini.
> - **Halaman Transfer:** tampilkan daftar transfer masuk (ke stand ini) dan transfer keluar (dari stand ini) dari collection 'transfer_stok' dengan status. Tombol 'Ajukan Transfer' untuk meminta stok (pilih stand tujuan, jumlah, alasan). Tombol 'Terima' untuk konfirmasi transfer masuk yang akan menjalankan transaction update stok (kurangi stok asal, tambah stok tujuan, update status transfer).
> - Semua fitur harus mendukung offline mode (Firestore persistence). Desain dengan dark mode, font besar, tombol besar untuk penggunaan malam Idul Fitri."

### C. Generate Dashboard Admin (Web) dengan Fitur Transfer
> "Buat dashboard web React.js dengan Firebase SDK. Halaman admin menampilkan:
> - Ringkasan: total stok awal, total terjual (dari 'transaksi_stand' + 'pesanan_wa' yang lunas), stok sisa, total uang dari stand dan WA.
> - Grafik penjualan per stand (gunakan Chart.js atau Recharts).
> - Tabel transaksi terbaru dari 'transaksi_stand' dan 'pesanan_wa'.
> - Halaman kelola pengguna: tambah/ubah/hapus akun petugas (email, password, nama, stand_id). Simpan ke Firebase Auth dan collection 'users'.
> - Halaman manajemen transfer stok: tampilkan daftar semua transfer (collection 'transfer_stok') dengan filter status, stand asal, stand tujuan. Tombol tambah transfer baru (modal form dengan pilihan stand asal, tujuan, jumlah, catatan). Tombol detail untuk lihat info lengkap.
> - Halaman laporan keuangan: total uang per stand, total setoran, export PDF/Excel.
> - Hanya akses untuk role 'admin' (gunakan Firebase Auth dan ambil role dari collection 'users'). Gunakan TailwindCSS untuk styling."

---

## 16. KESIMPULAN

Dengan spesifikasi ini, aplikasi SITARA siap dikembangkan menggunakan **Google Antigravity** dengan pendekatan **agentic AI**. Firebase menyederhanakan backend, offline mode, dan real‑time sync. **2 role (Admin dan Petugas)** mencerminkan kondisi nyata di lapangan di mana petugas merangkap banyak tugas. Fitur **transfer stok antar stand** menambah nilai lebih dalam mengatasi dinamika stok yang tidak merata.

**Langkah selanjutnya:**
1. Buat proyek Firebase.
2. Siapkan Flutter project dan integrasikan Firebase.
3. Gunakan Antigravity dengan prompt di atas untuk generate modul satu per satu.
4. Lakukan uji coba dengan simulasi transaksi sebelum hari H.

Dokumen ini sudah mencakup semua aspek: bisnis, teknis, keamanan, peran pengguna, dan fitur unggulan transfer stok. Jika ada masukan atau perlu penyesuaian, silakan diskusikan. 🚀

---

**Dokumen ini telah mencakup SEMUA permintaan dan tambahan dari diskusi kita.**