import { useState, useEffect } from 'react';
import {
    collection, doc, onSnapshot, setDoc, updateDoc, serverTimestamp, getDocs, query, orderBy, runTransaction
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { STANDS, getDukuhName } from '../../constants/dukuh';
import Modal from '../../components/Modal';
import { Package, Pencil, Plus, Wheat, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';


function formatRupiah(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

// STANDS diimport dari constants/dukuh.js

export default function StockManagement() {
    const [produk, setProduk] = useState(null);
    const [produkId, setProdukId] = useState(null);
    const [stokPerStand, setStokPerStand] = useState([]);
    const [dukuh, setDukuh] = useState([]);
    const [editProduk, setEditProduk] = useState(false);
    const [editStand, setEditStand] = useState(null);
    const [editDukuh, setEditDukuh] = useState(null);
    const [showDukuhModal, setShowDukuhModal] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        // Produk
        const unsubProduk = onSnapshot(collection(db, 'master_produk'), (snap) => {
            if (!snap.empty) {
                const d = snap.docs[0];
                setProduk({ id: d.id, ...d.data() });
                setProdukId(d.id);
            }
        });

        // Stok per stand
        const unsubStok = onSnapshot(collection(db, 'stok_per_stand'), (snap) => {
            setStokPerStand(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Dukuh
        const unsubDukuh = onSnapshot(collection(db, 'master_dukuh'), (snap) => {
            setDukuh(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubProduk(); unsubStok(); unsubDukuh(); };
    }, []);

    // Merge stok per stand dengan daftar stand
    const allStands = STANDS.map(id => {
        const existing = stokPerStand.find(s => s.id === id);
        return existing || {
            id,
            stok_diterima: 0, stok_masuk_transfer: 0, stok_keluar_transfer: 0,
            stok_terjual: 0, stok_sisa: 0
        };
    });

    const saveProduk = async () => {
        if (!form.harga || !form.stok_tersedia) { toast.error('Isi semua field'); return; }
        setSaving(true);
        try {
            const ref = produkId ? doc(db, 'master_produk', produkId) : doc(collection(db, 'master_produk'));
            await setDoc(ref, {
                nama: 'Beras Zakat 2,7 kg',
                harga: Number(form.harga),
                stok_tersedia: Number(form.stok_tersedia),
                stok_awal: Number(form.stok_awal || form.stok_tersedia),
                last_updated: serverTimestamp(),
            }, { merge: true });
            toast.success('Data produk disimpan');
            setEditProduk(false);
        } catch (e) { toast.error(e.message); }
        setSaving(false);
    };

    const saveStand = async () => {
        setSaving(true);
        try {
            const oldStok = stokPerStand.find(s => s.id === editStand.id);
            const oldDiterima = oldStok?.stok_diterima || 0;
            const newDiterima = Number(form.stok_diterima || 0);
            const diffDiterima = newDiterima - oldDiterima; // positif = tambah stok ke stand

            // Update stok stand
            await setDoc(doc(db, 'stok_per_stand', editStand.id), {
                stand_id: editStand.id,
                stok_diterima: newDiterima,
                stok_masuk_transfer: Number(form.stok_masuk_transfer || 0),
                stok_keluar_transfer: Number(form.stok_keluar_transfer || 0),
                stok_terjual: Number(form.stok_terjual || 0),
                stok_sisa: Number(form.stok_sisa || 0),
                last_updated: serverTimestamp(),
            }, { merge: true });

            // Sinkron stok pusat jika stok_diterima berubah
            if (diffDiterima !== 0 && produkId) {
                await runTransaction(db, async (transaction) => {
                    const mpRef = doc(db, 'master_produk', produkId);
                    const snapP = await transaction.get(mpRef);
                    if (snapP.exists()) {
                        const currentStok = snapP.data().stok_tersedia || 0;
                        transaction.update(mpRef, {
                            stok_tersedia: Math.max(0, currentStok - diffDiterima),
                            last_updated: serverTimestamp(),
                        });
                    }
                });
            }

            toast.success('Stok stand diperbarui');
            setEditStand(null);
        } catch (e) { toast.error(e.message); }
        setSaving(false);
    };

    const saveDukuh = async () => {
        if (!form.nama) { toast.error('Nama dukuh wajib diisi'); return; }
        setSaving(true);
        try {
            const id = editDukuh?.id || 'dukuh' + (dukuh.length + 1);
            await setDoc(doc(db, 'master_dukuh', id), {
                nama: form.nama,
                alamat_stand: form.alamat_stand || '',
                latitude: parseFloat(form.latitude || 0),
                longitude: parseFloat(form.longitude || 0),
            }, { merge: true });
            toast.success('Data dukuh disimpan');
            setShowDukuhModal(false);
            setEditDukuh(null);
        } catch (e) { toast.error(e.message); }
        setSaving(false);
    };

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white">Stok & Master Data</h1>
                <p className="text-gray-400 text-sm mt-0.5">Kelola produk, stok per stand, dan data dukuh</p>
            </div>

            {/* Master Produk */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <Wheat size={18} className="text-primary-400" /> Master Produk
                    </h2>
                    {!editProduk && (
                        <button onClick={() => { setForm({ harga: produk?.harga || 65000, stok_tersedia: produk?.stok_tersedia || 0, stok_awal: produk?.stok_awal || 0 }); setEditProduk(true); }} className="btn-secondary text-sm py-2 px-4">
                            <Pencil size={15} /> Edit
                        </button>
                    )}
                </div>

                {editProduk ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                            <label className="label">Harga per Kantong (Rp)</label>
                            <input className="input-field" type="number" value={form.harga} onChange={e => setForm(f => ({ ...f, harga: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label">Stok Awal Total</label>
                            <input className="input-field" type="number" value={form.stok_awal} onChange={e => setForm(f => ({ ...f, stok_awal: e.target.value }))} />
                        </div>
                        <div>
                            <label className="label">Stok Tersedia (Pusat)</label>
                            <input className="input-field" type="number" value={form.stok_tersedia} onChange={e => setForm(f => ({ ...f, stok_tersedia: e.target.value }))} />
                        </div>
                        <div className="sm:col-span-3 flex gap-3">
                            <button onClick={() => setEditProduk(false)} className="btn-secondary">Batal</button>
                            <button onClick={saveProduk} disabled={saving} className="btn-primary">Simpan</button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: 'Nama', value: produk?.nama || 'Beras Zakat 2,7 kg' },
                            { label: 'Harga', value: formatRupiah(produk?.harga) },
                            { label: 'Stok Pusat', value: `${produk?.stok_tersedia || 0} kantong` },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-surface-700 rounded-xl p-3">
                                <p className="text-xs text-gray-500 mb-1">{label}</p>
                                <p className="font-semibold text-white">{value}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Stok Per Stand */}
            <div className="card">
                <h2 className="text-base font-semibold text-white flex items-center gap-2 mb-4">
                    <Package size={18} className="text-primary-400" /> Stok Per Stand
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-600">
                                <th className="table-header text-left">Stand</th>
                                <th className="table-header text-right">Diterima</th>
                                <th className="table-header text-right">Masuk Transfer</th>
                                <th className="table-header text-right">Keluar Transfer</th>
                                <th className="table-header text-right">Terjual</th>
                                <th className="table-header text-right">Sisa</th>
                                <th className="table-header text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allStands.map(s => (
                                <tr key={s.id} className="table-row">
                                    <td className="table-cell font-medium">{getDukuhName(s.id)}</td>
                                    <td className="table-cell text-right">{s.stok_diterima}</td>
                                    <td className="table-cell text-right text-emerald-400">{s.stok_masuk_transfer}</td>
                                    <td className="table-cell text-right text-red-400">{s.stok_keluar_transfer}</td>
                                    <td className="table-cell text-right text-primary-400">{s.stok_terjual}</td>
                                    <td className="table-cell text-right font-bold text-white">{s.stok_sisa}</td>
                                    <td className="table-cell text-right">
                                        <button onClick={() => { setEditStand(s); setForm({ ...s }); }} className="p-2 rounded-lg text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
                                            <Pencil size={15} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Master Dukuh */}
            <div className="card">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-semibold text-white flex items-center gap-2">
                        <MapPin size={18} className="text-primary-400" /> Master Dukuh ({dukuh.length})
                    </h2>
                    <button onClick={() => { setEditDukuh(null); setForm({}); setShowDukuhModal(true); }} className="btn-primary text-sm py-2 px-4">
                        <Plus size={15} /> Tambah
                    </button>
                </div>
                {dukuh.length === 0 ? (
                    <p className="text-gray-500 text-center py-6">Belum ada data dukuh</p>
                ) : (
                    <div className="grid gap-3">
                        {dukuh.map(d => (
                            <div key={d.id} className="flex items-center justify-between bg-surface-700 rounded-xl p-3 border border-surface-500">
                                <div>
                                    <p className="font-medium text-white">{d.nama}</p>
                                    <p className="text-xs text-gray-400">{d.alamat_stand || 'Belum ada alamat'}</p>
                                </div>
                                <button onClick={() => { setEditDukuh(d); setForm({ ...d }); setShowDukuhModal(true); }} className="p-2 rounded-lg text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
                                    <Pencil size={15} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Edit Stand Modal */}
            <Modal isOpen={!!editStand} onClose={() => setEditStand(null)} title={`Edit Stok - ${getDukuhName(editStand?.id)}`}>
                <div className="grid grid-cols-2 gap-3">
                    {['stok_diterima', 'stok_masuk_transfer', 'stok_keluar_transfer', 'stok_terjual', 'stok_sisa'].map(k => (
                        <div key={k}>
                            <label className="label capitalize">{k.replace(/_/g, ' ')}</label>
                            <input className="input-field" type="number" value={form[k] || 0} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} />
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 mt-4">
                    <button onClick={() => setEditStand(null)} className="btn-secondary flex-1">Batal</button>
                    <button onClick={saveStand} disabled={saving} className="btn-primary flex-1">Simpan</button>
                </div>
            </Modal>

            {/* Dukuh Modal */}
            <Modal isOpen={showDukuhModal} onClose={() => setShowDukuhModal(false)} title={editDukuh ? 'Edit Dukuh' : 'Tambah Dukuh'}>
                <div className="space-y-3">
                    <div><label className="label">Nama Dukuh</label><input className="input-field" value={form.nama || ''} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} /></div>
                    <div><label className="label">Alamat Stand</label><input className="input-field" value={form.alamat_stand || ''} onChange={e => setForm(f => ({ ...f, alamat_stand: e.target.value }))} /></div>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className="label">Latitude</label><input className="input-field" type="number" step="any" value={form.latitude || ''} onChange={e => setForm(f => ({ ...f, latitude: e.target.value }))} /></div>
                        <div><label className="label">Longitude</label><input className="input-field" type="number" step="any" value={form.longitude || ''} onChange={e => setForm(f => ({ ...f, longitude: e.target.value }))} /></div>
                    </div>
                    <div className="flex gap-3 mt-2">
                        <button onClick={() => setShowDukuhModal(false)} className="btn-secondary flex-1">Batal</button>
                        <button onClick={saveDukuh} disabled={saving} className="btn-primary flex-1">Simpan</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
