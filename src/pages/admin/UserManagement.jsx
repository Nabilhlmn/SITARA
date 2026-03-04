import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, updatePassword, signOut as fbSignOut } from 'firebase/auth';
import { db, app } from '../../firebase/config';
import { STANDS, getDukuhName } from '../../constants/dukuh';
import Modal from '../../components/Modal';
import { UserPlus, Pencil, Trash2, Users, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

// Secondary app for creating users without logging out admin
let secondaryApp;
try {
    secondaryApp = initializeApp(app.options, 'secondary');
} catch {
    secondaryApp = app; // fallback if already initialized
}
const secondaryAuth = getAuth(secondaryApp);

// STANDS diimport dari constants/dukuh.js

function UserForm({ initial, onSave, onClose, isEdit }) {
    const [form, setForm] = useState({
        email: initial?.email || '',
        password: '',
        nama_lengkap: initial?.nama_lengkap || '',
        role: initial?.role || 'petugas',
        stand_id: initial?.stand_id || 'dukuh1',
    });
    const [saving, setSaving] = useState(false);

    const handle = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.nama_lengkap) {
            toast.error('Email dan nama wajib diisi');
            return;
        }
        if (!isEdit && !form.password) {
            toast.error('Password wajib diisi untuk akun baru');
            return;
        }
        setSaving(true);
        try {
            await onSave(form);
            onClose();
        } catch (err) {
            toast.error('Error: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="label">Nama Lengkap</label>
                <input className="input-field" value={form.nama_lengkap} onChange={handle('nama_lengkap')} placeholder="Pak Rahmat" />
            </div>
            <div>
                <label className="label">Email</label>
                <input className="input-field" type="email" value={form.email} onChange={handle('email')} placeholder="petugas@email.com" disabled={isEdit} />
            </div>
            <div>
                <label className="label">{isEdit ? 'Password Baru (kosongkan jika tidak diubah)' : 'Password'}</label>
                <input className="input-field" type="password" value={form.password} onChange={handle('password')} placeholder="min. 6 karakter" />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="label">Role</label>
                    <select className="input-field" value={form.role} onChange={handle('role')}>
                        <option value="petugas">Petugas</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                {form.role === 'petugas' && (
                    <div>
                        <label className="label">Stand / Dukuh</label>
                        <select className="input-field" value={form.stand_id} onChange={handle('stand_id')}>
                            {STANDS.map(s => <option key={s} value={s}>{getDukuhName(s)}</option>)}
                        </select>
                    </div>
                )}
            </div>
            <div className="flex gap-3 pt-2">
                <button type="button" onClick={onClose} className="btn-secondary flex-1">Batal</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : (isEdit ? 'Simpan' : 'Buat Akun')}
                </button>
            </div>
        </form>
    );
}

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, 'users'), (snap) => {
            setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return unsub;
    }, []);

    const handleCreate = async (form) => {
        // Create Firebase Auth user using secondary app
        const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
        await fbSignOut(secondaryAuth);
        // Save to Firestore
        await setDoc(doc(db, 'users', cred.user.uid), {
            email: form.email,
            nama_lengkap: form.nama_lengkap,
            role: form.role,
            stand_id: form.role === 'petugas' ? form.stand_id : null,
            created_at: serverTimestamp(),
            last_login: null,
        });
        toast.success('Akun berhasil dibuat');
    };

    const handleEdit = async (form) => {
        const userDoc = { nama_lengkap: form.nama_lengkap, role: form.role };
        if (form.role === 'petugas') userDoc.stand_id = form.stand_id;
        await setDoc(doc(db, 'users', editUser.id), userDoc, { merge: true });
        toast.success('Data pengguna diperbarui');
    };

    const handleDelete = async (u) => {
        if (!window.confirm(`Hapus akun ${u.nama_lengkap}? Data Firestore akan dihapus (Auth account tetap ada).`)) return;
        setDeleting(u.id);
        try {
            await deleteDoc(doc(db, 'users', u.id));
            toast.success('Data pengguna dihapus');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setDeleting(null);
        }
    };

    const admins = users.filter(u => u.role === 'admin');
    const petugas = users.filter(u => u.role === 'petugas');

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Manajemen Pengguna</h1>
                    <p className="text-gray-400 text-sm mt-0.5">{users.length} akun terdaftar</p>
                </div>
                <button onClick={() => { setEditUser(null); setShowModal(true); }} className="btn-primary">
                    <UserPlus size={18} /> Tambah Akun
                </button>
            </div>

            {/* Admin list */}
            {admins.length > 0 && (
                <div className="card">
                    <h2 className="text-base font-semibold text-primary-400 mb-3 flex items-center gap-2">
                        <Shield size={16} /> Administrator ({admins.length})
                    </h2>
                    <div className="space-y-2">
                        {admins.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-surface-700 border border-surface-500">
                                <div>
                                    <p className="font-medium text-white">{u.nama_lengkap}</p>
                                    <p className="text-xs text-gray-400">{u.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => { setEditUser(u); setShowModal(true); }} className="p-2 rounded-lg text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
                                        <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(u)} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Petugas list */}
            <div className="card">
                <h2 className="text-base font-semibold text-primary-400 mb-3 flex items-center gap-2">
                    <Users size={16} /> Petugas ({petugas.length})
                </h2>
                {petugas.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Belum ada petugas. Klik "Tambah Akun" untuk membuat.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-surface-600">
                                    <th className="table-header text-left">Nama</th>
                                    <th className="table-header text-left">Email</th>
                                    <th className="table-header text-left">Stand</th>
                                    <th className="table-header text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {petugas.map(u => (
                                    <tr key={u.id} className="table-row">
                                        <td className="table-cell font-medium text-white">{u.nama_lengkap}</td>
                                        <td className="table-cell text-gray-400">{u.email}</td>
                                        <td className="table-cell">
                                            <span className="badge bg-primary-500/20 text-primary-400">{getDukuhName(u.stand_id)}</span>
                                        </td>
                                        <td className="table-cell text-right">
                                            <div className="flex gap-2 justify-end">
                                                <button onClick={() => { setEditUser(u); setShowModal(true); }} className="p-2 rounded-lg text-gray-400 hover:text-primary-400 hover:bg-primary-500/10 transition-colors">
                                                    <Pencil size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(u)} disabled={deleting === u.id} className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editUser ? 'Edit Pengguna' : 'Tambah Akun Baru'}
            >
                <UserForm
                    initial={editUser}
                    isEdit={!!editUser}
                    onSave={editUser ? handleEdit : handleCreate}
                    onClose={() => setShowModal(false)}
                />
            </Modal>
        </div>
    );
}
