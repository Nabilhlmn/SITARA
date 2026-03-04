import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from './LoadingScreen';

export default function ProtectedRoute({ children, allowedRoles }) {
    const { user, userProfile, loading } = useAuth();

    if (loading) return <LoadingScreen />;

    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles && userProfile && !allowedRoles.includes(userProfile.role)) {
        if (userProfile.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
        if (userProfile.role === 'petugas') return <Navigate to="/petugas/dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    return children;
}
