import { useState, useEffect } from 'react';
import {
    collection, query, orderBy, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, getDocs, runTransaction
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { STANDS, getDukuhName } from '../../constants/dukuh';
import Modal from '../../components/Modal';
import { Plus, Search, Image, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

function formatRupiah(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

// STANDS & getDukuhName diimport dari constants/dukuh.js

function StatusBayar({ s }) {
    return <span className={s === 'LUNAS' ? 'status-badge-lunas' : 'status-badge-dp'}>{s}</span>;
}
function StatusAntar({ s }) {
    const m = { MENUNGGU: 'status-badge-menunggu', DIANTAR: 'status-badge-diantar', SELESAI: 'status-badge-selesai' };
    return <span className={m[s] || 'badge bg-gray-500/20 text-gray-400'}>{s}</span>;
}

export default function PetugasPesananWA() {
    const { userProfile, user } = useAuth();
    const [pesanan, setPesanan] = useState([]);
    const [harga, setHarga] = useState(65000);
    const [search, setSearch] = useState('');
    const [tab, setTab] = useState('semua');
    const [filterDukuh, setFilterDukuh] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ nama_pembeli: '', dukuh_id: 'dukuh1', jumlah_kantong: 1, status_bayar: 'LUNAS', catatan: '' });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(query(collection(db, 'pesanan_wa'), orderBy('created_at', 'desc')), (snap) => {
            setPesanan(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        const unsubP = onSnapshot(collection(db, 'master_produk'), (s) => {
            if (!s.empty) setHarga(s.docs[0].data().harga || 65000);
        });
        return () => { unsub(); unsubP(); };
    }, []);

    const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
    const total_harga = Number(form.jumlah_kantong || 0) * harga;

    const save = async () => {
        if (!form.nama_pembeli || !form.jumlah_kantong) { toast.error('Isi nama dan jumlah kantong'); return; }
        setSaving(true);
        try {
            await addDoc(collection(db, 'pesanan_wa'), {
                nomor_pesanan: `P${Date.now()}`,
                nama_pembeli: form.nama_pembeli,
                dukuh_id: form.dukuh_id,
                jumlah_kantong: Number(form.jumlah_kantong),
                total_harga,
                status_bayar: form.status_bayar,
                status_antar: 'MENUNGGU',
                bukti_transfer_url: '',
                catatan: form.catatan,
                created_by: user?.uid || '',
                created_at: serverTimestamp(),
                updated_at: serverTimestamp(),
            });
            toast.success('Pesanan ditambahkan');
            setShowModal(false);
            setForm({ nama_pembeli: '', dukuh_id: 'dukuh1', jumlah_kantong: 1, status_bayar: 'BELUM BAYAR', catatan: '' });
        } catch (e) { toast.error(e.message); }
        setSaving(false);
    };

    const updateStatus = async (id, field, value) => {
        await updateDoc(doc(db, 'pesanan_wa', id), { [field]: value, updated_at: serverTimestamp() });
        toast.success('Status diperbarui');
    };

    const filtered = pesanan
        .filter(p => tab === 'belum_selesai' ? p.status_antar !== 'SELESAI' : true)
        .filter(p => !search || p.nama_pembeli?.toLowerCase().includes(search.toLowerCase()))
        .filter(p => !filterDukuh || p.dukuh_id === filterDukuh);

    return (
        <div className="p-4 space-y-4 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-white">Pesanan WhatsApp</h1>
                    <p className="text-gray-400 text-xs mt-0.5">
                        {filterDukuh
                            ? `${filtered.length} pesanan • Rp ${new Intl.NumberFormat('id-ID').format(filtered.filter(x => x.status_bayar === 'LUNAS').reduce((a, b) => a + (b.total_harga || 0), 0))} (Lunas)`
                            : `${pesanan.length} pesanan total`}
                    </p>
                </div>
                <button onClick={() => setShowModal(true)} className="btn-primary py-2 px-4">
                    <Plus size={18} /> Tambah
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2">
                {[['semua', 'Semua'], ['belum_selesai', 'Belum Selesai']].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === k ? 'bg-primary-500 text-black' : 'bg-surface-700 text-gray-400 hover:text-white'}`}>{l}</button>
                ))}
            </div>

            {/* Search & Filter */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input className="input-field pl-9 py-2" placeholder="Cari nama pembeli..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="input-field w-auto py-2" value={filterDukuh} onChange={e => setFilterDukuh(e.target.value)}>
                    <option value="">Semua Dukuh</option>
                    {STANDS.map(s => <option key={s} value={s}>{getDukuhName(s)}</option>)}
                </select>
            </div>

            {/* List */}
            <div className="space-y-3">
                {filtered.length === 0 ? (
                    <div className="card text-center py-10 text-gray-500">Tidak ada pesanan</div>
                ) : filtered.map(p => (
                    <div key={p.id} className="card space-y-3">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-bold text-white text-lg">{p.nama_pembeli}</p>
                                <p className="text-sm text-gray-400">{getDukuhName(p.dukuh_id)} • {p.jumlah_kantong} kantong</p>
                                <p className="text-primary-400 font-semibold">{formatRupiah(p.total_harga)}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <StatusBayar s={p.status_bayar} />
                                <StatusAntar s={p.status_antar} />
                                {p.status_bayar === 'BELUM BAYAR' && <span className="status-badge-batal">BELUM BAYAR</span>}
                            </div>
                        </div>
                        {p.catatan && <p className="text-xs text-gray-500 bg-surface-700 rounded-lg px-3 py-2">{p.catatan}</p>}
                        {/* Status update */}
                        {p.status_antar !== 'SELESAI' && (
                            <div className="flex gap-2">
                                {(p.status_bayar === 'DP' || p.status_bayar === 'BELUM BAYAR') && (
                                    <button onClick={() => updateStatus(p.id, 'status_bayar', 'LUNAS')} className="btn-success flex-1 text-sm py-2">
                                        Tandai Lunas
                                    </button>
                                )}
                                {p.status_antar === 'MENUNGGU' && (
                                    <button onClick={() => updateStatus(p.id, 'status_antar', 'DIANTAR')} className="btn-secondary flex-1 text-sm py-2">
                                        Mulai Antar
                                    </button>
                                )}
                                {p.status_antar === 'DIANTAR' && (
                                    <button onClick={() => updateStatus(p.id, 'status_antar', 'SELESAI')} className="btn-primary flex-1 text-sm py-2">
                                        Selesai
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tambah Pesanan WA">
                <div className="space-y-3">
                    <div><label className="label">Nama Pembeli</label><input className="input-field" value={form.nama_pembeli} onChange={handle('nama_pembeli')} placeholder="Budi Santoso" autoFocus /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="label">Dukuh</label>
                            <select className="input-field" value={form.dukuh_id} onChange={handle('dukuh_id')}>
                                {STANDS.map(d => <option key={d} value={d}>{getDukuhName(d)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Jumlah Kantong</label>
                            <input className="input-field" type="number" min={1} value={form.jumlah_kantong} onChange={handle('jumlah_kantong')} />
                        </div>
                    </div>
                    <div>
                        <label className="label">Status Bayar</label>
                        <div className="flex gap-2">
                            {['LUNAS', 'DP', 'BELUM BAYAR'].map(s => (
                                <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status_bayar: s }))} className={`flex-1 py-2.5 rounded-xl text-[11px] font-medium transition-all ${form.status_bayar === s ? 'bg-primary-500 text-black' : 'bg-surface-700 text-gray-400'}`}>{s}</button>
                            ))}
                        </div>
                    </div>
                    <div className="bg-surface-700 rounded-xl px-4 py-3">
                        <span className="text-gray-400 text-sm">Total: </span>
                        <span className="text-primary-400 font-bold text-lg ml-2">{formatRupiah(total_harga)}</span>
                    </div>
                    <div><label className="label">Catatan</label><textarea className="input-field resize-none" rows={2} value={form.catatan} onChange={handle('catatan')} /></div>
                    <div className="flex gap-3 pt-1">
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
