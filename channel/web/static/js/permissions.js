/* =====================================================================
   权限管理页面 - JavaScript
   ===================================================================== */

// =====================================================================
// 权限管理页面状态
// =====================================================================
let permissionsState = {
    knowledgeViewMode: 'folder', // 'folder' or 'user'
    currentTab: 'knowledge',
    enabledLoaded: false,
    // 缓存数据用于搜索/筛选
    cachedKnowledgeFolders: [],
    cachedKnowledgeUsersData: null,
    cachedKnowledgeConfig: null,
    cachedKingdeeUsersData: null,
    cachedKingdeeConfig: null
};

// =====================================================================
// Tab 切换
// =====================================================================
function switchPermissionsTab(tab) {
    permissionsState.currentTab = tab;

    // Update tab buttons
    document.getElementById('permissions-tab-knowledge').className = 'px-4 py-2 text-sm font-medium border-b-2 ' +
        (tab === 'knowledge' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300 text-slate-500 dark:text-slate-400') + ' transition-colors cursor-pointer';
    document.getElementById('permissions-tab-kingdee').className = 'px-4 py-2 text-sm font-medium border-b-2 ' +
        (tab === 'kingdee' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300 text-slate-500 dark:text-slate-400') + ' transition-colors cursor-pointer';
    document.getElementById('permissions-tab-audit').className = 'px-4 py-2 text-sm font-medium border-b-2 ' +
        (tab === 'audit' ? 'border-primary-500 text-primary-600 dark:text-primary-400' : 'border-transparent hover:text-slate-700 dark:hover:text-slate-300 text-slate-500 dark:text-slate-400') + ' transition-colors cursor-pointer';

    // Show/hide panels
    document.getElementById('permissions-knowledge-panel').classList.toggle('hidden', tab !== 'knowledge');
    document.getElementById('permissions-kingdee-panel').classList.toggle('hidden', tab !== 'kingdee');
    document.getElementById('permissions-audit-panel').classList.toggle('hidden', tab !== 'audit');

    // Load data
    if (tab === 'knowledge') {
        loadPermissionsKnowledge();
    } else if (tab === 'kingdee') {
        loadPermissionsKingdee();
    } else if (tab === 'audit') {
        loadPermissionsAudit();
    }
    
    // Load enabled state (only once per page view)
    if (!permissionsState.enabledLoaded) {
        loadPermissionsEnabled();
        permissionsState.enabledLoaded = true;
    }
}

// =====================================================================
// 知识库权限管理
// =====================================================================
function switchKnowledgeViewMode(mode) {
    permissionsState.knowledgeViewMode = mode;

    // Update buttons
    document.getElementById('permissions-knowledge-view-folder').className = 'px-3 py-1.5 text-xs font-medium rounded-lg ' +
        (mode === 'folder' ? 'bg-primary-500 text-white' : 'border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700') + ' transition-colors cursor-pointer';
    document.getElementById('permissions-knowledge-view-user').className = 'px-3 py-1.5 text-xs font-medium rounded-lg ' +
        (mode === 'user' ? 'bg-primary-500 text-white' : 'border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700') + ' transition-colors cursor-pointer';

    // Show/hide views
    document.getElementById('permissions-knowledge-folder-view').classList.toggle('hidden', mode !== 'folder');
    document.getElementById('permissions-knowledge-user-view').classList.toggle('hidden', mode !== 'user');

    // Re-render using cached data so the newly visible view gets populated
    if (permissionsState.cachedKnowledgeUsersData) {
        applyKnowledgeFilters();
    }
}

function loadPermissionsKnowledge() {
    // Load folders and users in parallel
    Promise.all([
        fetch('/api/permissions/folders').then(r => r.json()),
        fetch('/api/permissions/users').then(r => r.json()),
        fetch('/api/permissions/config').then(r => r.json())
    ]).then(([foldersData, usersData, configData]) => {
        if (foldersData.status === 'success' && usersData.status === 'success' && configData.status === 'success') {
            // 缓存数据供搜索/筛选使用
            permissionsState.cachedKnowledgeFolders = foldersData.data.folders;
            permissionsState.cachedKnowledgeUsersData = usersData.data;
            permissionsState.cachedKnowledgeConfig = configData.data;

            // 填充部门下拉框
            populateDepartmentFilter('permissions-knowledge-department-filter', usersData.data.users || []);

            // 读取当前的搜索词和部门筛选值
            const searchTerm = document.getElementById('permissions-knowledge-search')?.value || '';
            const department = document.getElementById('permissions-knowledge-department-filter')?.value || '';

            renderPermissionsKnowledge(foldersData.data.folders, usersData.data, configData.data, searchTerm, department);
        }
    }).catch(err => {
        console.error('[Permissions] Failed to load knowledge permissions:', err);
    });
}

function renderPermissionsKnowledge(folders, usersData, config, searchTerm, department) {
    if (permissionsState.knowledgeViewMode === 'folder') {
        renderPermissionsKnowledgeByFolder(folders, usersData, config, searchTerm, department);
    } else {
        renderPermissionsKnowledgeByUser(folders, usersData, config, searchTerm, department);
    }
}

function renderPermissionsKnowledgeByFolder(folders, usersData, config, searchTerm, department) {
    const tbody = document.getElementById('permissions-knowledge-folder-tbody');
    tbody.innerHTML = '';

    const folderPermissions = config.folder_permissions || {};
    const users = usersData.users || [];

    // Build userid -> name mapping
    const userIdToName = {};
    users.forEach(u => {
        userIdToName[u.userid] = u.name;
    });

    // 过滤文件夹：搜索匹配文件夹名或该文件夹下的用户
    const filteredFolders = folders.filter(folder => {
        if (!searchTerm) return true;
        const q = searchTerm.toLowerCase();
        // 匹配文件夹名
        if (folder.toLowerCase().includes(q)) return true;
        // 匹配该文件夹有权限的用户名
        const allowedUsers = folderPermissions[folder] || [];
        return allowedUsers.some(u => (userIdToName[u] || u).toLowerCase().includes(q));
    });

    filteredFolders.forEach(folder => {
        const allowedUsers = folderPermissions[folder] || [];
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50';
        tr.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <i class="fas fa-folder text-yellow-500 text-sm"></i>
                    <span class="font-medium text-slate-700 dark:text-slate-300">${escapeHtml(folder)}</span>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                    ${allowedUsers.length > 0 ?
                        allowedUsers.map(u => `<span class="px-2 py-0.5 text-xs rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400" title="${escapeHtml(u)}">${escapeHtml(userIdToName[u] || u)}</span>`).join('') :
                        '<span class="text-xs text-slate-400">无访问权限</span>'
                    }
                </div>
            </td>
            <td class="px-4 py-3 text-right">
                <button onclick="openPermissionsFolderModal('${escapeHtml(folder)}')"
                        class="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    编辑
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderPermissionsKnowledgeByUser(folders, usersData, config, searchTerm, department) {
    const tbody = document.getElementById('permissions-knowledge-user-tbody');
    tbody.innerHTML = '';

    const users = usersData.users || [];
    const folderPermissions = config.folder_permissions || {};

    // Build user -> folders mapping
    const userFolders = {};
    Object.entries(folderPermissions).forEach(([folder, userList]) => {
        userList.forEach(user => {
            if (!userFolders[user]) userFolders[user] = [];
            userFolders[user].push(folder);
        });
    });

    // 过滤用户：搜索匹配用户名 + 部门筛选
    const filteredUsers = users.filter(user => {
        if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (department && user.department !== department) return false;
        return true;
    });

    filteredUsers.forEach(user => {
        const userFolderList = userFolders[user.userid] || [];
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50';
        tr.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <i class="fas fa-user text-slate-400 text-sm"></i>
                    <span class="font-medium text-slate-700 dark:text-slate-300">${escapeHtml(user.name)}</span>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                ${escapeHtml(user.department)}
            </td>
            <td class="px-4 py-3">
                <div class="flex flex-wrap gap-1">
                    ${userFolderList.length > 0 ?
                        userFolderList.map(f => `<span class="px-2 py-0.5 text-xs rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">${escapeHtml(f)}</span>`).join('') :
                        '<span class="text-xs text-slate-400">无访问权限</span>'
                    }
                </div>
            </td>
            <td class="px-4 py-3 text-right">
                <button onclick="openPermissionsUserModal('${escapeHtml(user.userid)}', '${escapeHtml(user.name)}')"
                        class="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    编辑
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// =====================================================================
// 文件夹权限模态框
// =====================================================================
let currentFolderModal = { folder: '', users: [] };

function openPermissionsFolderModal(folder) {
    currentFolderModal.folder = folder;
    document.getElementById('permissions-folder-modal-folder-name').textContent = folder;

    // Load users and config
    Promise.all([
        fetch('/api/permissions/users').then(r => r.json()),
        fetch('/api/permissions/config').then(r => r.json())
    ]).then(([usersData, configData]) => {
        const users = (usersData.data && usersData.data.users) || [];
        const folderPermissions = configData.data.folder_permissions || {};
        const allowedUsers = folderPermissions[folder] || [];

        // 保存用户数据供模态框内搜索使用
        currentFolderModal.users = users;
        currentFolderModal.allowedUsers = allowedUsers;

        renderFolderModalUserList(users, allowedUsers, '');

        document.getElementById('permissions-folder-modal-overlay').classList.remove('hidden');

        // 绑定模态框搜索事件（移除旧监听避免重复）
        const searchInput = document.getElementById('permissions-folder-modal-search');
        if (searchInput) {
            const newSearch = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearch, searchInput);
            newSearch.addEventListener('input', function() {
                renderFolderModalUserList(currentFolderModal.users, currentFolderModal.allowedUsers, this.value);
            });
            newSearch.value = '';
            newSearch.focus();
        }
    });
}

function renderFolderModalUserList(users, allowedUsers, searchTerm) {
    const container = document.getElementById('permissions-folder-modal-users');
    container.innerHTML = '';

    const filteredUsers = searchTerm
        ? users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())))
        : users;

    filteredUsers.forEach(user => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        div.innerHTML = `
            <input type="checkbox" id="folder-user-${escapeHtml(user.userid)}" value="${escapeHtml(user.userid)}"
                   ${allowedUsers.includes(user.userid) ? 'checked' : ''}
                   class="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500">
            <label for="folder-user-${escapeHtml(user.userid)}" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                ${escapeHtml(user.name)}${user.department ? ` (${escapeHtml(user.department)})` : ''}
            </label>
        `;
        container.appendChild(div);
    });

    // 更新计数
    const count = document.getElementById('permissions-folder-modal-count');
    if (count) count.textContent = `${filteredUsers.length} 人`;
}

function closePermissionsFolderModal() {
    document.getElementById('permissions-folder-modal-overlay').classList.add('hidden');
}

function savePermissionsFolderModal() {
    const folder = currentFolderModal.folder;
    const checkboxes = document.querySelectorAll('#permissions-folder-modal-users input[type="checkbox"]');
    const allowedUsers = [];
    checkboxes.forEach(cb => {
        if (cb.checked) allowedUsers.push(cb.value);
    });

    // Save to config
    fetch('/api/permissions/config').then(r => r.json()).then(data => {
        const config = data.data;
        if (!config.folder_permissions) config.folder_permissions = {};
        config.folder_permissions[folder] = allowedUsers;

        // Add audit log
        const nameMap = {};
        (currentFolderModal.users || []).forEach(u => { nameMap[u.userid] = u.name; });
        const userNames = allowedUsers.map(id => nameMap[id] || id);
        config.audit_log = config.audit_log || [];
        config.audit_log.push({
            timestamp: new Date().toISOString(),
            operator: 'admin', // TODO: get current user
            action: 'update',
            permission_type: 'knowledge',
            target: folder,
            details: `更新文件夹「${folder}」的访问权限: ${userNames.join('、')}`
        });

        return fetch('/api/permissions/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
    }).then(() => {
        closePermissionsFolderModal();
        loadPermissionsKnowledge();
    }).catch(err => {
        console.error('[Permissions] Failed to save folder permissions:', err);
    });
}

// =====================================================================
// 用户权限模态框
// =====================================================================
let currentUserModal = { userid: '', name: '', folders: [] };
let currentKingdeeModal = { userid: '', name: '' };

function openPermissionsUserModal(userid, name) {
    currentUserModal.userid = userid;
    currentUserModal.name = name;
    document.getElementById('permissions-user-modal-user-name').textContent = name;

    // Load folders and config
    Promise.all([
        fetch('/api/permissions/folders').then(r => r.json()),
        fetch('/api/permissions/config').then(r => r.json())
    ]).then(([foldersData, configData]) => {
        const folders = foldersData.data.folders || [];
        const folderPermissions = configData.data.folder_permissions || {};

        // Build user's allowed folders
        const allowedFolders = [];
        Object.entries(folderPermissions).forEach(([folder, userList]) => {
            if (userList.includes(userid)) allowedFolders.push(folder);
        });

        // 保存数据供搜索使用
        currentUserModal.folders = folders;
        currentUserModal.allowedFolders = allowedFolders;

        renderUserModalFolderList(folders, allowedFolders, '');

        document.getElementById('permissions-user-modal-overlay').classList.remove('hidden');

        // 绑定模态框搜索事件（移除旧监听避免重复）
        const searchInput = document.getElementById('permissions-user-modal-search');
        if (searchInput) {
            const newSearch = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearch, searchInput);
            newSearch.addEventListener('input', function() {
                renderUserModalFolderList(currentUserModal.folders, currentUserModal.allowedFolders, this.value);
            });
            newSearch.value = '';
            newSearch.focus();
        }
    });
}

function renderUserModalFolderList(folders, allowedFolders, searchTerm) {
    const container = document.getElementById('permissions-user-modal-folders');
    container.innerHTML = '';

    const filteredFolders = searchTerm
        ? folders.filter(f => f.toLowerCase().includes(searchTerm.toLowerCase()))
        : folders;

    filteredFolders.forEach(folder => {
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        div.innerHTML = `
            <input type="checkbox" id="user-folder-${escapeHtml(folder)}" value="${escapeHtml(folder)}"
                   ${allowedFolders.includes(folder) ? 'checked' : ''}
                   class="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500">
            <label for="user-folder-${escapeHtml(folder)}" class="text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                <i class="fas fa-folder text-yellow-500 text-xs mr-1"></i>
                ${escapeHtml(folder)}
            </label>
        `;
        container.appendChild(div);
    });
}

function closePermissionsUserModal() {
    document.getElementById('permissions-user-modal-overlay').classList.add('hidden');
}

function savePermissionsUserModal() {
    const userid = currentUserModal.userid;
    const checkboxes = document.querySelectorAll('#permissions-user-modal-folders input[type="checkbox"]');
    const allowedFolders = [];
    checkboxes.forEach(cb => {
        if (cb.checked) allowedFolders.push(cb.value);
    });

    // Save to config
    fetch('/api/permissions/config').then(r => r.json()).then(data => {
        const config = data.data;
        if (!config.folder_permissions) config.folder_permissions = {};

        // Update folder_permissions: remove user from all folders, then add to allowed folders
        Object.keys(config.folder_permissions).forEach(folder => {
            config.folder_permissions[folder] = config.folder_permissions[folder].filter(u => u !== userid);
        });
        allowedFolders.forEach(folder => {
            if (!config.folder_permissions[folder]) config.folder_permissions[folder] = [];
            if (!config.folder_permissions[folder].includes(userid)) {
                config.folder_permissions[folder].push(userid);
            }
        });

        // Add audit log
        config.audit_log = config.audit_log || [];
        config.audit_log.push({
            timestamp: new Date().toISOString(),
            operator: 'admin',
            action: 'update',
            permission_type: 'knowledge',
            target: userid,
            details: `更新用户 ${currentUserModal.name} 的文件夹访问权限: ${allowedFolders.join(', ')}`
        });

        return fetch('/api/permissions/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
    }).then(() => {
        closePermissionsUserModal();
        loadPermissionsKnowledge();
    }).catch(err => {
        console.error('[Permissions] Failed to save user permissions:', err);
    });
}

// =====================================================================
// 金蝶权限管理
// =====================================================================
function loadPermissionsKingdee() {
    Promise.all([
        fetch('/api/permissions/users').then(r => r.json()),
        fetch('/api/permissions/config').then(r => r.json())
    ]).then(([usersData, configData]) => {
        if (usersData.status === 'success' && configData.status === 'success') {
            // 缓存数据供搜索/筛选使用
            permissionsState.cachedKingdeeUsersData = usersData.data;
            permissionsState.cachedKingdeeConfig = configData.data;

            // 填充部门下拉框
            populateDepartmentFilter('permissions-kingdee-department-filter', usersData.data.users || []);

            // 读取当前的搜索词和部门筛选值
            const searchTerm = document.getElementById('permissions-kingdee-search')?.value || '';
            const department = document.getElementById('permissions-kingdee-department-filter')?.value || '';

            renderPermissionsKingdee(usersData.data, configData.data, searchTerm, department);
        }
    }).catch(err => {
        console.error('[Permissions] Failed to load kingdee permissions:', err);
    });
}

function renderPermissionsKingdee(usersData, config, searchTerm, department) {
    const tbody = document.getElementById('permissions-kingdee-tbody');
    tbody.innerHTML = '';

    const users = usersData.users || [];
    const userPermissions = config.kingdee_permissions?.user_permissions || {};

    // 过滤用户：搜索匹配用户名 + 部门筛选
    const filteredUsers = users.filter(user => {
        if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (department && user.department !== department) return false;
        return true;
    });

    filteredUsers.forEach(user => {
        const perms = userPermissions[user.userid] || { enabled: false };
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50';
        tr.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <i class="fas fa-user text-slate-400 text-sm"></i>
                    <span class="font-medium text-slate-700 dark:text-slate-300">${escapeHtml(user.name)}</span>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                ${escapeHtml(user.department)}
            </td>
            <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1.5 text-sm ${perms.enabled ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}">
                    <i class="fas ${perms.enabled ? 'fa-check-circle' : 'fa-times-circle'} text-xs"></i>
                    ${perms.enabled ? '已启用' : '未启用'}
                </span>
            </td>
            <td class="px-4 py-3 text-right">
                <button onclick="openPermissionsKingdeeModal('${escapeHtml(user.userid)}', '${escapeHtml(user.name)}')"
                        class="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    编辑
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

}

function updateKingdeePermission(userid, enabled) {
    fetch('/api/permissions/config').then(r => r.json()).then(data => {
        const config = data.data;
        if (!config.kingdee_permissions) config.kingdee_permissions = {};
        if (!config.kingdee_permissions.user_permissions) config.kingdee_permissions.user_permissions = {};

        config.kingdee_permissions.user_permissions[userid] = { enabled: enabled };

        // Add audit log
        config.audit_log = config.audit_log || [];
        const kdStatus = enabled ? '已启用' : '已禁用';
        config.audit_log.push({
            timestamp: new Date().toISOString(),
            operator: 'admin',
            action: enabled ? 'enable' : 'disable',
            permission_type: 'kingdee',
            target: userid,
            details: `金蝶权限${kdStatus}`
        });

        return fetch('/api/permissions/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
    }).catch(err => {
        console.error('[Permissions] Failed to update kingdee permission:', err);
    });
}

function openPermissionsKingdeeModal(userid, name) {
    currentKingdeeModal.userid = userid;
    currentKingdeeModal.name = name;
    document.getElementById('permissions-kingdee-modal-user-name').textContent = name;

    // Load config
    fetch('/api/permissions/config').then(r => r.json()).then(configData => {
        const config = configData.data;
        const perms = config.kingdee_permissions?.user_permissions?.[userid] || { enabled: false };

        document.getElementById('permissions-kingdee-modal-enabled').checked = perms.enabled;
        document.getElementById('permissions-kingdee-modal-overlay').classList.remove('hidden');
    });
}

function closePermissionsKingdeeModal() {
    document.getElementById('permissions-kingdee-modal-overlay').classList.add('hidden');
}

function savePermissionsKingdeeModal() {
    const userid = currentKingdeeModal.userid;
    const enabled = document.getElementById('permissions-kingdee-modal-enabled').checked;

    fetch('/api/permissions/config').then(r => r.json()).then(data => {
        const config = data.data;
        if (!config.kingdee_permissions) config.kingdee_permissions = {};
        if (!config.kingdee_permissions.user_permissions) config.kingdee_permissions.user_permissions = {};

        config.kingdee_permissions.user_permissions[userid] = {
            enabled: enabled
        };

        // Add audit log
        config.audit_log = config.audit_log || [];
        const kdStatus = enabled ? '已启用' : '已禁用';
        config.audit_log.push({
            timestamp: new Date().toISOString(),
            operator: 'admin',
            action: enabled ? 'enable' : 'disable',
            permission_type: 'kingdee',
            target: userid,
            details: `金蝶权限${kdStatus}`
        });

        return fetch('/api/permissions/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
    }).then(() => {
        closePermissionsKingdeeModal();
        loadPermissionsKingdee();
    }).catch(err => {
        console.error('[Permissions] Failed to save kingdee modal:', err);
    });
}

// =====================================================================
// 审计日志
// =====================================================================
function loadPermissionsAudit() {
    const searchTerm = document.getElementById('permissions-audit-search')?.value || '';
    const typeFilter = document.getElementById('permissions-audit-type-filter')?.value || '';
    const queryParams = new URLSearchParams({ limit: '500' });
    if (typeFilter) queryParams.set('permission_type', typeFilter);
    if (searchTerm) queryParams.set('search', searchTerm);

    fetch('/api/permissions/audit-log?' + queryParams.toString()).then(r => r.json()).then(data => {
        if (data.status === 'success') {
            renderPermissionsAudit(data.data.audit_log);
        }
    }).catch(err => {
        console.error('[Permissions] Failed to load audit log:', err);
    });
}

function renderPermissionsAudit(auditLog) {
    const tbody = document.getElementById('permissions-audit-tbody');
    tbody.innerHTML = '';

    if (!auditLog || auditLog.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-sm text-slate-400">暂无审计日志</td></tr>';
        return;
    }

    // 最新日志排在最前面
    const sorted = [...auditLog].reverse();

    // 查找用户 ID 到姓名的映射（从缓存数据中）
    const users = permissionsState.cachedKnowledgeUsersData?.users || permissionsState.cachedKingdeeUsersData?.users || [];
    const userIdToName = {};
    users.forEach(u => { userIdToName[u.userid] = u.name; });

    sorted.forEach(entry => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50';

        // 格式化时间
        let timeStr = entry.timestamp || '';
        if (timeStr) {
            try {
                const d = new Date(timeStr);
                if (!isNaN(d.getTime())) {
                    const pad = n => String(n).padStart(2, '0');
                    timeStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
                }
            } catch (e) {}
        }

        // 操作类型翻译
        const actionMap = { update: '修改', create: '新增', delete: '删除', enable: '启用', disable: '禁用' };
        const actionLabel = actionMap[entry.action] || entry.action || '';

        // 权限类型显示
        const typeMap = { knowledge: '知识库', kingdee: '金蝶' };
        const typeLabel = typeMap[entry.permission_type] || entry.permission_type || '';

        // 操作对象：如果是 userid 且有映射，显示用户名
        const targetLabel = userIdToName[entry.target] || entry.target || '';

        tr.innerHTML = `
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">
                ${escapeHtml(timeStr)}
            </td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                ${escapeHtml(entry.operator || '')}
            </td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-0.5 text-xs rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                    ${escapeHtml(actionLabel)}
                </span>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                ${escapeHtml(typeLabel)}
            </td>
            <td class="px-4 py-3 text-sm text-slate-700 dark:text-slate-300">
                ${escapeHtml(targetLabel)}
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                ${escapeHtml(entry.details || '')}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

/**
 * 应用审计日志搜索/筛选并重新加载
 */
function applyAuditFilters() {
    loadPermissionsAudit();
}

// =====================================================================
// 同步用户
// =====================================================================
function syncWecomUsers() {
    if (!confirm('确定要同步企微用户吗？')) return;

    fetch('/api/permissions/sync-users', { method: 'POST' })
        .then(r => r.json())
        .then(data => {
            alert(data.message || '同步完成');
            if (data.status === 'success') {
                loadPermissionsKnowledge();
                loadPermissionsKingdee();
            }
        })
        .catch(err => {
            console.error('[Permissions] Failed to sync users:', err);
            alert('同步失败');
        });
}

// =====================================================================
// 权限管理开关
// =====================================================================
function loadPermissionsEnabled() {
    fetch('/api/permissions/config').then(r => r.json()).then(data => {
        if (data.status === 'success') {
            const enabled = data.data.enabled || false;
            updatePermissionsToggleUI(enabled);
        }
    }).catch(err => {
        console.error('[Permissions] Failed to load enabled state:', err);
    });
}

function updatePermissionsToggleUI(enabled) {
    const toggle = document.getElementById('permissions-enabled-toggle');
    if (!toggle) return;
    
    const block = toggle.parentElement.querySelector('.block');
    const dot = toggle.parentElement.querySelector('.dot');
    
    if (enabled) {
        if (block) {
            block.classList.remove('bg-slate-300', 'dark:bg-slate-600');
            block.classList.add('bg-primary-500');
        }
        if (dot) {
            dot.classList.add('translate-x-4');
        }
    } else {
        if (block) {
            block.classList.remove('bg-primary-500');
            block.classList.add('bg-slate-300', 'dark:bg-slate-600');
        }
        if (dot) {
            dot.classList.remove('translate-x-4');
        }
    }
    toggle.checked = enabled;
}

function togglePermissionsEnabled() {
    const toggle = document.getElementById('permissions-enabled-toggle');
    const enabled = toggle.checked;
    
    // Update UI immediately
    updatePermissionsToggleUI(enabled);
    
    // Save to config
    fetch('/api/permissions/config').then(r => r.json()).then(data => {
        const config = data.data;
        config.enabled = enabled;
        
        return fetch('/api/permissions/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
    }).then(() => {
        console.log(`[Permissions] Enabled set to ${enabled}`);
    }).catch(err => {
        console.error('[Permissions] Failed to save enabled state:', err);
    });
}

// =====================================================================
// 搜索与部门筛选
// =====================================================================

/**
 * 填充部门筛选下拉框
 */
function populateDepartmentFilter(selectId, users) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const departments = new Set();
    users.forEach(u => {
        if (u.department) departments.add(u.department);
    });
    const sorted = Array.from(departments).sort();
    const currentValue = select.value;
    select.innerHTML = '<option value="">所有部门</option>';
    sorted.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        select.appendChild(option);
    });
    // 恢复之前选中的值
    if (currentValue && sorted.includes(currentValue)) {
        select.value = currentValue;
    }
}

/**
 * 应用知识库搜索/筛选并重新渲染
 */
function applyKnowledgeFilters() {
    const searchTerm = document.getElementById('permissions-knowledge-search')?.value || '';
    const department = document.getElementById('permissions-knowledge-department-filter')?.value || '';
    const folders = permissionsState.cachedKnowledgeFolders || [];
    const usersData = permissionsState.cachedKnowledgeUsersData || { users: [] };
    const config = permissionsState.cachedKnowledgeConfig || {};
    renderPermissionsKnowledge(folders, usersData, config, searchTerm, department);
}

/**
 * 应用金蝶搜索/筛选并重新渲染
 */
function applyKingdeeFilters() {
    const searchTerm = document.getElementById('permissions-kingdee-search')?.value || '';
    const department = document.getElementById('permissions-kingdee-department-filter')?.value || '';
    const usersData = permissionsState.cachedKingdeeUsersData || { users: [] };
    const config = permissionsState.cachedKingdeeConfig || {};
    renderPermissionsKingdee(usersData, config, searchTerm, department);
}

// =====================================================================
// 初始化事件绑定
// =====================================================================

/**
 * 绑定搜索和部门筛选的事件监听（在页面首次加载时调用）
 */
function setupPermissionsEventHandlers() {
    // 知识库搜索
    const knowledgeSearch = document.getElementById('permissions-knowledge-search');
    if (knowledgeSearch) {
        knowledgeSearch.addEventListener('input', applyKnowledgeFilters);
    }
    // 知识库部门筛选
    const knowledgeDept = document.getElementById('permissions-knowledge-department-filter');
    if (knowledgeDept) {
        knowledgeDept.addEventListener('change', applyKnowledgeFilters);
    }

    // 金蝶搜索
    const kingdeeSearch = document.getElementById('permissions-kingdee-search');
    if (kingdeeSearch) {
        kingdeeSearch.addEventListener('input', applyKingdeeFilters);
    }
    // 金蝶部门筛选
    const kingdeeDept = document.getElementById('permissions-kingdee-department-filter');
    if (kingdeeDept) {
        kingdeeDept.addEventListener('change', applyKingdeeFilters);
    }

    // 审计日志搜索
    const auditSearch = document.getElementById('permissions-audit-search');
    if (auditSearch) {
        auditSearch.addEventListener('input', applyAuditFilters);
    }
    // 审计日志类型筛选
    const auditType = document.getElementById('permissions-audit-type-filter');
    if (auditType) {
        auditType.addEventListener('change', applyAuditFilters);
    }
}

// 页面加载完成后绑定事件
document.addEventListener('DOMContentLoaded', function() {
    setupPermissionsEventHandlers();
});
// 同时也支持在 navigateTo 之后手动调用
if (typeof setupPermissionsEventHandlers === 'function') {
    // 延迟执行，确保 DOM 已渲染
    setTimeout(setupPermissionsEventHandlers, 100);
}
