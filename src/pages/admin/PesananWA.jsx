import { useState, useEffect } from 'react';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, runTransaction, getDocs
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { STANDS, getDukuhName } from '../../constants/dukuh';
import Modal from '../../components/Modal';
import { ShoppingBag, Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

function formatRupiah(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

const STATUS_BAYAR = ['LUNAS', 'DP', 'BELUM BAYAR'];
const STATUS_ANTAR = ['MENUNGGU', 'DIANTAR', 'SELESAI'];

function StatusBadgeBayar({ status }) {
    return <span className={status === 'LUNAS' ? 'status-badge-lunas' : 'status-badge-dp'}>{status}</span>;
}
function StatusBadgeAntar({ status }) {
    const map = { MENUNGGU: 'status-badge-menunggu', DIANTAR: 'status-badge-diantar', SELESAI: 'status-badge-selesai' };
    return <span className={map[status] || 'badge bg-gray-500/20 text-gray-400'}>{status}</span>;
}

export default function AdminPesananWA() {
    const [pesanan, setPesanan] = useState([]);
    const [search, setSearch] = useState('');
    const [filterBayar, setFilterBayar] = useState('');
    const [filterAntar, setFilterAntar] = useState('');
    const [filterDukuh, setFilterDukuh] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [harga, setHarga] = useState(65000);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'pesanan_wa'), orderBy('created_at', 'desc')),
            (snap) => setPesanan(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        const unsubP = onSnapshot(collection(db, 'master_produk'), (s) => {
            if (!s.empty) setHarga(s.docs[0].data().harga || 65000);
        });
        return () => { unsub(); unsubP(); };
    }, []);

    const handle = (k) => (e) => {
        const val = e.target.value;
        setForm(f => {
            const next = { ...f, [k]: val };
            if (k === 'jumlah_kantong') next.total_harga = (Number(val) || 0) * harga;
            return next;
        });
    };

    const openCreate = () => {
        setEditItem(null);
        setForm({ nama_pembeli: '', dukuh_id: 'dukuh1', jumlah_kantong: 1, total_harga: harga, status_bayar: 'LUNAS', status_antar: 'MENUNGGU', catatan: '' });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditItem(item);
        setForm({ ...item });
        setShowModal(true);
    };

    const save = async () => {
        if (!form.nama_pembeli || !form.jumlah_kantong) { toast.error('Isi semua field wajib'); return; }
        setSaving(true);
        try {
            if (editItem) {
                const oldQty = Number(editItem.jumlah_kantong || 0);
                const newQty = Number(form.jumlah_kantong || 0);
                const diff = newQty - oldQty;

                if (diff !== 0) {
                    // Jika jumlah berubah, sesuaikan stok pusat
                    const mainP = await getDocs(collection(db, 'master_produk'));
                    const pId = mainP.empty ? 'default' : mainP.docs[0].id;

                    await runTransaction(db, async (transaction) => {
                        const mpRef = doc(db, 'master_produk', pId);
                        const snapP = await transaction.get(mpRef);
                        const currentPStok = snapP.exists() ? (snapP.data().stok_tersedia || 0) : 0;

                        if (snapP.exists()) {
                            transaction.update(mpRef, {
                                stok_tersedia: Math.max(0, currentPStok - diff),
                                last_updated: serverTimestamp()
                            });
                        }

                        transaction.update(doc(db, 'pesanan_wa', editItem.id), {
                            ...form,
                            jumlah_kantong: newQty,
                            total_harga: Number(form.total_harga),
                            updated_at: serverTimestamp()
                        });
                    });
                } else {
                    await updateDoc(doc(db, 'pesanan_wa', editItem.id), { ...form, updated_at: serverTimestamp() });
                }
                toast.success('Pesanan diperbarui');
            } else {
                const count = pesanan.length + 1;
                const masterPRef = doc(db, 'master_produk', 'default');
                const mainP = await getDocs(collection(db, 'master_produk'));
                const pId = mainP.empty ? 'default' : mainP.docs[0].id;

                await runTransaction(db, async (transaction) => {
                    const mpRef = doc(db, 'master_produk', pId);
                    const snapP = await transaction.get(mpRef);
                    const currentPStok = snapP.exists() ? (snapP.data().stok_tersedia || 0) : 0;

                    if (snapP.exists()) {
                        transaction.update(mpRef, {
                            stok_tersedia: Math.max(0, currentPStok - Number(form.jumlah_kantong)),
                            stok_terpesan_wa: (snapP.data().stok_terpesan_wa || 0) + Number(form.jumlah_kantong),
                            last_updated: serverTimestamp()
                        });
                    }

                    const newOrderRef = doc(collection(db, 'pesanan_wa'));
                    transaction.set(newOrderRef, {
                        ...form,
                        jumlah_kantong: Number(form.jumlah_kantong),
                        total_harga: Number(form.total_harga),
                        nomor_pesanan: `P${String(count).padStart(3, '0')}`,
                        bukti_transfer_url: '',
                        created_at: serverTimestamp(),
                        updated_at: serverTimestamp(),
                    });
                });
                toast.success('Pesanan ditambahkan');
            }
            setShowModal(false);
        } catch (e) { toast.error(e.message); }
        setSaving(false);
    };

    const del = async (id) => {
        if (!window.confirm('Hapus pesanan ini?')) return;
        try {
            // Temukan pesanan yang akan dihapus untuk mengembalikan stok
            const pesananToDelete = pesanan.find(p => p.id === id);
            const qtyToReturn = Number(pesananToDelete?.jumlah_kantong || 0);

            if (qtyToReturn > 0) {
                const mainP = await getDocs(collection(db, 'master_produk'));
                const pId = mainP.empty ? 'default' : mainP.docs[0].id;

                await runTransaction(db, async (transaction) => {
                    const mpRef = doc(db, 'master_produk', pId);
                    const snapP = await transaction.get(mpRef);
                    const currentPStok = snapP.exists() ? (snapP.data().stok_tersedia || 0) : 0;

                    if (snapP.exists()) {
                        transaction.update(mpRef, {
                            stok_tersedia: currentPStok + qtyToReturn,
                            stok_terpesan_wa: Math.max(0, (snapP.data().stok_terpesan_wa || 0) - qtyToReturn),
                            last_updated: serverTimestamp()
                        });
                    }

                    transaction.delete(doc(db, 'pesanan_wa', id));
                });
            } else {
                await deleteDoc(doc(db, 'pesanan_wa', id));
            }
            toast.success('Pesanan dihapus');
        } catch (e) {
            toast.error(e.message);
        }
    };

    const filtered = pesanan.filter(p =>
        (!search || p.nama_pembeli?.toLowerCase().includes(search.toLowerCase())) &&
        (!filterBayar || p.status_bayar === filterBayar) &&
        (!filterAntar || p.status_antar === filterAntar) &&
        (!filterDukuh || p.dukuh_id === filterDukuh)
    );

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Pesanan WhatsApp</h1>
                    <p className="text-gray-400 text-sm mt-0.5">
                        {filterDukuh
                            ? `${filtered.length} pesanan • Total: ${formatRupiah(filtered.filter(x => x.status_bayar === 'LUNAS').reduce((a, b) => a + (b.total_harga || 0), 0))} (Lunas)`
                            : `${pesanan.length} pesanan total`}
                    </p>
                </div>
                <button onClick={openCreate} className="btn-primary">
                    <Plus size={18} /> Tambah Pesanan
                </button>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-48">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input className="input-field pl-9 py-2" placeholder="Cari nama pembeli..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="input-field w-auto py-2" value={filterBayar} onChange={e => setFilterBayar(e.target.value)}>
                    <option value="">Semua Bayar</option>
                    {STATUS_BAYAR.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="input-field w-auto py-2" value={filterAntar} onChange={e => setFilterAntar(e.target.value)}>
                    <option value="">Semua Antar</option>
                    {STATUS_ANTAR.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select className="input-field w-auto py-2" value={filterDukuh} onChange={e => setFilterDukuh(e.target.value)}>
                    <option value="">Semua Dukuh</option>
                    {STANDS.map(s => <option key={s} value={s}>{getDukuhName(s)}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-600 bg-surface-700">
                                <th className="table-header text-left">No Pesanan</th>
                                <th className="table-header text-left">Nama</th>
                                <th className="table-header text-left">Dukuh</th>
                                <th className="table-header text-right">Kantong</th>
                                <th className="table-header text-right">Total</th>
                                <th className="table-header text-center">Bayar</th>
                                <th className="table-header text-center">Antar</th>
                                <th className="table-header text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={8} className="text-center text-gray-500 py-12">Tidak ada data</td></tr>
                            ) : filtered.map(p => (
                                <tr key={p.id} className="table-row">
                                    <td className="table-cell font-mono text-primary-400">{p.nomor_pesanan || '-'}</td>
                                    <td className="table-cell font-medium text-white">{p.nama_pembeli}</td>
                                    <td className="table-cell">{getDukuhName(p.dukuh_id)}</td>
                                    <td className="table-cell text-right">{p.jumlah_kantong}</td>
                                    <td className="table-cell text-right text-emerald-400 font-medium">{formatRupiah(p.total_harga)}</td>
                                    <td className="table-cell text-center"><StatusBadgeBayar status={p.status_bayar} /></td>
                                    <td className="table-cell text-center"><StatusBadgeAntar status={p.status_antar} /></td>
                                    <td className="table-cell text-right">
                                        <div className="flex gap-1 justify-end">
                                            <button onClick={() => openEdit(p)} className="p-2 rounded-lg text-gray-400 hover:text-primary-400 hover:bg-primary-500/10"><Pencil size={15} /></button>
                                            <button onClick={() => del(p.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trash2 size={15} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Pesanan' : 'Tambah Pesanan WA'}>
                <div className="space-y-3">
                    <div><label className="label">Nama Pembeli</label><input className="input-field" value={form.nama_pembeli || ''} onChange={handle('nama_pembeli')} placeholder="Budi Santoso" /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Dukuh</label>
                            <select className="input-field" value={form.dukuh_id || 'dukuh1'} onChange={handle('dukuh_id')}>
                                {STANDS.map(d => <option key={d} value={d}>{getDukuhName(d)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Jumlah Kantong</label>
                            <input className="input-field" type="number" min={1} value={form.jumlah_kantong || 1} onChange={handle('jumlah_kantong')} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Status Bayar</label>
                            <select className="input-field" value={form.status_bayar || 'LUNAS'} onChange={handle('status_bayar')}>
                                {STATUS_BAYAR.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Status Antar</label>
                            <select className="input-field" value={form.status_antar || 'MENUNGGU'} onChange={handle('status_antar')}>
                                {STATUS_ANTAR.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="label">Total Harga</label>
                        <div className="input-field text-primary-400 font-semibold bg-surface-800">
                            {formatRupiah(form.total_harga || 0)}
                        </div>
                    </div>
                    <div><label className="label">Catatan</label><textarea className="input-field resize-none" rows={2} value={form.catatan || ''} onChange={handle('catatan')} /></div>
                    <div className="flex gap-3 pt-2">
                        <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Batal</button>
                        <button onClick={save} disabled={saving} className="btn-primary flex-1">
                            {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Simpan'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
