import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    ShoppingCart, ShoppingBag, Truck, Wallet, ArrowLeftRight, LogOut, Wheat
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getDukuhName } from '../../constants/dukuh';

const navItems = [
    { to: '/petugas/kasir', icon: ShoppingCart, label: 'Kasir' },
    { to: '/petugas/pesanan', icon: ShoppingBag, label: 'Pesanan WA' },
    { to: '/petugas/antar', icon: Truck, label: 'Antar' },
    { to: '/petugas/setoran', icon: Wallet, label: 'Setoran' },
    { to: '/petugas/transfer', icon: ArrowLeftRight, label: 'Transfer' },
];

export default function PetugasLayout() {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success('Berhasil logout');
        navigate('/login');
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-surface-900">
            {/* Top Header */}
            <header className="shrink-0 flex items-center justify-between px-4 py-3 bg-surface-800 border-b border-surface-600">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-500 flex items-center justify-center">
                        <Wheat size={18} className="text-black" />
                    </div>
                    <div>
                        <p className="font-bold text-white text-sm leading-none">
                            {userProfile?.nama_lengkap || 'Petugas'}
                        </p>
                        <p className="text-xs text-primary-400 font-medium capitalize mt-0.5">
                            Stand: {getDukuhName(userProfile?.stand_id) || '-'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium"
                >
                    <LogOut size={16} />
                    <span className="hidden sm:inline">Logout</span>
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="shrink-0 flex items-center bg-surface-800 border-t border-surface-600 px-2 py-2">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        className={({ isActive }) =>
                            `nav-item flex-1 ${isActive ? 'nav-item-active' : ''}`
                        }
                    >
                        <Icon size={22} />
                        <span>{label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
