import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { STANDS, getDukuhName } from '../../constants/dukuh';
import { FileBarChart, Printer, Package, DollarSign, Download, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

function formatRupiah(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

export default function Laporan() {
    const [transaksiStand, setTransaksiStand] = useState([]);
    const [pesananWA, setPesananWA] = useState([]);
    const [setoranList, setSetoranList] = useState([]);
    const [stokPerStand, setStokPerStand] = useState([]);
    const [harga, setHarga] = useState(65000);

    useEffect(() => {
        const unsubs = [
            onSnapshot(query(collection(db, 'transaksi_stand'), orderBy('created_at', 'desc')), s => setTransaksiStand(s.docs.map(d => ({ id: d.id, ...d.data() })))),
            onSnapshot(query(collection(db, 'pesanan_wa'), orderBy('created_at', 'desc')), s => setPesananWA(s.docs.map(d => ({ id: d.id, ...d.data() })))),
            onSnapshot(query(collection(db, 'setoran'), orderBy('created_at', 'desc')), s => setSetoranList(s.docs.map(d => ({ id: d.id, ...d.data() })))),
            onSnapshot(collection(db, 'stok_per_stand'), s => setStokPerStand(s.docs.map(d => ({ id: d.id, ...d.data() })))),
            onSnapshot(collection(db, 'master_produk'), s => { if (!s.empty) setHarga(s.docs[0].data().harga || 65000); }),
        ];
        return () => unsubs.forEach(u => u());
    }, []);

    // Kalkulasi per stand
    const standStats = STANDS.map(id => {
        const stok = stokPerStand.find(s => s.id === id) || {};
        const txs = transaksiStand.filter(t => t.stand_id === id);
        const uangStand = txs.reduce((a, t) => a + (t.total_harga || 0), 0);
        const totalSetor = setoranList.filter(s => s.stand_id === id).reduce((a, s) => a + (s.jumlah_setor || 0), 0);
        return {
            id,
            stok_awal: stok.stok_diterima || 0,
            stok_masuk: stok.stok_masuk_transfer || 0,
            stok_keluar: stok.stok_keluar_transfer || 0,
            stok_terjual: stok.stok_terjual || 0,
            stok_sisa: stok.stok_sisa || 0,
            uang_stand: uangStand,
            total_setor: totalSetor,
        };
    });

    const totalUangStand = standStats.reduce((a, s) => a + s.uang_stand, 0);
    const uangWA = pesananWA.filter(p => p.status_bayar === 'LUNAS').reduce((a, p) => a + (p.total_harga || 0), 0);
    const totalUang = totalUangStand + uangWA;
    const totalSetor = setoranList.reduce((a, s) => a + (s.jumlah_setor || 0), 0);
    const totalTerjual = standStats.reduce((a, s) => a + s.stok_terjual, 0);

    // Download laporan sebagai CSV
    const handleDownload = () => {
        const now = new Date().toLocaleDateString('id-ID');
        const fmt = (n) => new Intl.NumberFormat('id-ID').format(n || 0);
        const sep = ';'; // Semicolon separator lebih kompatibel dengan Excel Indonesia

        let csv = `LAPORAN SITARA\n`;
        csv += `Tanggal${sep}${now}\n\n`;

        csv += `RINGKASAN KEUANGAN\n`;
        csv += `Keterangan${sep}Jumlah (Rp)\n`;
        csv += `Uang dari Stand${sep}${fmt(totalUangStand)}\n`;
        csv += `Uang dari WA (Lunas)${sep}${fmt(uangWA)}\n`;
        csv += `Total Pendapatan${sep}${fmt(totalUang)}\n`;
        csv += `Total Disetor${sep}${fmt(totalSetor)}\n\n`;

        csv += `REKAP STOK PER STAND\n`;
        csv += `Stand${sep}Diterima${sep}Masuk Transfer${sep}Keluar Transfer${sep}Terjual${sep}Sisa${sep}Uang (Rp)${sep}Setor (Rp)\n`;
        standStats.forEach(s => {
            csv += `${getDukuhName(s.id)}${sep}${s.stok_awal}${sep}${s.stok_masuk}${sep}${s.stok_keluar}${sep}${s.stok_terjual}${sep}${s.stok_sisa}${sep}${fmt(s.uang_stand)}${sep}${fmt(s.total_setor)}\n`;
        });
        csv += `TOTAL${sep}${standStats.reduce((a, s) => a + s.stok_awal, 0)}${sep}${standStats.reduce((a, s) => a + s.stok_masuk, 0)}${sep}${standStats.reduce((a, s) => a + s.stok_keluar, 0)}${sep}${totalTerjual}${sep}${standStats.reduce((a, s) => a + s.stok_sisa, 0)}${sep}${fmt(totalUangStand)}${sep}${fmt(totalSetor)}\n\n`;

        csv += `PESANAN WHATSAPP\n`;
        csv += `Keterangan${sep}Jumlah\n`;
        csv += `Total Pesanan${sep}${pesananWA.length}\n`;
        csv += `Sudah Lunas${sep}${pesananWA.filter(p => p.status_bayar === 'LUNAS').length}\n`;
        csv += `Sudah Selesai${sep}${pesananWA.filter(p => p.status_antar === 'SELESAI').length}\n`;

        // BOM untuk kompatibilitas Excel
        const BOM = '\uFEFF';
        const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Laporan_SITARA_${now.replace(/\//g, '-')}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Laporan berhasil diunduh!');
    };

    // Kosongkan semua data laporan (transaksi, setoran, pesanan)
    const handleReset = async () => {
        if (!window.confirm('PERINGATAN!\n\nAnda akan menghapus SEMUA data:\n- Transaksi stand\n- Setoran\n\nData pesanan WA TIDAK akan dihapus.\nStok per stand akan di-reset ke 0.\n\nApakah Anda yakin?')) return;
        if (!window.confirm('Konfirmasi sekali lagi: Hapus semua data transaksi dan reset stok?')) return;

        try {
            // Hapus semua transaksi stand
            const txSnap = await getDocs(collection(db, 'transaksi_stand'));
            for (const d of txSnap.docs) {
                await deleteDoc(doc(db, 'transaksi_stand', d.id));
            }
            // Hapus semua setoran
            const setSnap = await getDocs(collection(db, 'setoran'));
            for (const d of setSnap.docs) {
                await deleteDoc(doc(db, 'setoran', d.id));
            }
            // Reset stok per stand ke 0
            const stokSnap = await getDocs(collection(db, 'stok_per_stand'));
            const batch = writeBatch(db);
            stokSnap.docs.forEach(d => {
                batch.update(doc(db, 'stok_per_stand', d.id), {
                    stok_diterima: 0,
                    stok_masuk_transfer: 0,
                    stok_keluar_transfer: 0,
                    stok_terjual: 0,
                    stok_sisa: 0,
                });
            });
            await batch.commit();
            toast.success('Semua data transaksi & stok berhasil di-reset!');
        } catch (e) {
            toast.error('Gagal reset: ' + e.message);
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">Laporan & Rekapitulasi</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Ringkasan keuangan dan stok keseluruhan</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleDownload} className="btn-primary">
                        <Download size={16} /> Simpan CSV
                    </button>
                    <button onClick={() => window.print()} className="btn-secondary">
                        <Printer size={16} /> Cetak
                    </button>
                    <button onClick={handleReset} className="px-4 py-2 rounded-xl text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30 transition-all flex items-center gap-2">
                        <Trash2 size={16} /> Kosongkan
                    </button>
                </div>
            </div>

            {/* Ringkasan Keuangan */}
            <div className="card">
                <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                    <DollarSign size={18} className="text-primary-400" /> Ringkasan Keuangan
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                        { label: 'Uang dari Stand', value: totalUangStand, color: 'text-primary-400' },
                        { label: 'Uang dari WA', value: uangWA, color: 'text-blue-400' },
                        { label: 'Total Pendapatan', value: totalUang, color: 'text-emerald-400' },
                        { label: 'Total Disetor', value: totalSetor, color: 'text-purple-400' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-surface-700 rounded-xl p-3">
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className={`font-bold text-base ${color}`}>{formatRupiah(value)}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rekap Stok */}
            <div className="card">
                <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                    <Package size={18} className="text-primary-400" /> Rekap Stok per Stand
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-600 bg-surface-700">
                                <th className="table-header text-left">Stand</th>
                                <th className="table-header text-right">Diterima</th>
                                <th className="table-header text-right">Masuk</th>
                                <th className="table-header text-right">Keluar</th>
                                <th className="table-header text-right">Terjual</th>
                                <th className="table-header text-right">Sisa</th>
                                <th className="table-header text-right">Uang (Rp)</th>
                                <th className="table-header text-right">Setor (Rp)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {standStats.map(s => (
                                <tr key={s.id} className="table-row">
                                    <td className="table-cell font-semibold text-white">{getDukuhName(s.id)}</td>
                                    <td className="table-cell text-right">{s.stok_awal}</td>
                                    <td className="table-cell text-right text-emerald-400">{s.stok_masuk}</td>
                                    <td className="table-cell text-right text-red-400">{s.stok_keluar}</td>
                                    <td className="table-cell text-right text-primary-400 font-bold">{s.stok_terjual}</td>
                                    <td className="table-cell text-right font-bold text-white">{s.stok_sisa}</td>
                                    <td className="table-cell text-right text-emerald-400">{formatRupiah(s.uang_stand)}</td>
                                    <td className="table-cell text-right text-purple-400">{formatRupiah(s.total_setor)}</td>
                                </tr>
                            ))}
                            <tr className="border-t-2 border-primary-500/30 bg-surface-700/50">
                                <td className="table-cell font-bold text-primary-400">TOTAL</td>
                                <td className="table-cell text-right font-bold">{standStats.reduce((a, s) => a + s.stok_awal, 0)}</td>
                                <td className="table-cell text-right font-bold text-emerald-400">{standStats.reduce((a, s) => a + s.stok_masuk, 0)}</td>
                                <td className="table-cell text-right font-bold text-red-400">{standStats.reduce((a, s) => a + s.stok_keluar, 0)}</td>
                                <td className="table-cell text-right font-bold text-primary-400">{totalTerjual}</td>
                                <td className="table-cell text-right font-bold text-white">{standStats.reduce((a, s) => a + s.stok_sisa, 0)}</td>
                                <td className="table-cell text-right font-bold text-emerald-400">{formatRupiah(totalUangStand)}</td>
                                <td className="table-cell text-right font-bold text-purple-400">{formatRupiah(totalSetor)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Info rekap WA */}
            <div className="card">
                <h2 className="text-base font-semibold text-white mb-3">Pesanan WhatsApp</h2>
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Total Pesanan', value: pesananWA.length, color: '' },
                        { label: 'Sudah Lunas', value: pesananWA.filter(p => p.status_bayar === 'LUNAS').length, color: 'text-emerald-400' },
                        { label: 'Sudah Selesai', value: pesananWA.filter(p => p.status_antar === 'SELESAI').length, color: 'text-blue-400' },
                    ].map(({ label, value, color }) => (
                        <div key={label} className="bg-surface-700 rounded-xl p-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                            <p className={`font-bold text-xl ${color || 'text-white'}`}>{value}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
