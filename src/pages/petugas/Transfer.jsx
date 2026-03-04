import { useState, useEffect } from 'react';
import {
    collection, query, where, orderBy, onSnapshot, addDoc, updateDoc,
    doc, serverTimestamp, runTransaction, or, getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { STANDS, getDukuhName } from '../../constants/dukuh';
import Modal from '../../components/Modal';
import { ArrowLeftRight, Plus, CheckCircle, XCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';

// STANDS diimport dari constants/dukuh.js

function StatusBadge({ status }) {
    const map = {
        MENUNGGU: 'status-badge-menunggu',
        DIKIRIM: 'status-badge-dikirim',
        DITERIMA: 'status-badge-diterima',
        SELESAI: 'status-badge-selesai',
        BATAL: 'status-badge-batal',
    };
    return <span className={map[status] || 'badge bg-gray-500/20 text-gray-400'}>{status}</span>;
}

export default function PetugasTransfer() {
    const { userProfile, user } = useAuth();
    const standId = userProfile?.stand_id || '';
    const [transfers, setTransfers] = useState([]);
    const [stok, setStok] = useState(0);
    const [tab, setTab] = useState('masuk');
    const [showAjukan, setShowAjukan] = useState(false);
    const [form, setForm] = useState({ ke_stand_id: '', jumlah_kantong: '', catatan: '' });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!standId) return;
        // Listen to all transfers involving this stand
        const unsub = onSnapshot(
            query(collection(db, 'transfer_stok'), orderBy('created_at', 'desc')),
            (snap) => {
                const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const mine = all.filter(t => t.dari_stand_id === standId || t.ke_stand_id === standId);
                setTransfers(mine);
                setLoading(false);
            }
        );
        // Stok saya
        const unsubStok = onSnapshot(doc(db, 'stok_per_stand', standId), (snap) => {
            if (snap.exists()) setStok(snap.data().stok_sisa || 0);
        });
        return () => { unsub(); unsubStok(); };
    }, [standId]);

    const masuk = transfers.filter(t => t.ke_stand_id === standId);
    const keluar = transfers.filter(t => t.dari_stand_id === standId);

    const handleAjukan = async () => {
        if (!form.ke_stand_id || !form.jumlah_kantong) {
            toast.error('Isi stand tujuan dan jumlah kantong');
            return;
        }
        if (form.ke_stand_id === standId) {
            toast.error('Stand tujuan tidak boleh sama dengan stand sendiri');
            return;
        }
        setSaving(true);
        try {
            await addDoc(collection(db, 'transfer_stok'), {
                nomor_transfer: `TR${Date.now()}`,
                dari_stand_id: standId,
                ke_stand_id: form.ke_stand_id,
                jumlah_kantong: Number(form.jumlah_kantong),
                status: 'MENUNGGU',
                catatan: form.catatan || 'Permintaan dari petugas',
                dibuat_oleh: user?.uid || '',
                dikonfirmasi_oleh: '',
                created_at: serverTimestamp(),
                diterima_at: null,
            });
            toast.success('Permintaan transfer berhasil dikirim');
            setShowAjukan(false);
            setForm({ ke_stand_id: '', jumlah_kantong: '', catatan: '' });
        } catch (e) {
            toast.error(e.message);
        }
        setSaving(false);
    };

    // Petugas tujuan: konfirmasi terima → update stok atomik
    const handleTerima = async (transfer) => {
        setSaving(true);
        try {
            await runTransaction(db, async (transaction) => {
                const docDari = doc(db, 'stok_per_stand', transfer.dari_stand_id);
                const docKe = doc(db, 'stok_per_stand', standId);

                const snapDari = await transaction.get(docDari);
                const snapKe = await transaction.get(docKe);

                const stokDari = snapDari.exists() ? (snapDari.data().stok_sisa || 0) : 0;
                if (stokDari < transfer.jumlah_kantong) throw new Error(`Stok stand asal hanya ${stokDari} kantong`);
                const stokKe = snapKe.exists() ? (snapKe.data().stok_sisa || 0) : 0;

                if (snapDari.exists()) {
                    transaction.update(docDari, {
                        stok_sisa: stokDari - transfer.jumlah_kantong,
                        stok_keluar_transfer: (snapDari.data().stok_keluar_transfer || 0) + transfer.jumlah_kantong,
                        last_updated: serverTimestamp(),
                    });
                }
                transaction.set(docKe, {
                    stand_id: standId,
                    stok_sisa: stokKe + transfer.jumlah_kantong,
                    stok_masuk_transfer: (snapKe.exists() ? (snapKe.data().stok_masuk_transfer || 0) : 0) + transfer.jumlah_kantong,
                    stok_diterima: snapKe.exists() ? (snapKe.data().stok_diterima || 0) : 0,
                    stok_keluar_transfer: snapKe.exists() ? (snapKe.data().stok_keluar_transfer || 0) : 0,
                    stok_terjual: snapKe.exists() ? (snapKe.data().stok_terjual || 0) : 0,
                    last_updated: serverTimestamp(),
                }, { merge: true });

                transaction.update(doc(db, 'transfer_stok', transfer.id), {
                    status: 'SELESAI',
                    dikonfirmasi_oleh: user?.uid || '',
                    diterima_at: serverTimestamp(),
                });
            });
            toast.success('Transfer diterima! Stok berhasil diperbarui');
        } catch (e) {
            toast.error(e.message);
        }
        setSaving(false);
    };

    const handleTolak = async (id) => {
        await updateDoc(doc(db, 'transfer_stok', id), { status: 'BATAL', updated_at: serverTimestamp() });
        toast.success('Transfer dibatalkan');
    };

    return (
        <div className="p-4 space-y-4 max-w-xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white flex items-center gap-2">
                        <ArrowLeftRight size={22} className="text-primary-400" /> Transfer Stok
                    </h1>
                    <p className="text-gray-400 text-sm capitalize">Stok saya: <span className={`font-bold ${stok <= 10 ? 'text-red-400' : 'text-emerald-400'}`}>{stok} kantong</span></p>
                </div>
                <button onClick={() => setShowAjukan(true)} className="btn-primary py-2 px-4">
                    <Plus size={18} /> Ajukan
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[['masuk', `Masuk (${masuk.filter(t => t.status === 'MENUNGGU').length})`], ['keluar', 'Keluar'], ['semua', 'Semua']].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === k ? 'bg-primary-500 text-black' : 'bg-surface-700 text-gray-400 hover:text-white'}`}>{l}</button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center py-8 text-gray-500">Memuat...</div>
            ) : (
                <div className="space-y-3">
                    {(tab === 'masuk' ? masuk : tab === 'keluar' ? keluar : transfers).length === 0 ? (
                        <div className="card text-center py-10 text-gray-500">Tidak ada data transfer</div>
                    ) : (tab === 'masuk' ? masuk : tab === 'keluar' ? keluar : transfers).map(t => (
                        <div key={t.id} className="card space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {t.ke_stand_id === standId
                                            ? <span className="badge bg-emerald-500/20 text-emerald-400 text-xs">MASUK</span>
                                            : <span className="badge bg-blue-500/20 text-blue-400 text-xs">KELUAR</span>
                                        }
                                        <StatusBadge status={t.status} />
                                    </div>
                                    <p className="text-white font-bold text-lg">{t.jumlah_kantong} kantong</p>
                                    <p className="text-sm text-gray-400">
                                        {t.ke_stand_id === standId
                                            ? `Dari: ${getDukuhName(t.dari_stand_id)}`
                                            : `Ke: ${getDukuhName(t.ke_stand_id)}`}
                                    </p>
                                    {t.catatan && <p className="text-xs text-gray-500 mt-1">{t.catatan}</p>}
                                </div>
                            </div>
                            {/* Actions for incoming MENUNGGU */}
                            {t.ke_stand_id === standId && t.status === 'MENUNGGU' && (
                                <div className="flex gap-3">
                                    <button onClick={() => handleTolak(t.id)} disabled={saving} className="btn-danger flex-1 py-2.5 text-sm">
                                        <XCircle size={16} /> Tolak
                                    </button>
                                    <button onClick={() => handleTerima(t)} disabled={saving} className="btn-success flex-1 py-2.5 text-sm">
                                        <CheckCircle size={16} /> Terima
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Ajukan Modal */}
            <Modal isOpen={showAjukan} onClose={() => setShowAjukan(false)} title="Ajukan Transfer Stok">
                <div className="space-y-4">
                    <div className="p-3 bg-surface-700 rounded-xl">
                        <p className="text-xs text-gray-500">Stand Saya (Pengirim)</p>
                        <p className="font-bold text-white capitalize mt-0.5">{getDukuhName(standId)}</p>
                        <p className="text-xs text-gray-400 mt-0.5">Stok saat ini: <span className={stok <= 10 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>{stok} kantong</span></p>
                    </div>
                    <div>
                        <label className="label">Stand Tujuan (Penerima)</label>
                        <select className="input-field" value={form.ke_stand_id} onChange={e => setForm(f => ({ ...f, ke_stand_id: e.target.value }))}>
                            <option value="">Pilih stand...</option>
                            {STANDS.filter(s => s !== standId).map(s => <option key={s} value={s}>{getDukuhName(s)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Jumlah Kantong yang Dikirim</label>
                        <input className="input-field text-xl font-bold" type="number" min={1} max={stok} value={form.jumlah_kantong} onChange={e => setForm(f => ({ ...f, jumlah_kantong: e.target.value }))} placeholder="0" />
                        <p className="text-xs text-gray-500 mt-1">Maks: {stok} kantong</p>
                    </div>
                    <div>
                        <label className="label">Alasan / Catatan</label>
                        <input className="input-field" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Contoh: Stok habis, butuh tambahan segera" />
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button onClick={() => setShowAjukan(false)} className="btn-secondary flex-1">Batal</button>
                        <button onClick={handleAjukan} disabled={saving} className="btn-primary flex-1">
                            {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : <><Send size={16} /> Kirim</>}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
