// ユーザー管理システム
class UserManagement {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.checkAuth();
        this.init();
    }

    checkAuth() {
        this.currentUser = AuthenticationSystem.getCurrentUser();
        if (!this.currentUser || !this.currentUser.permissions.includes('manage_users')) {
            alert('⚠️ 管理者権限が必要です');
            window.location.href = 'dashboard';
            return;
        }
    }

    async init() {
        await this.loadUsers();
        this.displayUsers();
        this.displayStatistics();
        this.setupEventListeners();
    }

    async loadUsers() {
        try {
            // LocalStorageからユーザーデータを読み込み
            const storedUsers = localStorage.getItem('system_users');
            if (storedUsers) {
                this.users = JSON.parse(storedUsers);
            } else {
                // デフォルトユーザーを作成
                this.users = [
                    {
                        id: 'admin',
                        displayName: '管理者',
                        role: 'admin',
                        permissions: ['read', 'write', 'delete', 'manage_users'],
                        createdAt: new Date().toISOString(),
                        lastLoginAt: new Date().toISOString(),
                        isActive: true
                    },
                    {
                        id: 'user1',
                        displayName: 'テストユーザー',
                        role: 'user',
                        permissions: ['read'],
                        createdAt: new Date().toISOString(),
                        lastLoginAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                        isActive: true
                    }
                ];
                this.saveUsers();
            }
        } catch (error) {
            console.error('Failed to load users:', error);
            this.users = [];
        }
    }

    saveUsers() {
        try {
            localStorage.setItem('system_users', JSON.stringify(this.users));
        } catch (error) {
            console.error('Failed to save users:', error);
        }
    }

    displayUsers() {
        const tbody = document.getElementById('userTableBody');
        
        if (this.users.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; color: #6b7280;">
                        ユーザーが登録されていません
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.users.map(user => {
            const lastLogin = new Date(user.lastLoginAt).toLocaleDateString('ja-JP');
            const isOnline = this.isUserOnline(user);
            
            return `
                <tr>
                    <td>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <div class="user-avatar">${user.displayName.charAt(0)}</div>
                            <div>
                                <div style="font-weight: 600;">${user.displayName}</div>
                                <div style="font-size: 12px; color: #6b7280;">@${user.id}</div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="role-badge role-${user.role}">
                            ${this.getRoleDisplayName(user.role)}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge status-${isOnline ? 'online' : 'offline'}">
                            ${isOnline ? 'オンライン' : 'オフライン'}
                        </span>
                    </td>
                    <td>${lastLogin}</td>
                    <td>
                        <button class="btn-action btn-edit" onclick="editUser('${user.id}')">編集</button>
                        ${user.id !== 'admin' ? `<button class="btn-action btn-delete" onclick="deleteUser('${user.id}')">削除</button>` : ''}
                    </td>
                </tr>
            `;
        }).join('');
    }

    displayStatistics() {
        const totalUsers = this.users.length;
        const activeUsers = this.users.filter(u => u.isActive).length;
        const adminCount = this.users.filter(u => u.role === 'admin').length;
        const userCount = this.users.filter(u => u.role === 'user').length;

        document.getElementById('totalUsers').textContent = totalUsers;
        document.getElementById('activeUsersCount').textContent = activeUsers;
        document.getElementById('adminCount').textContent = adminCount;
        document.getElementById('userCount').textContent = userCount;
    }

    isUserOnline(user) {
        // 最終ログインが1時間以内であればオンラインとみなす
        const lastLogin = new Date(user.lastLoginAt);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return lastLogin > oneHourAgo;
    }

    getRoleDisplayName(role) {
        const roleNames = {
            'admin': '管理者',
            'user': 'ユーザー'
        };
        return roleNames[role] || role;
    }

    setupEventListeners() {
        // 新規ユーザー追加フォーム
        document.getElementById('addUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addUser();
        });

        // ユーザー編集フォーム
        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUser();
        });
    }

    showAddUserModal() {
        document.getElementById('addUserModal').style.display = 'block';
        document.getElementById('addUserForm').reset();
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    async addUser() {
        const userId = document.getElementById('newUserId').value.trim();
        const displayName = document.getElementById('newUserName').value.trim();
        const password = document.getElementById('newUserPassword').value;
        const role = document.getElementById('newUserRole').value;

        // バリデーション
        if (!userId || !displayName || !password) {
            alert('すべての項目を入力してください');
            return;
        }

        if (password.length < 8) {
            alert('パスワードは8文字以上で入力してください');
            return;
        }

        if (this.users.find(u => u.id === userId)) {
            alert('そのユーザーIDは既に使用されています');
            return;
        }

        // 権限を設定
        const permissions = role === 'admin' ? 
            ['read', 'write', 'delete', 'manage_users'] : 
            ['read'];

        const newUser = {
            id: userId,
            displayName: displayName,
            role: role,
            permissions: permissions,
            passwordHash: this.hashPassword(password), // 実際の実装では適切なハッシュ化が必要
            createdAt: new Date().toISOString(),
            lastLoginAt: null,
            isActive: true
        };

        this.users.push(newUser);
        this.saveUsers();
        this.displayUsers();
        this.displayStatistics();
        this.closeModal('addUserModal');
        
        this.showToast(`ユーザー「${displayName}」を追加しました`, 'success');
    }

    editUser(userId) {
        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserName').value = user.displayName;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserPassword').value = '';
        
        document.getElementById('editUserModal').style.display = 'block';
    }

    async updateUser() {
        const userId = document.getElementById('editUserId').value;
        const displayName = document.getElementById('editUserName').value.trim();
        const role = document.getElementById('editUserRole').value;
        const newPassword = document.getElementById('editUserPassword').value;

        if (!displayName) {
            alert('表示名を入力してください');
            return;
        }

        const userIndex = this.users.findIndex(u => u.id === userId);
        if (userIndex === -1) return;

        // ユーザー情報を更新
        this.users[userIndex].displayName = displayName;
        this.users[userIndex].role = role;
        
        // 権限を更新
        this.users[userIndex].permissions = role === 'admin' ? 
            ['read', 'write', 'delete', 'manage_users'] : 
            ['read'];

        // パスワードが入力されていれば更新
        if (newPassword && newPassword.length >= 8) {
            this.users[userIndex].passwordHash = this.hashPassword(newPassword);
        }

        this.users[userIndex].updatedAt = new Date().toISOString();

        this.saveUsers();
        this.displayUsers();
        this.displayStatistics();
        this.closeModal('editUserModal');
        
        this.showToast(`ユーザー「${displayName}」を更新しました`, 'success');
    }

    deleteUser(userId) {
        if (userId === 'admin') {
            alert('管理者アカウントは削除できません');
            return;
        }

        const user = this.users.find(u => u.id === userId);
        if (!user) return;

        if (confirm(`ユーザー「${user.displayName}」を削除しますか？この操作は取り消せません。`)) {
            this.users = this.users.filter(u => u.id !== userId);
            this.saveUsers();
            this.displayUsers();
            this.displayStatistics();
            
            this.showToast(`ユーザー「${user.displayName}」を削除しました`, 'success');
        }
    }

    exportUsers() {
        const exportData = {
            exportDate: new Date().toISOString(),
            totalUsers: this.users.length,
            users: this.users.map(user => ({
                id: user.id,
                displayName: user.displayName,
                role: user.role,
                permissions: user.permissions,
                createdAt: user.createdAt,
                lastLoginAt: user.lastLoginAt,
                isActive: user.isActive
                // パスワードハッシュは除外
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    hashPassword(password) {
        // 簡易的なハッシュ化（実際の実装では適切な暗号化ライブラリを使用）
        return btoa(password + 'salt');
    }

    showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: ${type === 'error' ? '#ef4444' : '#22c55e'};
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            font-weight: 600;
            z-index: 9999;
            transform: translateX(100px);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);
        setTimeout(() => {
            toast.style.transform = 'translateX(100px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    showBulkActionsModal() {
        alert('一括操作機能は開発中です');
    }
}

// グローバル関数
let userManagement;

function showAddUserModal() {
    if (userManagement) {
        userManagement.showAddUserModal();
    }
}

function closeModal(modalId) {
    if (userManagement) {
        userManagement.closeModal(modalId);
    }
}

function editUser(userId) {
    if (userManagement) {
        userManagement.editUser(userId);
    }
}

function deleteUser(userId) {
    if (userManagement) {
        userManagement.deleteUser(userId);
    }
}

function exportUsers() {
    if (userManagement) {
        userManagement.exportUsers();
    }
}

function showBulkActionsModal() {
    if (userManagement) {
        userManagement.showBulkActionsModal();
    }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    userManagement = new UserManagement();
});

// モーダル外クリックで閉じる
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});