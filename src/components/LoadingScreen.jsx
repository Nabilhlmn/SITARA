export default function LoadingScreen() {
    return (
        <div className="min-h-screen bg-surface-900 flex items-center justify-center">
            <div className="text-center">
                <div className="relative inline-flex">
                    <div className="w-16 h-16 rounded-full border-4 border-surface-600"></div>
                    <div className="w-16 h-16 rounded-full border-4 border-primary-500 border-t-transparent animate-spin absolute top-0 left-0"></div>
                </div>
                <div className="mt-4">
                    <h1 className="text-xl font-bold text-gradient">SITARA</h1>
                    <p className="text-gray-500 text-sm mt-1">Memuat aplikasi...</p>
                </div>
            </div>
        </div>
    );
}
