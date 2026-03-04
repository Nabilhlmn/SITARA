import { useState, useEffect } from 'react';
import {
    collection, doc, onSnapshot, addDoc, runTransaction, serverTimestamp, query, getDocs, orderBy, where
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { Minus, Plus, RotateCcw, ShoppingCart, Clock, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import Modal from '../../components/Modal';
import { getDukuhName } from '../../constants/dukuh';

function formatRupiah(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

export default function PetugasKasir() {
    const { userProfile } = useAuth();
    const standId = userProfile?.stand_id || '';
    const [produk, setProduk] = useState(null);
    const [stok, setStok] = useState(0);
    const [harga, setHarga] = useState(65000);
    const [qty, setQty] = useState(1);
    const [uangBayar, setUangBayar] = useState('');
    const [saving, setSaving] = useState(false);
    const [lastTx, setLastTx] = useState(null);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const unsubP = onSnapshot(collection(db, 'master_produk'), (snap) => {
            if (!snap.empty) {
                const d = snap.docs[0];
                setProduk({ id: d.id, ...d.data() });
                setHarga(d.data().harga || 65000);
            }
        });
        const unsubStok = onSnapshot(doc(db, 'stok_per_stand', standId || 'unknown'), (snap) => {
            if (snap.exists()) setStok(snap.data().stok_sisa || 0);
        });

        // Fetch history hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const unsubTx = standId ? onSnapshot(
            query(collection(db, 'transaksi_stand'), where('stand_id', '==', standId)),
            (snap) => {
                const data = snap.docs
                    .map(d => ({ id: d.id, ...d.data() }))
                    .filter(d => d.created_at?.toDate() >= today)
                    .sort((a, b) => (b.created_at?.toDate() || 0) - (a.created_at?.toDate() || 0));
                setHistory(data);
            }
        ) : () => { };

        return () => { unsubP(); unsubStok(); unsubTx(); };
    }, [standId]);

    const total = qty * harga;
    const kembalian = (Number(uangBayar) || 0) - total;

    const handleProses = async () => {
        if (qty <= 0) { toast.error('Jumlah kantong harus lebih dari 0'); return; }
        if (qty > stok) { toast.error(`Stok tidak cukup! Sisa stok: ${stok} kantong`); return; }
        if (Number(uangBayar) < total) { toast.error('Uang bayar kurang dari total'); return; }
        setSaving(true);
        try {
            await runTransaction(db, async (transaction) => {
                const stokRef = doc(db, 'stok_per_stand', standId);
                const snap = await transaction.get(stokRef);
                const currentStok = snap.exists() ? (snap.data().stok_sisa || 0) : 0;
                if (currentStok < qty) throw new Error(`Stok hanya ${currentStok} kantong`);

                transaction.update(stokRef, {
                    stok_sisa: currentStok - qty,
                    stok_terjual: (snap.data().stok_terjual || 0) + qty,
                    last_updated: serverTimestamp(),
                });

                const txRef = doc(collection(db, 'transaksi_stand'));
                transaction.set(txRef, {
                    nomor_transaksi: `S${standId}-${Date.now()}`,
                    stand_id: standId,
                    jumlah_kantong: qty,
                    total_harga: total,
                    uang_dibayar: Number(uangBayar),
                    uang_kembali: kembalian,
                    created_by: userProfile?.uid || '',
                    created_at: serverTimestamp(),
                });
                return txRef;
            });
            setLastTx({ qty, total, uangBayar: Number(uangBayar), kembalian });
            setQty(1);
            setUangBayar('');
            toast.success('Transaksi berhasil!');
        } catch (e) {
            toast.error(e.message);
        }
        setSaving(false);
    };

    const handleBatal = () => { setQty(1); setUangBayar(''); setLastTx(null); };

    return (
        <div className="min-h-full bg-surface-900 flex flex-col items-center justify-start p-4">
            {/* Stand info */}
            <div className="w-full max-w-sm mb-4 text-center">
                <p className="text-gray-500 text-sm uppercase tracking-widest">Stand</p>
                <h2 className="text-xl font-bold text-primary-400">{getDukuhName(standId) || 'Belum ada stand'}</h2>
                <div className="flex justify-center gap-2 mt-2">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${stok <= 10 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                        <div className={`w-2 h-2 rounded-full ${stok <= 10 ? 'bg-red-400' : 'bg-emerald-400'}`} />
                        Stok: {stok}
                    </div>
                    <button onClick={() => setShowHistory(true)} className="inline-flex items-center gap-2 px-3 py-1 bg-surface-700 hover:bg-surface-600 rounded-full text-sm font-medium text-white transition-colors">
                        <Clock size={14} /> Riwayat
                    </button>
                </div>
            </div>

            {/* Success card */}
            {lastTx && (
                <div className="w-full max-w-sm mb-4 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
                    <p className="text-emerald-400 font-semibold text-center mb-2">✓ Transaksi Berhasil!</p>
                    <div className="text-sm space-y-1">
                        <div className="flex justify-between"><span className="text-gray-400">Kantong</span><span className="text-white font-bold">{lastTx.qty}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Total</span><span className="text-white font-bold">{formatRupiah(lastTx.total)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-400">Dibayar</span><span className="text-white">{formatRupiah(lastTx.uangBayar)}</span></div>
                        <div className="flex justify-between border-t border-emerald-500/20 pt-1 mt-1"><span className="text-gray-400">Kembalian</span><span className="text-emerald-400 font-bold text-lg">{formatRupiah(lastTx.kembalian)}</span></div>
                    </div>
                    <button onClick={handleBatal} className="w-full mt-3 btn-secondary py-2 text-sm">Transaksi Baru</button>
                </div>
            )}

            {/* Kasir Card */}
            {!lastTx && (
                <div className="w-full max-w-sm card">
                    <div className="text-center mb-6">
                        <p className="text-gray-400 text-sm font-medium">BERAS ZAKAT 2,7 KG</p>
                        <p className="text-primary-400 text-2xl font-bold">{formatRupiah(harga)}/kantong</p>
                    </div>

                    {/* Qty selector */}
                    <div className="flex items-center justify-between mb-6 bg-surface-700 rounded-2xl p-4">
                        <button
                            onClick={() => setQty(q => Math.max(1, q - 1))}
                            className="btn-kasir bg-surface-600 hover:bg-surface-500 text-white"
                        >
                            <Minus size={24} />
                        </button>
                        <div className="text-center">
                            <span className="text-6xl font-extrabold text-white">{qty}</span>
                            <p className="text-gray-400 text-sm">kantong</p>
                        </div>
                        <button
                            onClick={() => setQty(q => Math.min(stok, q + 1))}
                            className="btn-kasir bg-primary-500 hover:bg-primary-400 text-black"
                        >
                            <Plus size={24} />
                        </button>
                    </div>

                    {/* Quick qty buttons */}
                    <div className="grid grid-cols-5 gap-2 mb-6">
                        {[1, 2, 3, 5, 10].map(n => (
                            <button
                                key={n}
                                onClick={() => setQty(Math.min(n, stok))}
                                className={`py-3 rounded-xl font-bold text-lg transition-all active:scale-90 ${qty === n ? 'bg-primary-500 text-black' : 'bg-surface-700 text-white hover:bg-surface-600'}`}
                            >
                                {n}
                            </button>
                        ))}
                    </div>

                    {/* Total */}
                    <div className="bg-surface-700 rounded-2xl p-4 mb-4">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 font-medium">Total</span>
                            <span className="text-2xl font-extrabold text-primary-400">{formatRupiah(total)}</span>
                        </div>
                    </div>

                    {/* Uang bayar */}
                    <div className="mb-2">
                        <label className="label text-base">Uang Bayar (Rp)</label>
                        <input
                            type="number"
                            className="input-field text-xl font-bold text-center"
                            placeholder="0"
                            value={uangBayar}
                            onChange={e => setUangBayar(e.target.value)}
                        />
                    </div>

                    {/* Kembalian */}
                    {uangBayar && (
                        <div className={`flex justify-between items-center px-4 py-3 rounded-xl mb-4 ${kembalian < 0 ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'}`}>
                            <span className="text-gray-300 font-medium">Kembalian</span>
                            <span className={`text-xl font-extrabold ${kembalian < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                {kembalian < 0 ? '-' : ''}{formatRupiah(Math.abs(kembalian))}
                            </span>
                        </div>
                    )}

                    {/* Quick amount buttons */}
                    <div className="grid grid-cols-3 gap-2 mb-5">
                        {[50000, 100000, 200000].map(n => (
                            <button
                                key={n}
                                onClick={() => setUangBayar(String(n))}
                                className="py-3 rounded-xl font-semibold text-sm bg-surface-700 hover:bg-surface-600 text-white transition-all active:scale-95"
                            >
                                {formatRupiah(n)}
                            </button>
                        ))}
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleBatal} className="btn-secondary py-5 text-base">
                            <RotateCcw size={18} /> Reset
                        </button>
                        <button
                            onClick={handleProses}
                            disabled={saving || !uangBayar || kembalian < 0}
                            className="btn-primary py-5 text-xl font-bold"
                        >
                            {saving
                                ? <div className="w-6 h-6 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                : <><ShoppingCart size={20} /> PROSES</>
                            }
                        </button>
                    </div>
                </div>
            )}

            <Modal isOpen={showHistory} onClose={() => setShowHistory(false)} title="Riwayat Hari Ini">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-surface-700 p-3 rounded-xl border border-surface-600">
                            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><TrendingUp size={12} /> Terjual</p>
                            <p className="text-lg font-bold text-white">{history.reduce((a, b) => a + b.jumlah_kantong, 0)} kantong</p>
                        </div>
                        <div className="bg-primary-500/10 p-3 rounded-xl border border-primary-500/20">
                            <p className="text-xs text-primary-400 mb-1">Pendapatan</p>
                            <p className="text-lg font-bold text-primary-400">{formatRupiah(history.reduce((a, b) => a + b.total_harga, 0))}</p>
                        </div>
                    </div>

                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {history.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">Belum ada transaksi hari ini</p>
                        ) : history.map(h => (
                            <div key={h.id} className="bg-surface-800 p-3 rounded-xl border border-surface-600 flex justify-between items-center">
                                <div>
                                    <p className="text-white font-medium">{h.jumlah_kantong} Kantong</p>
                                    <p className="text-xs text-gray-500">{h.created_at?.toDate().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-emerald-400 font-bold">{formatRupiah(h.total_harga)}</p>
                                    <p className="text-xs text-gray-400 text-mono">{h.nomor_transaksi}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Modal>
        </div>
    );
}
