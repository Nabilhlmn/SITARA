import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Truck, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

function formatRupiah(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

export default function PetugasPengantaran() {
    const [pesanan, setPesanan] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'pesanan_wa'), where('status_antar', 'in', ['MENUNGGU', 'DIANTAR']), orderBy('created_at', 'asc')),
            (snap) => { setPesanan(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setLoading(false); }
        );
        return unsub;
    }, []);

    const updateStatus = async (id, status) => {
        await updateDoc(doc(db, 'pesanan_wa', id), { status_antar: status, updated_at: serverTimestamp() });
        toast.success(`Status → ${status}`);
    };

    const menunggu = pesanan.filter(p => p.status_antar === 'MENUNGGU');
    const diantar = pesanan.filter(p => p.status_antar === 'DIANTAR');

    return (
        <div className="p-4 space-y-5 max-w-2xl mx-auto">
            <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    <Truck size={22} className="text-primary-400" /> Status Pengantaran
                </h1>
                <p className="text-gray-400 text-sm mt-0.5">{pesanan.length} pesanan perlu ditanggapi</p>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Memuat...</div>
            ) : pesanan.length === 0 ? (
                <div className="card text-center py-12">
                    <CheckCircle size={48} className="text-emerald-400 mx-auto mb-3" />
                    <p className="text-emerald-400 font-semibold text-lg">Semua pesanan selesai!</p>
                    <p className="text-gray-500 text-sm">Tidak ada pesanan yang perlu diantar</p>
                </div>
            ) : (
                <>
                    {menunggu.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-yellow-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                                Menunggu ({menunggu.length})
                            </h2>
                            <div className="space-y-3">
                                {menunggu.map(p => (
                                    <div key={p.id} className="card border-yellow-500/20">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-bold text-white text-lg">{p.nama_pembeli}</p>
                                                <p className="text-sm text-gray-400 capitalize">{p.dukuh_id} • {p.jumlah_kantong} kantong</p>
                                                <p className="text-primary-400 font-semibold">{formatRupiah(p.total_harga)}</p>
                                            </div>
                                            <span className="status-badge-menunggu">MENUNGGU</span>
                                        </div>
                                        {p.catatan && <p className="text-xs text-gray-500 bg-surface-700 rounded-lg px-3 py-2 mb-3">{p.catatan}</p>}
                                        <button onClick={() => updateStatus(p.id, 'DIANTAR')} className="btn-primary w-full py-3">
                                            <Truck size={18} /> Mulai Antar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {diantar.length > 0 && (
                        <div>
                            <h2 className="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                Sedang Diantar ({diantar.length})
                            </h2>
                            <div className="space-y-3">
                                {diantar.map(p => (
                                    <div key={p.id} className="card border-blue-500/20">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-bold text-white text-lg">{p.nama_pembeli}</p>
                                                <p className="text-sm text-gray-400 capitalize">{p.dukuh_id} • {p.jumlah_kantong} kantong</p>
                                            </div>
                                            <span className="status-badge-diantar">DIANTAR</span>
                                        </div>
                                        <button onClick={() => updateStatus(p.id, 'SELESAI')} className="btn-success w-full py-3">
                                            <CheckCircle size={18} /> Tandai Selesai
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
