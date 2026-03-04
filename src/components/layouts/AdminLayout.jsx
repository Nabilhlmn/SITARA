import { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
    LayoutDashboard, Users, Package, ShoppingBag,
    ArrowLeftRight, Wallet, FileBarChart, ChevronLeft,
    ChevronRight, LogOut, Menu, Wheat
} from 'lucide-react';
import toast from 'react-hot-toast';

const navItems = [
    { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/admin/users', icon: Users, label: 'Pengguna' },
    { to: '/admin/stok', icon: Package, label: 'Stok & Master' },
    { to: '/admin/pesanan', icon: ShoppingBag, label: 'Pesanan WA' },
    { to: '/admin/transfer', icon: ArrowLeftRight, label: 'Transfer Stok' },
    { to: '/admin/setoran', icon: Wallet, label: 'Setoran' },
    { to: '/admin/laporan', icon: FileBarChart, label: 'Laporan' },
];

export default function AdminLayout() {
    const { userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        await logout();
        toast.success('Berhasil logout');
        navigate('/login');
    };

    const Sidebar = ({ mobile = false }) => (
        <aside className={`
      ${mobile
                ? 'fixed inset-y-0 left-0 z-50 w-64 bg-surface-800 border-r border-surface-600'
                : `relative h-full flex flex-col bg-surface-800 border-r border-surface-600 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`
            }
    `}>
            {/* Logo */}
            <div className={`flex items-center gap-3 px-5 py-5 border-b border-surface-600 ${collapsed && !mobile ? 'justify-center px-3' : ''}`}>
                <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shrink-0">
                    <Wheat size={22} className="text-black" />
                </div>
                {(!collapsed || mobile) && (
                    <div>
                        <h2 className="font-bold text-white text-lg leading-none">SITARA</h2>
                        <p className="text-xs text-primary-400 font-medium">Admin Panel</p>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
                        to={to}
                        onClick={() => mobile && setMobileOpen(false)}
                        className={({ isActive }) =>
                            `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 font-medium text-sm
              ${isActive
                                ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-surface-700'
                            }
              ${collapsed && !mobile ? 'justify-center' : ''}
              `
                        }
                    >
                        <Icon size={20} className="shrink-0" />
                        {(!collapsed || mobile) && <span>{label}</span>}
                    </NavLink>
                ))}
            </nav>

            {/* User & Logout */}
            <div className={`px-3 py-4 border-t border-surface-600 space-y-2 ${collapsed && !mobile ? 'items-center' : ''}`}>
                {(!collapsed || mobile) && (
                    <div className="px-3 py-2">
                        <p className="text-xs text-gray-500">Login sebagai</p>
                        <p className="text-sm font-semibold text-white truncate">{userProfile?.nama_lengkap || 'Admin'}</p>
                        <span className="text-xs text-primary-400 font-medium">Administrator</span>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className={`flex items-center gap-3 px-3 py-3 w-full rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 text-sm font-medium ${collapsed && !mobile ? 'justify-center' : ''}`}
                >
                    <LogOut size={18} className="shrink-0" />
                    {(!collapsed || mobile) && <span>Logout</span>}
                </button>
            </div>

            {/* Collapse button (desktop only) */}
            {!mobile && (
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="absolute -right-3.5 top-20 w-7 h-7 rounded-full bg-surface-600 border border-surface-500 flex items-center justify-center text-gray-400 hover:text-white hover:bg-surface-500 transition-all duration-200 z-10"
                >
                    {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
                </button>
            )}
        </aside>
    );

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Desktop Sidebar */}
            <div className="hidden md:flex">
                <Sidebar />
            </div>

            {/* Mobile Sidebar Overlay */}
            {mobileOpen && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={() => setMobileOpen(false)} />
                    <Sidebar mobile />
                </>
            )}

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden">
                {/* Mobile header */}
                <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-surface-800 border-b border-surface-600">
                    <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-surface-700">
                        <Menu size={22} />
                    </button>
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center">
                            <Wheat size={15} className="text-black" />
                        </div>
                        <span className="font-bold text-white">SITARA Admin</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto bg-surface-900">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
