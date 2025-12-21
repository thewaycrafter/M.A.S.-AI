'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getUser, getToken } from '@/utils/auth';
import Navigation from '@/components/Navigation';
import styles from '../admin.module.css';

// --- Create User Modal Component ---
const CreateUserModal = ({ onClose, onSave }: { onClose: () => void, onSave: (data: any) => Promise<void> }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        role: 'user',
        subscriptionTier: 'free'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>Create New User</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Username *</label>
                        <input
                            type="text"
                            required
                            className={styles.input}
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email *</label>
                        <input
                            type="email"
                            required
                            className={styles.input}
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Password *</label>
                        <input
                            type="password"
                            required
                            minLength={6}
                            className={styles.input}
                            value={formData.password}
                            onChange={e => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>
                    <div className={styles.row}>
                        <div className={styles.formGroup} style={{ flex: 1, marginRight: '10px' }}>
                            <label className={styles.label}>First Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.firstName}
                                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup} style={{ flex: 1 }}>
                            <label className={styles.label}>Last Name</label>
                            <input
                                type="text"
                                className={styles.input}
                                value={formData.lastName}
                                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Role</label>
                        <select
                            className={styles.select}
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Subscription Plan</label>
                        <select
                            className={styles.select}
                            value={formData.subscriptionTier}
                            onChange={e => setFormData({ ...formData, subscriptionTier: e.target.value })}
                        >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.btn} style={{ background: '#333' }}>Cancel</button>
                        <button type="submit" className={`${styles.btn} ${styles.btnApprove}`}>Create User</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Edit User Modal Component ---
const EditUserModal = ({ user, onClose, onSave }: { user: any, onClose: () => void, onSave: (data: any) => Promise<void> }) => {
    const [formData, setFormData] = useState({
        role: user.role,
        subscriptionTier: user.subscription?.tier || 'free',
        isEmailVerified: user.isEmailVerified || false,
        firstName: user.profile?.firstName || '',
        lastName: user.profile?.lastName || ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await onSave(formData);
    };

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <div className={styles.modalHeader}>
                    <h3>Edit User: {user.username}</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Role</label>
                        <select
                            className={styles.select}
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Subscription Plan</label>
                        <select
                            className={styles.select}
                            value={formData.subscriptionTier}
                            onChange={e => setFormData({ ...formData, subscriptionTier: e.target.value })}
                        >
                            <option value="free">Free</option>
                            <option value="pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            <input
                                type="checkbox"
                                checked={formData.isEmailVerified}
                                onChange={e => setFormData({ ...formData, isEmailVerified: e.target.checked })}
                                style={{ marginRight: '10px' }}
                            />
                            Email Verified
                        </label>
                        <small style={{ color: '#666' }}>Force manual verification if email delivery fails.</small>
                    </div>

                    <div className={styles.modalActions}>
                        <button type="button" onClick={onClose} className={styles.btn} style={{ background: '#333' }}>Cancel</button>
                        <button type="submit" className={`${styles.btn} ${styles.btnApprove}`}>Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function UserManagementPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [error, setError] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    const [processing, setProcessing] = useState(false);
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [isCreatingUser, setIsCreatingUser] = useState(false);

    useEffect(() => {
        const user = getUser();
        if (!isAuthenticated() || user?.role !== 'admin') {
            router.push('/dashboard');
            return;
        }

        fetchUsers();
    }, [router]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const queryParams = new URLSearchParams({ limit: '50' });
            if (search) queryParams.append('search', search);

            const response = await fetch(`http://localhost:3001/api/admin/users?${queryParams.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            if (response.ok) {
                setUsers(data.users || []);
            } else {
                setError(data.error || 'Failed to fetch users');
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
            setError('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchUsers();
    };

    const toggleSelectUser = (userId: string) => {
        const newSelected = new Set(selectedUsers);
        if (newSelected.has(userId)) {
            newSelected.delete(userId);
        } else {
            newSelected.add(userId);
        }
        setSelectedUsers(newSelected);
    };

    const toggleSelectAll = () => {
        if (selectedUsers.size === users.filter(u => u.role !== 'admin').length) {
            setSelectedUsers(new Set());
        } else {
            // Select all non-admin users (prevent manipulating other admins easily)
            const allUserIds = users.filter(u => u.role !== 'admin').map(u => u._id);
            setSelectedUsers(new Set(allUserIds));
        }
    };

    const handleBulkAction = async (action: 'block' | 'unblock' | 'reset-link' | 'delete' | 'change-role' | 'change-plan') => {
        if (selectedUsers.size === 0) return;

        let extraData: any = {};

        // Handle parameterized bulk actions
        if (action === 'change-role') {
            const role = prompt('Enter new role (user/admin):');
            if (!role || !['user', 'admin'].includes(role)) return alert('Invalid role');
            extraData = { role };
        }
        if (action === 'change-plan') {
            const tier = prompt('Enter new plan (free/pro/enterprise):');
            if (!tier || !['free', 'pro', 'enterprise'].includes(tier)) return alert('Invalid plan');
            extraData = { subscriptionTier: tier };
        }

        const actionMap = {
            'block': 'Block',
            'unblock': 'Unblock',
            'reset-link': 'Send Password Reset Link to',
            'delete': 'PERMANENTLY DELETE',
            'change-role': `Change Role to ${extraData.role} for`,
            'change-plan': `Change Plan to ${extraData.subscriptionTier} for`
        };

        if (!confirm(`Are you sure you want to ${actionMap[action]} ${selectedUsers.size} user(s)?`)) return;

        setProcessing(true);
        const token = getToken();
        let successCount = 0;
        let failCount = 0;

        for (const userId of Array.from(selectedUsers)) {
            try {
                let endpoint = '';
                let method = 'POST';
                let body: any = {};

                switch (action) {
                    case 'block':
                        endpoint = `http://localhost:3001/api/admin/users/${userId}/block`;
                        body = { reason: 'Bulk admin block' };
                        break;
                    case 'unblock':
                        endpoint = `http://localhost:3001/api/admin/users/${userId}/unblock`;
                        break;
                    case 'reset-link':
                        endpoint = `http://localhost:3001/api/admin/users/${userId}/send-reset-link`;
                        break;
                    case 'delete':
                        endpoint = `http://localhost:3001/api/admin/users/${userId}`;
                        method = 'DELETE';
                        break;
                    case 'change-role':
                    case 'change-plan':
                        endpoint = `http://localhost:3001/api/admin/users/${userId}`;
                        method = 'PATCH';
                        body = extraData;
                        break;
                }

                const response = await fetch(endpoint, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: method === 'POST' || method === 'PATCH' ? JSON.stringify(body) : undefined
                });

                if (response.ok) successCount++;
                else failCount++;

            } catch (err) {
                console.error(`Failed to process user ${userId}:`, err);
                failCount++;
            }
        }

        setProcessing(false);
        setSelectedUsers(new Set());
        fetchUsers();
        alert(`Action complete.\nSuccess: ${successCount}\nFailed: ${failCount}`);
    };

    const handleCreateUser = async (data: any) => {
        try {
            const token = getToken();
            const response = await fetch('http://localhost:3001/api/admin/users', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                setIsCreatingUser(false);
                fetchUsers();
                alert('User created successfully!');
            } else {
                const err = await response.json();
                alert(err.error || 'Creation failed');
            }
        } catch (error) {
            console.error('Create error:', error);
            alert('Failed to create user');
        }
    };

    const handleSaveUser = async (data: any) => {
        if (!editingUser) return;

        try {
            const token = getToken();
            const response = await fetch(`http://localhost:3001/api/admin/users/${editingUser._id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                setEditingUser(null);
                fetchUsers();
            } else {
                const err = await response.json();
                alert(err.error || 'Update failed');
            }
        } catch (error) {
            console.error('Save error:', error);
            alert('Failed to save changes');
        }
    };

    const toggleBlockUser = async (userId: string, isBlocked: boolean) => {
        if (!confirm(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`)) return;

        try {
            const token = getToken();
            const endpoint = isBlocked
                ? `http://localhost:3001/api/admin/users/${userId}/unblock`
                : `http://localhost:3001/api/admin/users/${userId}/block`;

            const body = isBlocked ? {} : { reason: 'Admin manual block' };

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                fetchUsers();
            } else {
                const data = await response.json();
                alert(data.error || 'Action failed');
            }
        } catch (err) {
            console.error('Action error:', err);
            alert('Failed to perform action');
        }
    };

    const deleteUser = async (userId: string) => {
        if (!confirm('WARNING: This will permanently delete the user and all their data. This action cannot be undone. Continue?')) return;

        try {
            const token = getToken();
            const response = await fetch(`http://localhost:3001/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                fetchUsers();
            } else {
                const data = await response.json();
                alert(data.error || 'Delete failed');
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('Failed to delete user');
        }
    };

    return (
        <div>
            <Navigation />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerTop}>
                        <div>
                            <h1 className={styles.title}>User Management</h1>
                            <p className={styles.subtitle}>Manage platform users, subscriptions, and access controls</p>
                        </div>
                        <button
                            className={`${styles.btn} ${styles.btnApprove}`}
                            onClick={() => setIsCreatingUser(true)}
                        >
                            + Create User
                        </button>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.tableHeader}>
                        <h3>All Users ({users.length})</h3>
                        <form onSubmit={handleSearch}>
                            <input
                                type="text"
                                placeholder="Search by username or email..."
                                className={styles.search}
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </form>
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    {loading ? (
                        <div className={styles.loading}>Loading users...</div>
                    ) : (
                        <div className={styles.tableResponsive}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>
                                            <input
                                                type="checkbox"
                                                className={styles.checkbox}
                                                checked={users.length > 0 && selectedUsers.size === users.filter(u => u.role !== 'admin').length}
                                                onChange={toggleSelectAll}
                                            />
                                        </th>
                                        <th>User</th>
                                        <th>Role</th>
                                        <th>Plan</th>
                                        <th>Status</th>
                                        <th>Joined</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.length > 0 ? (
                                        users.map((user) => (
                                            <tr key={user._id} className={styles.userRow}>
                                                <td>
                                                    {user.role !== 'admin' && (
                                                        <input
                                                            type="checkbox"
                                                            className={styles.checkbox}
                                                            checked={selectedUsers.has(user._id)}
                                                            onChange={() => toggleSelectUser(user._id)}
                                                        />
                                                    )}
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{user.username}</div>
                                                    <div className={styles.emailSmall}>{user.email}</div>
                                                </td>
                                                <td>
                                                    <span className={`${styles.badge} ${user.role === 'admin' ? styles.admin : styles.free}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`${styles.badge} ${user.subscription?.tier === 'pro' ? styles.pro : styles.free}`}>
                                                        {user.subscription?.tier || 'free'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {user.isBlocked ? (
                                                        <span style={{ color: '#ff3333', fontSize: '0.8rem' }}>BLOCKED</span>
                                                    ) : (
                                                        <span style={{ color: '#00ff41', fontSize: '0.8rem' }}>ACTIVE</span>
                                                    )}
                                                </td>
                                                <td style={{ fontSize: '0.8rem', color: '#888' }}>
                                                    {new Date(user.createdAt).toLocaleDateString()}
                                                </td>
                                                <td className={styles.actionsCell}>
                                                    <button
                                                        className={styles.actionBtn}
                                                        onClick={() => setEditingUser(user)}
                                                        title="Edit User"
                                                    >
                                                        EDIT
                                                    </button>
                                                    <button
                                                        className={`${styles.btn} ${user.isBlocked ? styles.btnApprove : styles.btnDeny}`}
                                                        onClick={() => toggleBlockUser(user._id, user.isBlocked)}
                                                        title={user.isBlocked ? "Unblock User" : "Block User"}
                                                    >
                                                        {user.isBlocked ? 'UNBLOCK' : 'BLOCK'}
                                                    </button>

                                                    {user.role !== 'admin' && (
                                                        <button
                                                            className={styles.actionBtn}
                                                            style={{ borderColor: '#ff3333', color: '#ff3333' }}
                                                            onClick={() => deleteUser(user._id)}
                                                            title="Delete User"
                                                        >
                                                            DELETE
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className={styles.emptyState}>
                                                No users found matching your search.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Bulk Actions Toolbar */}
            {selectedUsers.size > 0 && (
                <div className={styles.bulkToolbar}>
                    <div className={styles.selectedCount}>
                        {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
                    </div>
                    <div className={styles.bulkActions}>
                        <button
                            className={styles.actionBtn}
                            onClick={() => handleBulkAction('change-role')}
                            disabled={processing}
                        >
                            Change Role
                        </button>
                        <button
                            className={styles.actionBtn}
                            onClick={() => handleBulkAction('change-plan')}
                            disabled={processing}
                        >
                            Change Plan
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnApprove}`}
                            onClick={() => handleBulkAction('unblock')}
                            disabled={processing}
                        >
                            Unblock
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnDeny}`}
                            onClick={() => handleBulkAction('block')}
                            disabled={processing}
                        >
                            Block
                        </button>
                        <button
                            className={styles.actionBtn}
                            onClick={() => handleBulkAction('reset-link')}
                            disabled={processing}
                        >
                            Send Reset Link
                        </button>
                        <button
                            className={styles.actionBtn}
                            style={{ borderColor: '#ff3333', color: '#ff3333' }}
                            onClick={() => handleBulkAction('delete')}
                            disabled={processing}
                        >
                            Delete
                        </button>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <EditUserModal
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveUser}
                />
            )}

            {/* Create User Modal */}
            {isCreatingUser && (
                <CreateUserModal
                    onClose={() => setIsCreatingUser(false)}
                    onSave={handleCreateUser}
                />
            )}
        </div>
    );
}

