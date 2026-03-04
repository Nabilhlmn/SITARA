import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Wheat, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error('Email dan password wajib diisi');
            return;
        }
        setLoading(true);
        try {
            const cred = await login(email, password);
            // Fetch role dari Firestore untuk redirect yang tepat
            const docSnap = await getDoc(doc(db, 'users', cred.user.uid));
            if (!docSnap.exists()) {
                toast.error('Profil tidak ditemukan. Hubungi administrator.');
                setLoading(false);
                return;
            }
            const role = docSnap.data().role;
            toast.success('Login berhasil!');
            if (role === 'admin') navigate('/admin/dashboard');
            else navigate('/petugas/kasir');
        } catch (err) {
            console.error(err);
            if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
                toast.error('Email atau password salah');
            } else if (err.code === 'auth/too-many-requests') {
                toast.error('Terlalu banyak percobaan. Coba lagi nanti.');
            } else {
                toast.error('Gagal login: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-primary-500/10 blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-primary-500/5 blur-3xl" />
            </div>

            <div className="relative w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary-500 mb-4 glow-primary">
                        <Wheat size={40} className="text-black" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gradient">SITARA</h1>
                    <p className="text-gray-400 text-sm mt-1">Sistem Informasi Terpadu Beras Zakat</p>
                </div>

                {/* Card */}
                <div className="card border-surface-500">
                    <h2 className="text-xl font-bold text-white mb-6">Masuk ke Akun</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="label">Email</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field pl-10"
                                    placeholder="admin@example.com"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field pl-10 pr-10"
                                    placeholder="••••••••"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(s => !s)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full mt-6 py-4 text-base"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            ) : 'Masuk'}
                        </button>
                    </form>
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    SITARA v1.0 · Panitia Zakat {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}
