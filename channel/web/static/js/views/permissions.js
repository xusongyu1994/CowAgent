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
// 金蝶表单目录 / 角色（后端下发，前端缓存）
let kingdeeFormCatalog = {};      // form_id -> 中文名
let kingdeeRoles = {};            // role -> [form_id, ...]
let kingdeeRoleNames = {};        // role -> 中文名
let kingdeeSaleScopedForms = [];  // 需要按业务员过滤的销售类表单
let kingdeeSuperAdmins = [];      // 超级账户 userid 列表
// 当前编辑用户的表单选中态
let currentKingdeeFormSelection = [];   // 勾选的 form_id 列表
let currentKingdeeSubordinates = [];    // 直接下属 userid 列表

function loadKingdeeFormCatalog() {
    return fetch('/api/permissions/kingdee-form-roles').then(r => r.json()).then(data => {
        if (data.status === 'success' && data.data) {
            kingdeeFormCatalog = data.data.forms || {};
            kingdeeRoles = data.data.roles || {};
            kingdeeRoleNames = data.data.role_names || {};
            kingdeeSaleScopedForms = data.data.sale_scoped_forms || [];
        }
    }).catch(err => {
        console.error('[Permissions] Failed to load kingdee form catalog:', err);
    });
}

function loadKingdeeSuperAdmins() {
    return fetch('/api/permissions/kingdee/super-admins').then(r => r.json()).then(data => {
        if (data.status === 'success' && data.data) {
            kingdeeSuperAdmins = data.data.super_admins || [];
        }
    }).catch(err => {
        console.error('[Permissions] Failed to load kingdee super admins:', err);
    });
}

function loadPermissionsKingdee() {
    Promise.all([
        fetch('/api/permissions/users').then(r => r.json()),
        fetch('/api/permissions/config').then(r => r.json()),
        loadKingdeeFormCatalog(),
        loadKingdeeSuperAdmins()
    ]).then(([usersData, configData]) => {
        if (usersData.status === 'success' && configData.status === 'success') {
            // 缓存数据供搜索/筛选使用
            permissionsState.cachedKingdeeUsersData = usersData.data;
            permissionsState.cachedKingdeeConfig = configData.data;

            // 填充部门下拉框（层级前缀：可选上级部门）
            populateDeptPrefixFilter('permissions-kingdee-department-filter', usersData.data.users || []);

            // 渲染超级账户配置条
            renderKingdeeSuperAdminsBar();

            // 读取当前的搜索词和部门筛选值
            const searchTerm = document.getElementById('permissions-kingdee-search')?.value || '';
            const department = document.getElementById('permissions-kingdee-department-filter')?.value || '';

            renderPermissionsKingdee(usersData.data, configData.data, searchTerm, department);
        }
    }).catch(err => {
        console.error('[Permissions] Failed to load kingdee permissions:', err);
    });
}

// 计算用户的「有效表单」集合
function kingdeeEffectiveForms(perms) {
    const base = perms.role && kingdeeRoles[perms.role] ? [...kingdeeRoles[perms.role]] : [];
    const extra = perms.extra_forms || [];
    const removed = perms.removed_forms || [];
    return [...new Set([...base, ...extra].filter(f => !removed.includes(f)))];
}

function isKingdeeSuperAdmin(userid) {
    return kingdeeSuperAdmins.includes(userid);
}

function renderKingdeeSuperAdminsBar() {
    const el = document.getElementById('permissions-kingdee-superadmins-text');
    if (!el) return;
    if (kingdeeSuperAdmins.length === 0) {
        el.textContent = '当前：无';
        return;
    }
    // 把 userid 映射为姓名
    const users = permissionsState.cachedKingdeeUsersData?.users || [];
    const nameMap = {};
    users.forEach(u => { nameMap[u.userid] = u.name; });
    const names = kingdeeSuperAdmins.map(id => nameMap[id] || id);
    el.textContent = '当前：' + names.join('、');
}

function kingdeeFormLabel(perms) {
    if (!perms.enabled) return '<span class="text-slate-400 dark:text-slate-500 text-sm">未启用</span>';
    const forms = kingdeeEffectiveForms(perms);
    const roleName = perms.role ? (kingdeeRoleNames[perms.role] || perms.role) : '自定义';
    if (forms.length === 0) {
        return '<span class="text-[11px] px-2 py-0.5 rounded-full bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400">待配置</span>';
    }
    return `<span class="text-[11px] px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-700 dark:text-primary-400">${escapeHtml(roleName)} · ${forms.length}个表单</span>`;
}

function kingdeeScopeLabel(perms) {
    if (!perms.enabled) return '<span class="text-slate-400 dark:text-slate-500 text-sm">—</span>';
    if (perms.scope === 'self') {
        return '<span class="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300">仅本人</span>';
    }
    if (perms.scope === 'self_and_subordinates') {
        const n = (perms.direct_subordinates || []).length;
        return `<span class="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400">本人+下属(${n})</span>`;
    }
    return '<span class="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">全部</span>';
}

function renderPermissionsKingdee(usersData, config, searchTerm, department) {
    const tbody = document.getElementById('permissions-kingdee-tbody');
    tbody.innerHTML = '';

    const users = usersData.users || [];
    const userPermissions = config.kingdee_permissions?.user_permissions || {};
    const nameMap = {};
    users.forEach(u => { nameMap[u.userid] = u.name; });

    // 过滤用户：搜索匹配用户名 + 部门（前缀匹配，选上级部门可看子部门）
    const filteredUsers = users.filter(user => {
        if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (department && !(user.department || '').startsWith(department)) return false;
        return true;
    });

    filteredUsers.forEach(user => {
        const perms = userPermissions[user.userid] || { enabled: false, scope: 'all', role: '', extra_forms: [], removed_forms: [], direct_subordinates: [] };
        perms._userid = user.userid;
        const isSuper = isKingdeeSuperAdmin(user.userid);
        const tr = document.createElement('tr');
        tr.className = 'border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50';
        const superStar = isSuper ? ' <span class="text-amber-500 text-xs">★</span>' : '';
        tr.innerHTML = `
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <i class="fas fa-user text-slate-400 text-sm"></i>
                    <span class="font-medium text-slate-700 dark:text-slate-300">${escapeHtml(user.name)}${superStar}</span>
                </div>
            </td>
            <td class="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
                ${escapeHtml(user.department)}
            </td>
            <td class="px-4 py-3">
                ${isSuper ? '<span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">★ 全部</span>' : kingdeeFormLabel(perms)}
            </td>
            <td class="px-4 py-3">
                ${isSuper ? '<span class="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400">★ 全部</span>' : kingdeeScopeLabel(perms)}
            </td>
            <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1.5 text-sm ${perms.enabled || isSuper ? 'text-green-600 dark:text-green-400' : 'text-slate-400 dark:text-slate-500'}">
                    <i class="fas ${perms.enabled || isSuper ? 'fa-check-circle' : 'fa-times-circle'} text-xs"></i>
                    ${perms.enabled || isSuper ? '已启用' : '未启用'}
                </span>
            </td>
            <td class="px-4 py-3 text-right">
                <button onclick="openPermissionsKingdeeModal('${escapeHtml(user.userid)}', '${escapeHtml(user.name)}', '${escapeHtml(user.department)}')"
                        class="px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                    编辑
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// ---- 编辑弹窗 ----
function openPermissionsKingdeeModal(userid, name, department) {
    currentKingdeeModal.userid = userid;
    currentKingdeeModal.name = name;
    document.getElementById('permissions-kingdee-modal-user-name').textContent = name;
    document.getElementById('permissions-kingdee-modal-user-dept').textContent = department || '';

    const isSuper = isKingdeeSuperAdmin(userid);
    document.getElementById('permissions-kingdee-modal-super-hint').classList.toggle('hidden', !isSuper);

    // Load config
    Promise.all([
        fetch('/api/permissions/config').then(r => r.json()),
        loadKingdeeFormCatalog()
    ]).then(([configData]) => {
        const config = configData.data;
        // 刷新缓存配置，保证"排除上级防环"用的是最新数据（可能被其它管理员改过）
        permissionsState.cachedKingdeeConfig = config;
        const perms = config.kingdee_permissions?.user_permissions?.[userid] || { enabled: false, scope: 'all', role: '', extra_forms: [], removed_forms: [], direct_subordinates: [], risk_level: 'low' };

        const enabledBox = document.getElementById('permissions-kingdee-modal-enabled');
        enabledBox.checked = isSuper ? true : !!perms.enabled;
        enabledBox.disabled = isSuper;   // 超管的启停由 super_admins 名单控制

        // 填充角色下拉
        const roleSelect = document.getElementById('permissions-kingdee-modal-role');
        roleSelect.innerHTML = '<option value="">无角色（自定义）</option>' +
            Object.keys(kingdeeRoles || {}).map(r =>
                `<option value="${escapeHtml(r)}">${escapeHtml(kingdeeRoleNames[r] || r)}</option>`
            ).join('');
        roleSelect.value = isSuper ? '' : (perms.role || '');
        roleSelect.disabled = isSuper;

        // 计算当前勾选表单
        currentKingdeeFormSelection = isSuper ? Object.keys(kingdeeFormCatalog) : kingdeeEffectiveForms(perms);
        currentKingdeeSubordinates = [...(perms.direct_subordinates || [])];

        // 渲染表单网格
        renderKingdeeModalForms(isSuper);

        // scope
        const scopeVal = isSuper ? 'all' : (perms.scope || 'all');
        document.querySelectorAll('input[name="permissions-kingdee-scope"]').forEach(r => {
            r.checked = (r.value === scopeVal);
            r.disabled = isSuper;
        });

        // 风险等级
        document.getElementById('permissions-kingdee-modal-risk').value = perms.risk_level || 'low';

        updateKingdeeModalScopeUI();
        updateKingdeeNoFormWarning();
        document.getElementById('permissions-kingdee-modal-overlay').classList.remove('hidden');
    });
}

function renderKingdeeModalForms(isSuper) {
    const container = document.getElementById('permissions-kingdee-modal-forms');
    const formIds = Object.keys(kingdeeFormCatalog || {});
    container.innerHTML = formIds.map(fid => {
        const checked = currentKingdeeFormSelection.includes(fid);
        const name = kingdeeFormCatalog[fid] || fid;
        return `
            <label class="flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer ${checked ? 'border-primary-500 bg-primary-500/10' : 'border-slate-200 dark:border-slate-600'} ${isSuper ? 'opacity-40 pointer-events-none' : ''}">
                <input type="checkbox" ${checked ? 'checked' : ''} ${isSuper ? 'disabled' : ''} class="rounded border-slate-300 dark:border-slate-600 text-primary-500 focus:ring-primary-500" onchange="toggleKingdeeModalForm('${escapeHtml(fid)}')">
                <span class="text-sm text-slate-700 dark:text-slate-300">${escapeHtml(name)}</span>
                <span class="text-[10px] text-slate-400 dark:text-slate-500 font-mono ml-auto">${escapeHtml(fid)}</span>
            </label>`;
    }).join('');
    updateKingdeeNoFormWarning();
    updateKingdeeAllWarning();
}

function toggleKingdeeModalForm(fid) {
    if (currentKingdeeFormSelection.includes(fid)) {
        currentKingdeeFormSelection = currentKingdeeFormSelection.filter(f => f !== fid);
    } else {
        currentKingdeeFormSelection.push(fid);
    }
    renderKingdeeModalForms(false);
}

function onKingdeeModalRoleChange() {
    const role = document.getElementById('permissions-kingdee-modal-role').value;
    currentKingdeeFormSelection = role && kingdeeRoles[role] ? [...kingdeeRoles[role]] : [];
    renderKingdeeModalForms(false);
}

function updateKingdeeNoFormWarning() {
    const enabled = document.getElementById('permissions-kingdee-modal-enabled').checked;
    const warn = document.getElementById('permissions-kingdee-modal-noform');
    const show = enabled && currentKingdeeFormSelection.length === 0 && !isKingdeeSuperAdmin(currentKingdeeModal.userid);
    warn.classList.toggle('hidden', !show);
}

// 当勾选「全部」且该用户拥有销售类表单权限时，显示"可查看全公司销售数据"的警示
function updateKingdeeAllWarning() {
    const el = document.getElementById('permissions-kingdee-modal-allhint');
    if (!el) return;
    const scope = document.querySelector('input[name="permissions-kingdee-scope"]:checked')?.value || 'all';
    const selUpper = new Set(currentKingdeeFormSelection.map(f => String(f).toUpperCase()));
    const hasSaleScoped = (kingdeeSaleScopedForms || []).some(f => selUpper.has(String(f).toUpperCase()));
    const show = scope === 'all' && hasSaleScoped && !isKingdeeSuperAdmin(currentKingdeeModal.userid);
    el.classList.toggle('hidden', !show);
}

// ---- 下属选择 ----
let kingdeeSubPickerSel = [];
function openKingdeeSubordinatePicker() {
    kingdeeSubPickerSel = [...currentKingdeeSubordinates];
    renderKingdeeSubordinateList();
    document.getElementById('permissions-kingdee-subpicker-overlay').classList.remove('hidden');
}
function renderKingdeeSubordinateList() {
    const q = document.getElementById('permissions-kingdee-subpicker-search')?.value?.toLowerCase() || '';
    const users = permissionsState.cachedKingdeeUsersData?.users || [];
    const exclude = new Set([currentKingdeeModal.userid]);
    // 排除自己的上级（防止循环）：递归收集
    kingdeeSuperiorsFor(currentKingdeeModal.userid).forEach(u => exclude.add(u));
    const list = users.filter(u => !exclude.has(u.userid) && (!q || u.name.toLowerCase().includes(q)));
    const el = document.getElementById('permissions-kingdee-subpicker-list');
    el.innerHTML = list.map(u => `
        <label class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
            <input type="checkbox" class="rounded text-primary-500" ${kingdeeSubPickerSel.includes(u.userid) ? 'checked' : ''} onchange="toggleKingdeeSubSel('${escapeHtml(u.userid)}')">
            <span class="flex-1">
                <span class="block text-sm text-slate-700 dark:text-slate-300">${escapeHtml(u.name)}</span>
                <span class="block text-xs text-slate-500 dark:text-slate-400">${escapeHtml(u.department)}</span>
            </span>
        </label>`).join('');
}
function kingdeeSuperiorsFor(userid) {
    // 从缓存的 config 递归收集 userid 的上级
    const config = permissionsState.cachedKingdeeConfig;
    const up = config?.kingdee_permissions?.user_permissions || {};
    const result = [];
    const seen = new Set();
    const stack = [...useridsWhoseSubIs(userid, up)];
    while (stack.length) {
        const cur = stack.pop();
        if (seen.has(cur)) continue;
        seen.add(cur);
        result.push(cur);
        useridsWhoseSubIs(cur, up).forEach(u => stack.push(u));
    }
    return result;
}
function useridsWhoseSubIs(sub, up) {
    const out = [];
    Object.keys(up).forEach(uid => {
        if ((up[uid].direct_subordinates || []).includes(sub)) out.push(uid);
    });
    return out;
}
function toggleKingdeeSubSel(userid) {
    if (kingdeeSubPickerSel.includes(userid)) {
        kingdeeSubPickerSel = kingdeeSubPickerSel.filter(u => u !== userid);
    } else {
        kingdeeSubPickerSel.push(userid);
    }
}
function confirmKingdeeSubordinates() {
    currentKingdeeSubordinates = [...kingdeeSubPickerSel];
    renderKingdeeModalSubChips();
    closeKingdeeSubordinatePicker();
}
function renderKingdeeModalSubChips() {
    const users = permissionsState.cachedKingdeeUsersData?.users || [];
    const nameMap = {};
    users.forEach(u => { nameMap[u.userid] = u.name; });
    const el = document.getElementById('permissions-kingdee-modal-subchips');
    el.innerHTML = currentKingdeeSubordinates.map(uid =>
        `<span class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300">
            ${escapeHtml(nameMap[uid] || uid)} <button onclick="removeKingdeeSub('${escapeHtml(uid)}')" class="hover:text-red-500 cursor-pointer">×</button>
        </span>`).join('');
}
function removeKingdeeSub(uid) {
    currentKingdeeSubordinates = currentKingdeeSubordinates.filter(u => u !== uid);
    renderKingdeeModalSubChips();
}
function closeKingdeeSubordinatePicker() {
    document.getElementById('permissions-kingdee-subpicker-overlay').classList.add('hidden');
}

function updateKingdeeModalScopeUI() {
    const scope = document.querySelector('input[name="permissions-kingdee-scope"]:checked')?.value || 'all';
    const subSection = document.getElementById('permissions-kingdee-modal-subordinate');
    const isSub = scope === 'self_and_subordinates' && !isKingdeeSuperAdmin(currentKingdeeModal.userid);
    subSection.classList.toggle('hidden', !isSub);
    if (isSub) renderKingdeeModalSubChips();
    updateKingdeeAllWarning();
}

// ---- 超级账户选择 ----
let kingdeeSuperPickerSel = [];
function openKingdeeSuperAdminsPicker() {
    kingdeeSuperPickerSel = [...kingdeeSuperAdmins];
    renderKingdeeSuperAdminsList();
    document.getElementById('permissions-kingdee-superadmins-overlay').classList.remove('hidden');
}
function renderKingdeeSuperAdminsList() {
    const q = document.getElementById('permissions-kingdee-superadmins-search')?.value?.toLowerCase() || '';
    const users = permissionsState.cachedKingdeeUsersData?.users || [];
    const list = users.filter(u => !q || u.name.toLowerCase().includes(q));
    const el = document.getElementById('permissions-kingdee-superadmins-list');
    el.innerHTML = list.map(u => `
        <label class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
            <input type="checkbox" class="rounded text-primary-500" ${kingdeeSuperPickerSel.includes(u.userid) ? 'checked' : ''} onchange="toggleKingdeeSuperSel('${escapeHtml(u.userid)}')">
            <span class="flex-1">
                <span class="block text-sm text-slate-700 dark:text-slate-300">${escapeHtml(u.name)}</span>
                <span class="block text-xs text-slate-500 dark:text-slate-400">${escapeHtml(u.department)}</span>
            </span>
            <span class="text-[10px] text-amber-500">★ 全部表单</span>
        </label>`).join('');
}
function toggleKingdeeSuperSel(userid) {
    if (kingdeeSuperPickerSel.includes(userid)) {
        kingdeeSuperPickerSel = kingdeeSuperPickerSel.filter(u => u !== userid);
    } else {
        kingdeeSuperPickerSel.push(userid);
    }
}
function confirmKingdeeSuperAdmins() {
    fetch('/api/permissions/kingdee/super-admins', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ super_admins: kingdeeSuperPickerSel })
    }).then(r => r.json()).then(data => {
        if (data.status === 'success') {
            kingdeeSuperAdmins = [...kingdeeSuperPickerSel];
            renderKingdeeSuperAdminsBar();
            loadPermissionsKingdee();
        }
        closeKingdeeSuperAdminsPicker();
    }).catch(err => {
        console.error('[Permissions] Failed to save super admins:', err);
    });
}
function closeKingdeeSuperAdminsPicker() {
    document.getElementById('permissions-kingdee-superadmins-overlay').classList.add('hidden');
}

function closePermissionsKingdeeModal() {
    document.getElementById('permissions-kingdee-modal-overlay').classList.add('hidden');
}

function savePermissionsKingdeeModal() {
    const userid = currentKingdeeModal.userid;
    const enabled = document.getElementById('permissions-kingdee-modal-enabled').checked;
    const isSuper = isKingdeeSuperAdmin(userid);

    // 前端兜底校验：启用但无表单
    if (enabled && currentKingdeeFormSelection.length === 0 && !isSuper) {
        alert('未授权任何表单，无法保存。请至少勾选一个表单或选择基础角色。');
        return;
    }

    fetch('/api/permissions/config').then(r => r.json()).then(data => {
        const config = data.data;
        if (!config.kingdee_permissions) config.kingdee_permissions = {};
        if (!config.kingdee_permissions.user_permissions) config.kingdee_permissions.user_permissions = {};

        if (isSuper) {
            // 超级账户不保存 scope/role/表单（由 super_admins 名单控制）
            closePermissionsKingdeeModal();
            return null;
        }

        const role = document.getElementById('permissions-kingdee-modal-role').value;
        const scope = document.querySelector('input[name="permissions-kingdee-scope"]:checked')?.value || 'all';
        const base = role && kingdeeRoles[role] ? [...kingdeeRoles[role]] : [];

        const newPerm = {
            enabled: enabled,
            scope: scope,
            role: role || '',
            extra_forms: currentKingdeeFormSelection.filter(f => !base.includes(f)),
            removed_forms: base.filter(f => !currentKingdeeFormSelection.includes(f)),
            direct_subordinates: scope === 'self_and_subordinates' ? currentKingdeeSubordinates : [],
            risk_level: document.getElementById('permissions-kingdee-modal-risk').value
        };

        config.kingdee_permissions.user_permissions[userid] = newPerm;

        // Add audit log
        config.audit_log = config.audit_log || [];
        const roleName = role ? (kingdeeRoleNames[role] || role) : '自定义';
        const scopeCn = { self: '仅本人', self_and_subordinates: '本人及下属', all: '全部' }[scope] || scope;
        const formNames = currentKingdeeFormSelection.map(fid => kingdeeFormCatalog[fid] || fid);
        const subCount = scope === 'self_and_subordinates' ? currentKingdeeSubordinates.length : 0;
        config.audit_log.push({
            timestamp: new Date().toISOString(),
            operator: 'admin',
            action: 'update',
            permission_type: 'kingdee',
            target: userid,
            details: `金蝶权限：${enabled ? '启用' : '禁用'}，角色=${roleName}，范围=${scopeCn}${subCount ? `，直接下属${subCount}人` : ''}，表单${formNames.length}个：${formNames.join('、')}`
        });

        return fetch('/api/permissions/config', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(config)
        });
    }).then(resp => {
        if (resp) return resp.json();
        return { status: 'success' };
    }).then(data => {
        if (data && data.status === 'error') {
            alert('保存失败：' + (data.message || '未知错误'));
            return;
        }
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
 * 金蝶页专用：按部门层级前缀填充下拉（选"营销中心"即可筛出其下所有子部门人员）。
 * 渲染端按 user.department.startsWith(选中值) 匹配。
 */
function populateDeptPrefixFilter(selectId, users) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const prefixes = new Set();
    users.forEach(u => {
        if (!u.department) return;
        const parts = String(u.department).split('/');
        let acc = '';
        parts.forEach(p => {
            acc = acc ? acc + '/' + p : p;
            prefixes.add(acc);
        });
    });
    const sorted = Array.from(prefixes).sort();
    const currentValue = select.value;
    select.innerHTML = '<option value="">所有部门</option>';
    sorted.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        select.appendChild(option);
    });
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
