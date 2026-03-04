/**
 * SITARA - Script Seed Data Awal
 * 
 * Cara pakai: buka browser console di http://localhost:5173,
 * copy-paste script ini setelah login atau sebelum login.
 * 
 * ATAU: Jalankan sekali dari Firebase Console > Firestore > untuk input manual.
 * 
 * Script ini membuat:
 * 1. Akun Admin di Firebase Auth
 * 2. Data user admin di Firestore
 * 3. Master produk beras
 * 4. 5 data dukuh
 * 5. 5 data stok per stand (kosong)
 */

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCQ3Axgi8uR4jCwy1BzIizT0QspOma0sQ4",
    authDomain: "zakatapp-v1.firebaseapp.com",
    projectId: "zakatapp-v1",
    storageBucket: "zakatapp-v1.firebasestorage.app",
    messagingSenderId: "64879688270",
    appId: "1:64879688270:web:9598c1fd5a98c175fc211f"
};

const app = initializeApp(firebaseConfig, 'seed');
const auth = getAuth(app);
const db = getFirestore(app);

async function seedAll() {
    console.log('▶ Mulai seed data...');

    // 1. Buat akun admin
    const ADMIN_EMAIL = 'admin@sitara.com';
    const ADMIN_PASSWORD = 'admin123456';

    try {
        const cred = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        await setDoc(doc(db, 'users', cred.user.uid), {
            email: ADMIN_EMAIL,
            nama_lengkap: 'Administrator SITARA',
            role: 'admin',
            stand_id: null,
            created_at: serverTimestamp(),
            last_login: null,
        });
        console.log('✅ Admin dibuat:', ADMIN_EMAIL, '/ password:', ADMIN_PASSWORD);
    } catch (e) {
        if (e.code === 'auth/email-already-in-use') {
            console.log('⚠️  Admin sudah ada, skip...');
        } else {
            console.error('❌ Error buat admin:', e.message);
        }
    }

    // 2. Master Produk
    await setDoc(doc(db, 'master_produk', 'beras_zakat'), {
        nama: 'Beras Zakat 2,7 kg',
        harga: 65000,
        stok_awal: 1000,
        stok_tersedia: 1000,
        last_updated: serverTimestamp(),
    });
    console.log('✅ Master produk dibuat');

    // 3. Master Dukuh
    const dukuhs = [
        { id: 'dukuh1', nama: 'Dukuh Mekar', alamat_stand: 'Depan Masjid Al-Falah', latitude: -6.2, longitude: 106.8 },
        { id: 'dukuh2', nama: 'Dukuh Sari', alamat_stand: 'Balai Desa Sari', latitude: -6.21, longitude: 106.81 },
        { id: 'dukuh3', nama: 'Dukuh Jaya', alamat_stand: 'Pos RT 05', latitude: -6.22, longitude: 106.82 },
        { id: 'dukuh4', nama: 'Dukuh Asri', alamat_stand: 'Masjid Ar-Rahman', latitude: -6.23, longitude: 106.83 },
        { id: 'dukuh5', nama: 'Dukuh Mulia', alamat_stand: 'Lapangan Desa', latitude: -6.24, longitude: 106.84 },
    ];
    for (const d of dukuhs) {
        await setDoc(doc(db, 'master_dukuh', d.id), d);
    }
    console.log('✅ 5 dukuh dibuat');

    // 4. Stok per stand (kosong awal)
    for (const d of dukuhs) {
        await setDoc(doc(db, 'stok_per_stand', d.id), {
            stand_id: d.id,
            stok_diterima: 0,
            stok_masuk_transfer: 0,
            stok_keluar_transfer: 0,
            stok_terjual: 0,
            stok_sisa: 0,
            last_updated: serverTimestamp(),
        });
    }
    console.log('✅ Stok per stand diinisialisasi');

    console.log('\n🎉 SEED SELESAI!');
    console.log('📧 Admin login: admin@sitara.com / admin123456');
    console.log('   Ganti password setelah login pertama kali!');
}

seedAll();
