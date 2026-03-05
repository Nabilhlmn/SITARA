import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import {
    Package, ShoppingBag, DollarSign, TrendingUp,
    ArrowLeftRight, Users, Clock, Wheat
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend
} from 'recharts';
import { getDukuhName } from '../../constants/dukuh';

function StatCard({ icon: Icon, label, value, sub, color = 'primary' }) {
    const colors = {
        primary: 'text-primary-400 bg-primary-500/10',
        emerald: 'text-emerald-400 bg-emerald-500/10',
        blue: 'text-blue-400 bg-blue-500/10',
        purple: 'text-purple-400 bg-purple-500/10',
    };
    return (
        <div className="stat-card">
            <div className="flex items-start justify-between">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
                    <Icon size={24} className={colors[color].split(' ')[0]} />
                </div>
            </div>
            <div>
                <p className="text-3xl font-bold text-white">{value}</p>
                <p className="text-sm font-medium text-gray-300 mt-0.5">{label}</p>
                {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
            </div>
        </div>
    );
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="card-elevated p-3 text-sm">
                <p className="font-semibold text-white mb-1">{label}</p>
                {payload.map((p) => (
                    <p key={p.name} style={{ color: p.color }}>
                        {p.name}: {p.value}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

function formatRupiah(n) {
    return 'Rp ' + new Intl.NumberFormat('id-ID').format(n);
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalStokPusat: 0,
        totalTerjualStand: 0,
        totalKantongWA: 0,
        totalUangStand: 0,
        totalUangWA: 0,
        totalPesananWA: 0,
        totalTransfer: 0,
        totalPetugas: 0,
    });
    const [chartData, setChartData] = useState([]);
    const [recentTx, setRecentTx] = useState([]);
    const [harga, setHarga] = useState(65000);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Real-time listener stok pusat
        const unsubMaster = onSnapshot(collection(db, 'master_produk'), (snap) => {
            if (!snap.empty) {
                const d = snap.docs[0].data();
                setStats(s => ({ ...s, totalStokPusat: d.stok_tersedia || 0 }));
                setHarga(d.harga || 65000);
            }
        });

        // Fetch stok per stand for chart
        const unsubStok = onSnapshot(collection(db, 'stok_per_stand'), (snap) => {
            const data = snap.docs.map(d => ({
                stand: getDukuhName(d.id),
                terjual: d.data().stok_terjual || 0,
                sisa: d.data().stok_sisa || 0,
                masuk: d.data().stok_masuk_transfer || 0,
            }));
            setChartData(data);
            const totalStand = data.reduce((a, b) => a + b.terjual, 0);
            setStats(s => ({ ...s, totalTerjualStand: totalStand }));
            setLoading(false);
        });

        // Fetch transaksi stand - hitung total pendapatan dari data transaksi sebenarnya
        const unsubTx = onSnapshot(
            collection(db, 'transaksi_stand'),
            (snap) => {
                const allTx = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                const totalUangStand = allTx.reduce((a, t) => a + (t.total_harga || 0), 0);
                setStats(s => ({ ...s, totalUangStand }));
                // Recent transactions (sort client-side)
                const sorted = [...allTx].sort((a, b) => (b.created_at?.toDate() || 0) - (a.created_at?.toDate() || 0));
                setRecentTx(sorted.slice(0, 10));
            }
        );

        // Fetch pesanan WA count + uang lunas + kantong terjual
        const unsubPesanan = onSnapshot(collection(db, 'pesanan_wa'), (snap) => {
            const all = snap.docs.map(d => d.data());
            const lunas = all.filter(p => p.status_bayar === 'LUNAS');
            const uangWA = lunas.reduce((a, p) => a + (p.total_harga || 0), 0);
            const kantongWA = all.reduce((a, p) => a + (p.jumlah_kantong || 0), 0);
            setStats(s => ({ ...s, totalPesananWA: snap.size, totalUangWA: uangWA, totalKantongWA: kantongWA }));
        });

        // Fetch petugas count
        const fetchPetugas = async () => {
            const snap = await getDocs(query(collection(db, 'users')));
            const petugas = snap.docs.filter(d => d.data().role === 'petugas');
            setStats(s => ({ ...s, totalPetugas: petugas.length }));
        };
        fetchPetugas();

        // Fetch transfer count
        const unsubTransfer = onSnapshot(collection(db, 'transfer_stok'), (snap) => {
            setStats(s => ({ ...s, totalTransfer: snap.size }));
        });

        return () => {
            unsubMaster();
            unsubStok();
            unsubTx();
            unsubPesanan();
            unsubTransfer();
        };
    }, []);

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-white">Dashboard</h1>
                <p className="text-gray-400 text-sm mt-0.5">Ringkasan operasional SITARA</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
                <StatCard
                    icon={Package}
                    label="Stok Pusat Tersisa"
                    value={`${stats.totalStokPusat} kantong`}
                    color="primary"
                />
                <StatCard
                    icon={Wheat}
                    label="Total Terjual"
                    value={`${stats.totalTerjualStand + stats.totalKantongWA} kantong`}
                    sub={`Stand: ${stats.totalTerjualStand} + WA: ${stats.totalKantongWA}`}
                    color="emerald"
                />
                <StatCard
                    icon={DollarSign}
                    label="Total Pendapatan"
                    value={formatRupiah(stats.totalUangStand + stats.totalUangWA)}
                    sub={`Stand: ${formatRupiah(stats.totalUangStand)} + WA: ${formatRupiah(stats.totalUangWA)}`}
                    color="blue"
                />
                <StatCard
                    icon={ShoppingBag}
                    label="Pesanan WA"
                    value={stats.totalPesananWA}
                    color="purple"
                />
                <StatCard
                    icon={ArrowLeftRight}
                    label="Transfer Stok"
                    value={stats.totalTransfer}
                    color="primary"
                />
                <StatCard
                    icon={Users}
                    label="Jumlah Petugas"
                    value={stats.totalPetugas}
                    color="emerald"
                />
            </div>

            {/* Chart */}
            <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-primary-400" />
                    Penjualan & Stok per Stand
                </h2>
                {loading ? (
                    <div className="h-56 flex items-center justify-center text-gray-500">
                        Memuat data...
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="h-56 flex items-center justify-center text-gray-500">
                        Belum ada data stok per stand
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                            <XAxis dataKey="stand" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <YAxis tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                            <Bar dataKey="terjual" name="Terjual" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="sisa" name="Sisa" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>

            {/* Recent Transactions */}
            <div className="card">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Clock size={20} className="text-primary-400" />
                    Transaksi Terbaru (Stand)
                </h2>
                {recentTx.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada transaksi</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-600">
                                    <th className="table-header text-left">No Transaksi</th>
                                    <th className="table-header text-left">Stand</th>
                                    <th className="table-header text-right">Kantong</th>
                                    <th className="table-header text-right">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentTx.map(tx => (
                                    <tr key={tx.id} className="table-row">
                                        <td className="table-cell font-mono text-primary-400">{tx.nomor_transaksi || tx.id.slice(0, 8)}</td>
                                        <td className="table-cell">{getDukuhName(tx.stand_id)}</td>
                                        <td className="table-cell text-right">{tx.jumlah_kantong}</td>
                                        <td className="table-cell text-right text-emerald-400 font-medium">{formatRupiah(tx.total_harga)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
