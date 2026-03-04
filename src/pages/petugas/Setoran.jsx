import { useState, useEffect } from 'react';
import {
    collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import { getDukuhName } from '../../constants/dukuh';
import { Wallet, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

function formatRupiah(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

export default function PetugasSetoran() {
    const { userProfile, user } = useAuth();
    const standId = userProfile?.stand_id || '';
    const [setoran, setSetoran] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ jumlah_setor: '', penerima: '', catatan: '' });
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'setoran'), orderBy('created_at', 'desc')),
            (snap) => { setSetoran(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); }
        );
        return unsub;
    }, []);

    const handleSimpan = async () => {
        if (!form.jumlah_setor || !form.penerima) { toast.error('Isi jumlah dan nama penerima'); return; }
        setSaving(true);
        try {
            await addDoc(collection(db, 'setoran'), {
                nomor_setoran: `ST${Date.now()}`,
                stand_id: standId,
                jumlah_setor: Number(form.jumlah_setor),
                penerima: form.penerima,
                catatan: form.catatan,
                created_by: user?.uid || '',
                created_at: serverTimestamp(),
            });
            toast.success('Setoran berhasil dicatat');
            setForm({ jumlah_setor: '', penerima: '', catatan: '' });
            setShowForm(false);
        } catch (e) { toast.error(e.message); }
        setSaving(false);
    };

    const mySetoran = setoran.filter(s => s.stand_id === standId);
    const totalSetor = mySetoran.reduce((a, s) => a + (s.jumlah_setor || 0), 0);
    const totalAll = setoran.reduce((a, s) => a + (s.jumlah_setor || 0), 0);

    return (
        <div className="p-4 space-y-4 max-w-xl mx-auto">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Wallet size={22} className="text-primary-400" /> Setoran
                </h1>
                <button onClick={() => setShowForm(s => !s)} className="btn-primary py-2 px-4">
                    <Plus size={18} /> Setor
                </button>
            </div>

            {/* Ringkasan */}
            <div className="grid grid-cols-2 gap-3">
                <div className="card text-center py-4">
                    <p className="text-xs text-gray-500 mb-1">Stand Saya</p>
                    <p className="text-xl font-bold text-emerald-400">{formatRupiah(totalSetor)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{getDukuhName(standId)}</p>
                </div>
                <div className="card text-center py-4">
                    <p className="text-xs text-gray-500 mb-1">Semua Stand</p>
                    <p className="text-xl font-bold text-primary-400">{formatRupiah(totalAll)}</p>
                </div>
            </div>

            {/* Form Setoran */}
            {showForm && (
                <div className="card border-primary-500/30">
                    <h2 className="text-base font-semibold text-primary-400 mb-3">Catat Setoran Baru</h2>
                    <div className="space-y-3">
                        <div>
                            <label className="label">Jumlah Setoran (Rp)</label>
                            <input
                                className="input-field text-xl font-bold"
                                type="number"
                                placeholder="0"
                                value={form.jumlah_setor}
                                onChange={e => setForm(f => ({ ...f, jumlah_setor: e.target.value }))}
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="label">Nama Penerima</label>
                            <input className="input-field" value={form.penerima} onChange={e => setForm(f => ({ ...f, penerima: e.target.value }))} placeholder="Pak Haji Ahmad" />
                        </div>
                        <div>
                            <label className="label">Catatan (opsional)</label>
                            <input className="input-field" value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="Setoran malam pertama" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Batal</button>
                            <button onClick={handleSimpan} disabled={saving} className="btn-primary flex-1">
                                {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Simpan'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Riwayat Stand saya dulu, lalu semua */}
            <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Riwayat Setoran (Semua Stand)</h2>
                {loading ? (
                    <p className="text-center text-gray-500 py-6">Memuat...</p>
                ) : setoran.length === 0 ? (
                    <div className="card text-center py-8 text-gray-500">Belum ada setoran</div>
                ) : (
                    <div className="space-y-3">
                        {setoran.map(s => (
                            <div key={s.id} className={`card py-3 flex items-center justify-between ${s.stand_id === standId ? 'border-primary-500/20' : ''}`}>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="badge bg-surface-600 text-gray-300 text-xs">{getDukuhName(s.stand_id)}</span>
                                        {s.stand_id === standId && <span className="badge bg-primary-500/20 text-primary-400 text-xs">Saya</span>}
                                    </div>
                                    <p className="font-medium text-white mt-1">→ {s.penerima}</p>
                                    {s.catatan && <p className="text-xs text-gray-500">{s.catatan}</p>}
                                </div>
                                <p className="text-emerald-400 font-bold text-lg">{formatRupiah(s.jumlah_setor)}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
