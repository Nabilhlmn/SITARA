import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminLayout from './components/layouts/AdminLayout';
import PetugasLayout from './components/layouts/PetugasLayout';

// Pages
import Login from './pages/Login';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import StockManagement from './pages/admin/StockManagement';
import AdminPesananWA from './pages/admin/PesananWA';
import TransferManagement from './pages/admin/TransferManagement';
import AdminSetoran from './pages/admin/Setoran';
import Laporan from './pages/admin/Laporan';

// Petugas pages
import PetugasKasir from './pages/petugas/Kasir';
import PetugasPesananWA from './pages/petugas/PesananWA';
import PetugasPengantaran from './pages/petugas/Pengantaran';
import PetugasSetoran from './pages/petugas/Setoran';
import PetugasTransfer from './pages/petugas/Transfer';

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: '#1a1a2e',
                            color: '#fff',
                            border: '1px solid #2a2a3e',
                            borderRadius: '12px',
                            fontSize: '14px',
                        },
                        success: { iconTheme: { primary: '#f59e0b', secondary: '#000' } },
                    }}
                />
                <Routes>
                    {/* Public */}
                    <Route path="/login" element={<Login />} />

                    {/* Admin */}
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute allowedRoles={['admin']}>
                                <AdminLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="users" element={<UserManagement />} />
                        <Route path="stok" element={<StockManagement />} />
                        <Route path="pesanan" element={<AdminPesananWA />} />
                        <Route path="transfer" element={<TransferManagement />} />
                        <Route path="setoran" element={<AdminSetoran />} />
                        <Route path="laporan" element={<Laporan />} />
                    </Route>

                    {/* Petugas */}
                    <Route
                        path="/petugas"
                        element={
                            <ProtectedRoute allowedRoles={['petugas']}>
                                <PetugasLayout />
                            </ProtectedRoute>
                        }
                    >
                        <Route index element={<Navigate to="kasir" replace />} />
                        <Route path="kasir" element={<PetugasKasir />} />
                        <Route path="pesanan" element={<PetugasPesananWA />} />
                        <Route path="antar" element={<PetugasPengantaran />} />
                        <Route path="setoran" element={<PetugasSetoran />} />
                        <Route path="transfer" element={<PetugasTransfer />} />
                    </Route>

                    {/* Default redirect */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}
