import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { STANDS, getDukuhName } from '../../constants/dukuh';
import { Wallet, Search, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

function formatRupiah(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n || 0);
}

export default function AdminSetoran() {
    const [setoran, setSetoran] = useState([]);
    const [search, setSearch] = useState('');
    const [filterStand, setFilterStand] = useState('');

    useEffect(() => {
        const unsub = onSnapshot(
            query(collection(db, 'setoran'), orderBy('created_at', 'desc')),
            (snap) => setSetoran(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        );
        return unsub;
    }, []);

    const del = async (id) => {
        if (!window.confirm('Hapus riwayat setoran ini?')) return;
        try {
            await deleteDoc(doc(db, 'setoran', id));
            toast.success('Setoran berhasil dihapus');
        } catch (e) {
            toast.error(e.message);
        }
    };

    const stands = [...new Set(setoran.map(s => s.stand_id))];
    const filtered = setoran.filter(s =>
        (!filterStand || s.stand_id === filterStand) &&
        (!search || s.penerima?.toLowerCase().includes(search.toLowerCase()) || s.catatan?.toLowerCase().includes(search.toLowerCase()))
    );

    const totalSetoran = filtered.reduce((a, s) => a + (s.jumlah_setor || 0), 0);

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Rekap Setoran</h1>
                    <p className="text-gray-400 text-sm mt-0.5">{setoran.length} setoran tercatat</p>
                </div>
                <div className="card py-3 px-5 text-right">
                    <p className="text-xs text-gray-400">Total Setoran</p>
                    <p className="text-xl font-bold text-emerald-400">{formatRupiah(totalSetoran)}</p>
                </div>
            </div>

            {/* Rekap per stand */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {STANDS.map(stand => {
                    const total = setoran.filter(s => s.stand_id === stand).reduce((a, s) => a + (s.jumlah_setor || 0), 0);
                    return (
                        <div key={stand} className="card py-3 text-center">
                            <p className="text-xs text-gray-500 mb-1">{getDukuhName(stand)}</p>
                            <p className="font-bold text-white text-sm">{formatRupiah(total)}</p>
                        </div>
                    );
                })}
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-40">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input className="input-field pl-9 py-2" placeholder="Cari penerima atau catatan..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <select className="input-field w-auto py-2" value={filterStand} onChange={e => setFilterStand(e.target.value)}>
                    <option value="">Semua Stand</option>
                    {stands.map(s => <option key={s} value={s}>{getDukuhName(s)}</option>)}
                </select>
            </div>

            {/* Table */}
            <div className="card p-0 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-surface-600 bg-surface-700">
                                <th className="table-header text-left">No Setoran</th>
                                <th className="table-header text-left">Stand</th>
                                <th className="table-header text-right">Jumlah</th>
                                <th className="table-header text-left">Penerima</th>
                                <th className="table-header text-left">Catatan</th>
                                <th className="table-header text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr><td colSpan={6} className="text-center text-gray-500 py-12">Belum ada data setoran</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id} className="table-row">
                                    <td className="table-cell font-mono text-primary-400">{s.nomor_setoran || s.id.slice(0, 8)}</td>
                                    <td className="table-cell font-medium text-white">{getDukuhName(s.stand_id)}</td>
                                    <td className="table-cell text-right text-emerald-400 font-bold">{formatRupiah(s.jumlah_setor)}</td>
                                    <td className="table-cell">{s.penerima}</td>
                                    <td className="table-cell text-gray-400 text-xs max-w-32 truncate">{s.catatan || '-'}</td>
                                    <td className="table-cell text-center">
                                        <button onClick={() => del(s.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
