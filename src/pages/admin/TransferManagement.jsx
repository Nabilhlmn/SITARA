import { useState, useEffect } from 'react';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc,
    serverTimestamp, runTransaction, getFirestore
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { STANDS, getDukuhName } from '../../constants/dukuh';
import Modal from '../../components/Modal';
import { ArrowLeftRight, Plus, Eye, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['MENUNGGU', 'DIKIRIM', 'DITERIMA', 'SELESAI', 'BATAL'];

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

export default function TransferManagement() {
    const { user } = useAuth();
    const [transfers, setTransfers] = useState([]);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDari, setFilterDari] = useState('');
    const [filterKe, setFilterKe] = useState('');
    const [showCreate, setShowCreate] = useState(false);
    const [showDetail, setShowDetail] = useState(null);
    const [form, setForm] = useState({ dari_stand_id: 'dukuh1', ke_stand_id: 'dukuh2', jumlah_kantong: '', catatan: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'transfer_stok'), orderBy('created_at', 'desc')),
            (snap) => setTransfers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        return unsub;
    }, []);

    const handleCreate = async () => {
        if (!form.jumlah_kantong || form.dari_stand_id === form.ke_stand_id) {
            toast.error('Isi semua field. Stand asal dan tujuan harus berbeda.');
            return;
        }
        setSaving(true);
        try {
            const jumlah = Number(form.jumlah_kantong);
            // Use Firestore Transaction for atomic stock update
            await runTransaction(db, async (transaction) => {
                const docDari = doc(db, 'stok_per_stand', form.dari_stand_id);
                const docKe = doc(db, 'stok_per_stand', form.ke_stand_id);
                const snapDari = await transaction.get(docDari);
                const snapKe = await transaction.get(docKe);

                if (!snapDari.exists()) throw new Error('Data stand asal tidak ditemukan');
                const stokDari = snapDari.data().stok_sisa || 0;
                if (stokDari < jumlah) throw new Error(`Stok stand asal hanya ${stokDari} kantong`);

                const stokKe = snapKe.exists() ? (snapKe.data().stok_sisa || 0) : 0;

                transaction.update(docDari, {
                    stok_sisa: stokDari - jumlah,
                    stok_keluar_transfer: (snapDari.data().stok_keluar_transfer || 0) + jumlah,
                    last_updated: serverTimestamp(),
                });
                transaction.set(docKe, {
                    stand_id: form.ke_stand_id,
                    stok_sisa: stokKe + jumlah,
                    stok_masuk_transfer: (snapKe.exists() ? (snapKe.data().stok_masuk_transfer || 0) : 0) + jumlah,
                    stok_diterima: snapKe.exists() ? (snapKe.data().stok_diterima || 0) : 0,
                    stok_keluar_transfer: snapKe.exists() ? (snapKe.data().stok_keluar_transfer || 0) : 0,
                    stok_terjual: snapKe.exists() ? (snapKe.data().stok_terjual || 0) : 0,
                    last_updated: serverTimestamp(),
                }, { merge: true });
                const transferRef = doc(collection(db, 'transfer_stok'));
                transaction.set(transferRef, {
                    nomor_transfer: `TR${Date.now()}`,
                    dari_stand_id: form.dari_stand_id,
                    ke_stand_id: form.ke_stand_id,
                    jumlah_kantong: jumlah,
                    status: 'SELESAI',
                    catatan: form.catatan,
                    dibuat_oleh: user?.uid || '',
                    dikonfirmasi_oleh: user?.uid || '',
                    created_at: serverTimestamp(),
                    diterima_at: serverTimestamp(),
                });
            });
            toast.success('Transfer stok berhasil dibuat');
            setShowCreate(false);
            setForm({ dari_stand_id: 'dukuh1', ke_stand_id: 'dukuh2', jumlah_kantong: '', catatan: '' });
        } catch (e) {
            toast.error(e.message);
        }
        setSaving(false);
    };

    const updateStatus = async (id, status) => {
        try {
            // Jika admin meng-acc transfer (DIKIRIM -> stok harus berubah)
            const transfer = transfers.find(t => t.id === id);
            if (!transfer) { toast.error('Transfer tidak ditemukan'); return; }

            // Jika status menjadi DIKIRIM (acc oleh admin) dan stok belum dipindahkan
            if (status === 'DIKIRIM' && transfer.status === 'MENUNGGU') {
                await runTransaction(db, async (transaction) => {
                    const docDari = doc(db, 'stok_per_stand', transfer.dari_stand_id);
                    const docKe = doc(db, 'stok_per_stand', transfer.ke_stand_id);
                    const snapDari = await transaction.get(docDari);
                    const snapKe = await transaction.get(docKe);

                    const stokDari = snapDari.exists() ? (snapDari.data().stok_sisa || 0) : 0;
                    if (stokDari < transfer.jumlah_kantong) throw new Error(`Stok stand asal hanya ${stokDari} kantong`);
                    const stokKe = snapKe.exists() ? (snapKe.data().stok_sisa || 0) : 0;

                    transaction.update(docDari, {
                        stok_sisa: stokDari - transfer.jumlah_kantong,
                        stok_keluar_transfer: (snapDari.data().stok_keluar_transfer || 0) + transfer.jumlah_kantong,
                        last_updated: serverTimestamp(),
                    });
                    transaction.set(docKe, {
                        stand_id: transfer.ke_stand_id,
                        stok_sisa: stokKe + transfer.jumlah_kantong,
                        stok_masuk_transfer: (snapKe.exists() ? (snapKe.data().stok_masuk_transfer || 0) : 0) + transfer.jumlah_kantong,
                        stok_diterima: snapKe.exists() ? (snapKe.data().stok_diterima || 0) : 0,
                        stok_keluar_transfer: snapKe.exists() ? (snapKe.data().stok_keluar_transfer || 0) : 0,
                        stok_terjual: snapKe.exists() ? (snapKe.data().stok_terjual || 0) : 0,
                        last_updated: serverTimestamp(),
                    }, { merge: true });

                    transaction.update(doc(db, 'transfer_stok', id), {
                        status,
                        updated_at: serverTimestamp(),
                        dikonfirmasi_oleh: user?.uid || '',
                    });
                });
            } else {
                await updateDoc(doc(db, 'transfer_stok', id), { status, updated_at: serverTimestamp() });
            }
            toast.success(`Status diubah ke ${status}`);
        } catch (e) {
            toast.error(e.message);
        }
    };

    const delTransfer = async (id) => {
        if (!window.confirm('Hapus riwayat transfer ini?')) return;
        try {
            await deleteDoc(doc(db, 'transfer_stok', id));
            toast.success('Transfer berhasil dihapus');
        } catch (e) {
            toast.error(e.message);
        }
    };

    const filtered = transfers.filter(t =>
        (!filterStatus || t.status === filterStatus) &&
        (!filterDari || t.dari_stand_id === filterDari) &&
        (!filterKe || t.ke_stand_id === filterKe)
    );

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manajemen Transfer Stok</h1>
                    <p className="text-gray-400 text-sm mt-0.5">{transfers.length} transfer total</p>
                </div>
                <button onClick={() => setShowCreate(true)} className="btn-primary">
                    <Plus size={18} /> Buat Transfer
                </button>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-3">
                <select className="input-field w-auto py-2" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="">Semua Status</option>
                    {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="input-field w-auto py-2" value={filterDari} onChange={e => setFilterDari(e.target.value)}>
                    <option value="">Dari: Semua</option>
                    {STANDS.map(s => <option key={s} value={s}>{getDukuhName(s)}</option>)}
                </select>
                <select className="input-field w-auto py-2" value={filterKe} onChange={e => setFilterKe(e.target.value)}>
                    <option value="">Ke: Semua</option>
                    {STANDS.map(s => <option key={s} value={s}>{getDukuhName(s)}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-600 bg-surface-700">
                                <th className="table-header text-left">No Transfer</th>
                                <th className="table-header text-left">Dari</th>
                                <th className="table-header text-left">Ke</th>
                                <th className="table-header text-right">Kantong</th>
                                <th className="table-header text-center">Status</th>
                                <th className="table-header text-center">Catatan</th>
                                <th className="table-header text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-gray-500 py-12">Belum ada data transfer</td></tr>
                            ) : filtered.map(t => (
                                <tr key={t.id} className="table-row">
                                    <td className="table-cell font-mono text-primary-400 text-xs">{t.nomor_transfer?.slice(-8) || t.id.slice(0, 8)}</td>
                                    <td className="table-cell font-medium">{getDukuhName(t.dari_stand_id)}</td>
                                    <td className="table-cell">{getDukuhName(t.ke_stand_id)}</td>
                                    <td className="table-cell text-right font-bold text-white">{t.jumlah_kantong}</td>
                                    <td className="table-cell text-center"><StatusBadge status={t.status} /></td>
                                    <td className="table-cell text-center text-xs text-gray-400 max-w-24 truncate">{t.catatan || '-'}</td>
                                    <td className="table-cell text-right">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => setShowDetail(t)} className="p-2 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors">
                                                <Eye size={15} />
                                            </button>
                                            <button onClick={() => delTransfer(t.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Buat Transfer Stok Baru">
                <div className="space-y-4">
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-sm text-yellow-400">
                        ⚡ Transfer admin langsung SELESAI dan stok berubah seketika
                    </div>
                    <div>
                        <label className="label">Stand Asal</label>
                        <select className="input-field" value={form.dari_stand_id} onChange={e => setForm(f => ({ ...f, dari_stand_id: e.target.value }))}>
                            {STANDS.map(s => <option key={s} value={s}>{getDukuhName(s)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Stand Tujuan</label>
                        <select className="input-field" value={form.ke_stand_id} onChange={e => setForm(f => ({ ...f, ke_stand_id: e.target.value }))}>
                            {STANDS.map(s => <option key={s} value={s}>{getDukuhName(s)}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="label">Jumlah Kantong</label>
                        <input className="input-field text-xl font-bold" type="number" min={1} value={form.jumlah_kantong} onChange={e => setForm(f => ({ ...f, jumlah_kantong: e.target.value }))} placeholder="0" />
                    </div>
                    <div>
                        <label className="label">Catatan (opsional)</label>
                        <input className="input-field" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Transfer darurat malam takbiran..." />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Batal</button>
                        <button onClick={handleCreate} disabled={saving} className="btn-primary flex-1">
                            {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Buat Transfer'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Detail Modal */}
            <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="Detail Transfer">
                {showDetail && (
                    <div className="space-y-3">
                        {[
                            ['No Transfer', showDetail.nomor_transfer],
                            ['Dari Stand', getDukuhName(showDetail.dari_stand_id)],
                            ['Ke Stand', getDukuhName(showDetail.ke_stand_id)],
                            ['Jumlah', `${showDetail.jumlah_kantong} kantong`],
                            ['Status', <StatusBadge key="s" status={showDetail.status} />],
                            ['Catatan', showDetail.catatan || '-'],
                        ].map(([label, value]) => (
                            <div key={label} className="flex justify-between py-2 border-b border-surface-600">
                                <span className="text-gray-400 text-sm">{label}</span>
                                <span className="text-white text-sm font-medium">{value}</span>
                            </div>
                        ))}
                        {showDetail.status === 'MENUNGGU' && (
                            <div className="flex gap-3 pt-2">
                                <button onClick={() => { updateStatus(showDetail.id, 'BATAL'); setShowDetail(null); }} className="btn-danger flex-1">
                                    <XCircle size={16} /> Batalkan
                                </button>
                                <button onClick={() => { updateStatus(showDetail.id, 'DIKIRIM'); setShowDetail(null); }} className="btn-success flex-1">
                                    <CheckCircle size={16} /> Kirim
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
