// Estrutura de dados vazia - será preenchida com dados do banco
const AppData = {
    users: [],
    pontos: [],
    currentUser: null
};
const Utils = {
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    validatePhone: (phone) => {
        const re = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
        return re.test(phone);
    },

    formatPhone: (phone) => {
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
        } else if (cleaned.length === 10) {
            return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
        }
        return phone;
    },

    formatCNPJ: (cnpj) => {
        const cleaned = cnpj.replace(/\D/g, '');
        if (cleaned.length === 14) {
            return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
        }
        return cnpj;
    },

    showToast: (message, type = 'success') => {
        const toastContainer = document.getElementById('toastContainer') || createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    },

    createToastContainer: () => {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    },

    delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    getInitials: (name) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    }
};

Utils.createToastContainer();

const Auth = {
    isLoggedIn: () => {
        return localStorage.getItem('reciclafacil_user') !== null;
    },

    login: async (email, password, userType) => {
        try {
            const response = await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'login',
                    email: email,
                    password: password,
                    userType: userType
                })
            });
            
            if (!response.ok) {
                console.error('Erro HTTP:', response.status, response.statusText);
                return { success: false, message: `Erro ${response.status}: ${response.statusText}` };
            }
            
            const data = await response.json();
            
            if (data.success) {
                // Salvar dados do usuário no localStorage
                localStorage.setItem('reciclafacil_user', JSON.stringify(data.data.user));
                localStorage.setItem('reciclafacil_token', data.data.token);
                
                return { success: true, user: data.data.user };
            } else {
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('Erro no login:', error);
            return { success: false, message: 'Erro de conexão. Tente novamente.' };
        }
    },

    logout: async () => {
        try {
            // Chamar API de logout
            await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'logout'
                })
            });
        } catch (error) {
            console.error('Erro no logout:', error);
        } finally {
            // Limpar dados locais
        localStorage.removeItem('reciclafacil_user');
            localStorage.removeItem('reciclafacil_token');
            window.location.href = 'index.html';
        }
    },

    getCurrentUser: () => {
        const userData = localStorage.getItem('reciclafacil_user');
        return userData ? JSON.parse(userData) : null;
    },

    isAdmin: () => {
        const user = Auth.getCurrentUser();
        return user && user.tipo === 'admin';
    },

    checkAuth: async () => {
        try {
            const response = await fetch('api/auth.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: 'check'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Atualizar dados do usuário
                localStorage.setItem('reciclafacil_user', JSON.stringify(data.data));
                return true;
            } else {
                // Sessão inválida, fazer logout
                Auth.logout();
                return false;
            }
        } catch (error) {
            console.error('Erro ao verificar autenticação:', error);
            return false;
        }
    }
};

const FormValidator = {
    validateLoginForm: (formData) => {
        const errors = {};

        if (!formData.email || !Utils.validateEmail(formData.email)) {
            errors.email = 'Por favor, insira um email válido.';
        }

        if (!formData.password || formData.password.length < 6) {
            errors.password = 'A senha deve ter pelo menos 6 caracteres.';
        }

        if (!formData.userType) {
            errors.userType = 'Por favor, selecione o tipo de usuário.';
        }

        return { isValid: Object.keys(errors).length === 0, errors };
    },

    validateRegisterForm: (formData) => {
        const errors = {};

        if (!formData.firstName || formData.firstName.trim().length < 2) {
            errors.firstName = 'Por favor, insira um nome válido.';
        }

        if (!formData.lastName || formData.lastName.trim().length < 2) {
            errors.lastName = 'Por favor, insira um sobrenome válido.';
        }

        if (!formData.email || !Utils.validateEmail(formData.email)) {
            errors.email = 'Por favor, insira um email válido.';
        }

        if (!formData.phone || !Utils.validatePhone(formData.phone)) {
            errors.phone = 'Por favor, insira um telefone válido no formato (11) 99999-9999.';
        }

        if (!formData.userType) {
            errors.userType = 'Por favor, selecione o tipo de usuário.';
        }

        if (!formData.password || formData.password.length < 6) {
            errors.password = 'A senha deve ter pelo menos 6 caracteres.';
        }

        if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'As senhas não coincidem.';
        }

        if (!formData.address || formData.address.trim().length < 10) {
            errors.address = 'Por favor, insira um endereço completo.';
        }

        if (!formData.agreeTerms) {
            errors.agreeTerms = 'Você deve concordar com os termos para continuar.';
        }

        if (formData.userType === 'cooperativa') {
            if (!formData.organizationName || formData.organizationName.trim().length < 3) {
                errors.organizationName = 'Por favor, insira o nome da organização.';
            }

            if (!formData.cnpj || formData.cnpj.replace(/\D/g, '').length !== 14) {
                errors.cnpj = 'Por favor, insira um CNPJ válido.';
            }
        }

        return { isValid: Object.keys(errors).length === 0, errors };
    },
    applyValidationErrors: (form, errors) => {
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
        form.querySelectorAll('.invalid-feedback').forEach(el => el.textContent = '');

        Object.keys(errors).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('is-invalid');
                const feedback = field.parentNode.querySelector('.invalid-feedback');
                if (feedback) {
                    feedback.textContent = errors[fieldName];
                }
            }
        });
    }
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    initializePageComponents();
    
    setupGlobalEventListeners();
    
    setupInputMasks();
}

function initializePrivateArea() {
    const user = Auth.getCurrentUser();
    updateUserInterface(user);
    setupUserNavigation(user);
}

function updateUserInterface(user) {
    const userNameElements = document.querySelectorAll('#userName, #profileUserName');
    userNameElements.forEach(el => {
        if (el) el.textContent = user.nome || user.name || 'Usuário';
    });

    const userEmailElements = document.querySelectorAll('#profileUserEmail');
    userEmailElements.forEach(el => {
        if (el) el.textContent = user.email;
    });

    const userTypeElements = document.querySelectorAll('#profileUserType');
    userTypeElements.forEach(el => {
        if (el) el.textContent = (user.tipo || user.type) === 'admin' ? 'Administrador' : 'Cooperativa';
    });
    
    const userInitialsElements = document.querySelectorAll('#userInitials');
    userInitialsElements.forEach(el => {
        if (el) el.textContent = Utils.getInitials(user.nome || user.name || 'Usuário');
    });
}
function setupUserNavigation(user) {
    const usersNavItem = document.getElementById('usersNavItem');
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    const userType = user.tipo || user.type;
    if (userType !== 'admin') {
        if (usersNavItem) usersNavItem.style.display = 'none';
        if (manageUsersBtn) manageUsersBtn.style.display = 'none';
    }
}
function initializePageComponents() {
    const currentPage = window.location.pathname.split('/').pop();
    
    switch (currentPage) {
        case 'index.html':
        case '':
            initializeHomePage();
            break;
        case 'login.html':
            initializeLoginPage();
            break;
        case 'cadastro.html':
            initializeRegisterPage();
            break;
        case 'dashboard.html':
            if (!Auth.isLoggedIn()) {
                window.location.href = 'login.html';
                return;
            }
            initializePrivateArea();
            initializeDashboard();
            break;
        case 'pontos-coleta.html':
            if (!Auth.isLoggedIn()) {
                window.location.href = 'login.html';
                return;
            }
            initializePrivateArea();
            initializePontosColeta();
            break;
        case 'usuarios.html':
            if (!Auth.isLoggedIn()) {
                window.location.href = 'login.html';
                return;
            }
            if (!Auth.isAdmin()) {
                window.location.href = 'dashboard.html';
                return;
            }
            initializePrivateArea();
            initializeUsuarios();
            break;
        case 'perfil.html':
            if (!Auth.isLoggedIn()) {
                window.location.href = 'login.html';
                return;
            }
            initializePrivateArea();
            initializePerfil();
            break;
    }
}
function initializeHomePage() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }

    const materialSelect = document.getElementById('materialType');
    const locationInput = document.getElementById('location');
    if (materialSelect) {
        materialSelect.addEventListener('change', () => {
            filterCollectionPoints(materialSelect.value, locationInput ? locationInput.value : '');
        });
    }
    if (locationInput) {
        locationInput.addEventListener('input', () => {
            filterCollectionPoints(materialSelect ? materialSelect.value : '', locationInput.value);
        });
    }

    loadPublicPoints();
}
function initializeLoginPage() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
}
function initializeRegisterPage() {
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
        const userTypeSelect = document.getElementById('userType');
        const cooperativaFields = document.getElementById('cooperativaFields');
        
        if (userTypeSelect && cooperativaFields) {
            userTypeSelect.addEventListener('change', function() {
                if (this.value === 'cooperativa') {
                    cooperativaFields.style.display = 'block';
                    cooperativaFields.querySelectorAll('input').forEach(input => {
                        input.required = true;
                    });
                } else {
                    cooperativaFields.style.display = 'none';
                    cooperativaFields.querySelectorAll('input').forEach(input => {
                        input.required = false;
                    });
                }
            });
        }
    }
}
async function initializeDashboard() {
    // Carregar dados básicos
    await loadUsers();
    await loadPontos();
    
    // Carregar estatísticas
    await loadDashboardStats();
    
    // Configurar atualização automática a cada 30 segundos
    setInterval(async () => {
        await loadDashboardStats();
    }, 30000);
}
async function initializePontosColeta() {
    // Carregar pontos de coleta
    await loadPontos();
    
    // Carregar responsáveis para o dropdown
    await loadResponsaveis();
    
    const searchForm = document.getElementById('searchFilterForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handlePontosSearch);
    }

    const addPontoForm = document.getElementById('addPontoForm');
    if (addPontoForm) {
        addPontoForm.addEventListener('submit', handleAddPonto);
    }

    const editPontoForm = document.getElementById('editPontoForm');
    if (editPontoForm) {
        editPontoForm.addEventListener('submit', handleEditPonto);
    }
}

async function loadResponsaveis() {
    try {
        const users = await DatabaseAPI.getUsers();
        const responsaveisSelect = document.getElementById('pontoResponsavel');
        
        if (responsaveisSelect) {
            // Limpar opções existentes (exceto a primeira)
            responsaveisSelect.innerHTML = '<option value="">Selecione o responsável</option>';
            
            // Adicionar usuários do tipo cooperativa
            users.filter(user => user.tipo === 'cooperativa' && user.status === 'ativo').forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.nome} (${user.organizacao || 'Sem organização'})`;
                responsaveisSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar responsáveis:', error);
        Utils.showToast('Erro ao carregar responsáveis', 'danger');
    }
}

async function loadResponsaveisForEdit() {
    try {
        const users = await DatabaseAPI.getUsers();
        const responsaveisSelect = document.getElementById('editPontoResponsavel');
        
        if (responsaveisSelect) {
            // Limpar opções existentes (exceto a primeira)
            responsaveisSelect.innerHTML = '<option value="">Selecione o responsável</option>';
            
            // Adicionar usuários do tipo cooperativa
            users.filter(user => user.tipo === 'cooperativa' && user.status === 'ativo').forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.nome} (${user.organizacao || 'Sem organização'})`;
                responsaveisSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar responsáveis:', error);
        Utils.showToast('Erro ao carregar responsáveis', 'danger');
    }
}

async function loadPontos() {
    try {
        const pontos = await DatabaseAPI.getPontos();
        AppData.pontos = pontos;
        applyPontosFilters();
    } catch (error) {
        console.error('Erro ao carregar pontos de coleta:', error);
        Utils.showToast('Erro ao carregar pontos de coleta', 'danger');
    }
}

async function loadPublicPoints() {
    try {
        const pontos = await DatabaseAPI.getPontos();
        AppData.pontos = pontos;
        populateHomeMaterialFilter();
        const container = document.getElementById('collectionPoints');
        if (container) {
            renderCollectionPoints(pontos, container);
        }
    } catch (error) {
        console.error('Erro ao carregar pontos públicos:', error);
        const container = document.getElementById('collectionPoints');
        if (container) {
            container.innerHTML = '<div class="col-12"><div class="alert alert-danger text-center">Erro ao carregar pontos de coleta públicos.</div></div>';
        }
    }
}

function applyPontosFilters(filters = {}) {
    const nameInput = document.getElementById('searchName');
    const materialSelect = document.getElementById('filterMaterial');
    const statusSelect = document.getElementById('filterStatus');

    const nameFilter = (filters.name ?? (nameInput ? nameInput.value : '')).trim().toLowerCase();
    const materialFilter = (filters.material ?? (materialSelect ? materialSelect.value : '')).trim();
    const statusFilter = (filters.status ?? (statusSelect ? statusSelect.value : '')).trim();

    let filtered = Array.isArray(AppData.pontos) ? [...AppData.pontos] : [];

    if (nameFilter) {
        filtered = filtered.filter(ponto =>
            (ponto.nome || '').toLowerCase().includes(nameFilter)
        );
    }

    if (materialFilter) {
        filtered = filtered.filter(ponto =>
            (ponto.materiais || []).some(material => material === materialFilter)
        );
    }

    if (statusFilter) {
        filtered = filtered.filter(ponto => (ponto.status || '') === statusFilter);
    }

    renderPontosTable(filtered);
}

function populateHomeMaterialFilter() {
    const materialSelect = document.getElementById('materialType');
    if (!materialSelect) return;

    const previousValue = materialSelect.value;
    const materialsSet = new Set();
    (AppData.pontos || []).forEach(ponto => {
        (ponto.materiais || []).forEach(material => {
            if (material) materialsSet.add(material);
        });
    });

    const options = ['<option value="">Todos os materiais</option>'];
    materialsSet.forEach(material => {
        const label = material.charAt(0).toUpperCase() + material.slice(1);
        options.push(`<option value="${material}">${label}</option>`);
    });

    materialSelect.innerHTML = options.join('');

    if (previousValue && materialsSet.has(previousValue)) {
        materialSelect.value = previousValue;
    }
}

function renderPontosTable(pontos) {
    const tbody = document.getElementById('pontosTableBody');
    if (!tbody) return;
    
    if (!Array.isArray(pontos) || pontos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted"><em>Nenhum ponto de coleta encontrado</em></td></tr>';
        return;
    }
    
    let html = '';
    pontos.forEach(ponto => {
        const statusClass = ponto.status === 'disponivel' ? 'success' : 
                           ponto.status === 'limitado' ? 'warning' : 'danger';
        const statusText = ponto.status === 'disponivel' ? 'Disponível' : 
                          ponto.status === 'limitado' ? 'Capacidade Limitada' : 'Manutenção';
        
        const materialsHtml = (ponto.materiais || []).map(material => 
            `<span class="badge bg-primary me-1">${material.charAt(0).toUpperCase() + material.slice(1)}</span>`
        ).join('');

        html += `
            <tr>
                <td>
                    <strong>${ponto.nome}</strong><br>
                    <small class="text-muted">${ponto.horario_funcionamento || 'N/A'}</small>
                </td>
                <td>${materialsHtml}</td>
                <td>
                    <small>${ponto.endereco}</small>
                </td>
                <td>
                    <span class="badge bg-${statusClass}">${statusText}</span>
                </td>
                <td>${ponto.responsavel_nome || 'N/A'}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editPonto(${ponto.id})" title="Editar">
                            ✏️
                        </button>
                        <button class="btn btn-outline-info" onclick="viewPonto(${ponto.id})" title="Visualizar">
                            👁️
                        </button>
                        <button class="btn btn-outline-danger" onclick="deletePonto(${ponto.id})" title="Excluir">
                            🗑️
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}

async function initializeUsuarios() {
    // Carregar usuários
    await loadUsers();
    
    const searchForm = document.getElementById('searchUserForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleUsersSearch);
    }

    const userTypeFilter = document.getElementById('filterUserType');
    if (userTypeFilter) {
        userTypeFilter.addEventListener('change', () => applyUsersFilters());
    }

    const userStatusFilter = document.getElementById('filterUserStatus');
    if (userStatusFilter) {
        userStatusFilter.addEventListener('change', () => applyUsersFilters());
    }

    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', handleAddUser);
        const userTypeSelect = document.getElementById('userType');
        const cooperativaFields = document.getElementById('cooperativaUserFields');
        
        if (userTypeSelect && cooperativaFields) {
            userTypeSelect.addEventListener('change', function() {
                if (this.value === 'cooperativa') {
                    cooperativaFields.style.display = 'block';
                } else {
                    cooperativaFields.style.display = 'none';
                }
            });
        }
    }

    const editUserForm = document.getElementById('editUserForm');
    if (editUserForm) {
        editUserForm.addEventListener('submit', handleEditUser);
        const editUserTypeSelect = document.getElementById('editUserType');
        const editCooperativaFields = document.getElementById('editCooperativaUserFields');
        
        if (editUserTypeSelect && editCooperativaFields) {
            editUserTypeSelect.addEventListener('change', function() {
                if (this.value === 'cooperativa') {
                    editCooperativaFields.style.display = 'block';
                } else {
                    editCooperativaFields.style.display = 'none';
                }
            });
        }
    }
}

async function loadUsers() {
    try {
        const users = await DatabaseAPI.getUsers();
        AppData.users = users;
        updateUserStats(users);
        applyUsersFilters();
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        Utils.showToast('Erro ao carregar usuários', 'danger');
    }
}

function updateUserStats(users) {
    // Calcular estatísticas
    const totalUsers = users.length;
    const activeUsers = users.filter(user => user.status === 'ativo').length;
    const cooperativas = users.filter(user => user.tipo === 'cooperativa').length;
    const administradores = users.filter(user => user.tipo === 'admin').length;
    
    // Atualizar elementos HTML
    const totalUsersEl = document.getElementById('totalUsers');
    const activeUsersEl = document.getElementById('activeUsers');
    const cooperativasEl = document.getElementById('cooperativas');
    const administradoresEl = document.getElementById('administradores');
    
    if (totalUsersEl) totalUsersEl.textContent = totalUsers;
    if (activeUsersEl) activeUsersEl.textContent = activeUsers;
    if (cooperativasEl) cooperativasEl.textContent = cooperativas;
    if (administradoresEl) administradoresEl.textContent = administradores;
}


function applyUsersFilters(filters = {}) {
    const nameInput = document.getElementById('searchUserName');
    const typeSelect = document.getElementById('filterUserType');
    const statusSelect = document.getElementById('filterUserStatus');

    const nameFilter = (filters.name ?? (nameInput ? nameInput.value : '')).trim().toLowerCase();
    const typeFilter = filters.type ?? (typeSelect ? typeSelect.value : '');
    const statusFilter = filters.status ?? (statusSelect ? statusSelect.value : '');

    let filtered = AppData.users || [];

    if (nameFilter) {
        filtered = filtered.filter(user => (user.nome || '').toLowerCase().includes(nameFilter));
    }

    if (typeFilter) {
        filtered = filtered.filter(user => (user.tipo || '') === typeFilter);
    }

    if (statusFilter) {
        filtered = filtered.filter(user => (user.status || '') === statusFilter);
    }

    renderUsersTable(filtered);
}

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    
    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted"><em>Nenhum usuário encontrado</em></td></tr>';
        return;
    }
    
    let html = '';
    users.forEach(user => {
        const initials = Utils.getInitials(user.nome);
        const statusClass = user.status === 'ativo' ? 'success' : user.status === 'pendente' ? 'warning' : 'danger';
        const typeClass = user.tipo === 'admin' ? 'warning' : 'info';
        const typeText = user.tipo === 'admin' ? 'Administrador' : 'Cooperativa';
        
        html += `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center me-3" style="width: 40px; height: 40px;">
                            <span class="text-white fw-bold">${initials}</span>
                        </div>
                        <div>
                            <strong>${user.nome}</strong><br>
                            <small class="text-muted">${user.organizacao || 'N/A'}</small>
                        </div>
                    </div>
                </td>
                <td>${user.email}</td>
                <td><span class="badge bg-${typeClass}">${typeText}</span></td>
                <td><span class="badge bg-${statusClass}">${user.status.charAt(0).toUpperCase() + user.status.slice(1)}</span></td>
                <td>${new Date(user.data_criacao).toLocaleDateString('pt-BR')}</td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="editUser(${user.id})" title="Editar">
                            ✏️
                        </button>
                        ${user.tipo !== 'admin' ? `
                            <button class="btn btn-outline-danger" onclick="deleteUser(${user.id})" title="Excluir">
                                🗑️
                            </button>
                        ` : `
                            <button class="btn btn-outline-secondary" disabled title="Não é possível excluir administrador principal">
                                🔒
                            </button>
                        `}
                    </div>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html;
}
function initializePerfil() {
    const user = Auth.getCurrentUser();
    fillProfileForm(user);
    const profileForm = document.getElementById('profileForm');
    const passwordForm = document.getElementById('passwordForm');
    const settingsForm = document.getElementById('settingsForm');
    
    if (profileForm) {
        profileForm.addEventListener('submit', handleProfileUpdate);
    }
    
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordChange);
    }
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleSettingsUpdate);
    }
}
function fillProfileForm(user) {
    if (!user) return;
    
    const fields = {
        'firstName': user.nome ? user.nome.split(' ')[0] || '' : '',
        'lastName': user.nome ? user.nome.split(' ').slice(1).join(' ') || '' : '',
        'email': user.email || '',
        'userTypeDisplay': user.tipo === 'admin' ? 'Administrador' : 'Cooperativa',
        'organizationName': user.organizacao || '',
        'phone': user.telefone || '',
        'address': user.endereco || '',
        'cnpj': user.cnpj || ''
    };
    
    Object.keys(fields).forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.value = fields[fieldName];
        }
    });
    
    // Atualizar elementos de exibição do perfil
    updateProfileDisplay(user);
}

function updateProfileDisplay(user) {
    // Atualizar informações do perfil
    const userNameElement = document.getElementById('profileUserName');
    if (userNameElement) {
        userNameElement.textContent = user.nome || 'Nome não informado';
    }
    
    const userTypeElement = document.getElementById('profileUserType');
    if (userTypeElement) {
        userTypeElement.textContent = user.tipo === 'admin' ? 'Administrador' : 'Cooperativa';
    }
    
    const userEmailElement = document.getElementById('profileUserEmail');
    if (userEmailElement) {
        userEmailElement.textContent = user.email || 'Email não informado';
    }
    
    const userStatusElement = document.getElementById('profileUserStatus');
    if (userStatusElement) {
        userStatusElement.textContent = user.status === 'ativo' ? 'Ativo' : 'Pendente';
        userStatusElement.className = user.status === 'ativo' ? 'badge bg-success' : 'badge bg-warning';
    }
    
    // Atualizar iniciais do usuário
    const userInitialsElement = document.getElementById('userInitials');
    if (userInitialsElement && user.nome) {
        const initials = user.nome.split(' ').map(name => name.charAt(0)).join('').toUpperCase();
        userInitialsElement.textContent = initials || 'U';
    }
    
    // Carregar estatísticas do usuário
    loadUserStats(user);
}

async function loadUserStats(user) {
    try {
        // Contar pontos gerenciados pelo usuário
        const pontos = await DatabaseAPI.getPontos();
        const userManagedPoints = pontos.filter(ponto => ponto.responsavel_id == user.id).length;
        
        const userManagedPointsElement = document.getElementById('userManagedPoints');
        if (userManagedPointsElement) {
            userManagedPointsElement.textContent = userManagedPoints;
        }
        
        // Último acesso (simulado - pode ser implementado com timestamp real)
        const userLastAccessElement = document.getElementById('userLastAccess');
        if (userLastAccessElement) {
            userLastAccessElement.textContent = 'Hoje';
        }
        
        // Membro desde (simulado - pode ser implementado com data de criação real)
        const userMemberSinceElement = document.getElementById('userMemberSince');
        if (userMemberSinceElement) {
            userMemberSinceElement.textContent = 'Jan 2024';
        }
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas do usuário:', error);
    }
}

function setupGlobalEventListeners() {
    document.addEventListener('click', function(e) {
        if (e.target.id === 'logoutBtn' || e.target.closest('#logoutBtn')) {
            e.preventDefault();
            Auth.logout();
        }
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const openModals = document.querySelectorAll('.modal.show');
            openModals.forEach(modal => {
                const bsModal = bootstrap.Modal.getInstance(modal);
                if (bsModal) bsModal.hide();
            });
        }
    });
}
function setupInputMasks() {
    document.addEventListener('input', function(e) {
        if (e.target.type === 'tel') {
            e.target.value = Utils.formatPhone(e.target.value);
        }
    });
    document.addEventListener('input', function(e) {
        if (e.target.name === 'cnpj' || e.target.id === 'cnpj') {
            e.target.value = Utils.formatCNPJ(e.target.value);
        }
    });
}
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const validation = FormValidator.validateLoginForm(data);
    if (!validation.isValid) {
        FormValidator.applyValidationErrors(form, validation.errors);
        return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Entrando...';
    
    try {
        const result = await Auth.login(data.email, data.password, data.userType);
        
        if (result.success) {
            Utils.showToast('Login realizado com sucesso!', 'success');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1000);
        } else {
            Utils.showToast(result.message, 'danger');
        }
    } catch (error) {
        Utils.showToast('Erro ao fazer login. Tente novamente.', 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    const validation = FormValidator.validateRegisterForm(data);
    if (!validation.isValid) {
        FormValidator.applyValidationErrors(form, validation.errors);
        return;
    }
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Criando conta...';
    
    try {
        // Preparar dados para envio
        const nomeCompleto = `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim();
        const userData = {
            nome: nomeCompleto,
            email: data.email,
            senha: data.password,
            tipo: data.userType,
            status: 'pendente', // Novos usuários começam como pendentes
            organizacao: data.organizationName || null,
            telefone: data.phone || null,
            endereco: data.address || null,
            cnpj: data.cnpj || null
        };
        
        await DatabaseAPI.createUser(userData);
        
        Utils.showToast('Conta criada com sucesso! Você pode fazer login agora.', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        Utils.showToast('Erro ao criar conta: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
function handleSearchSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const materialType = formData.get('materialType');
    const location = formData.get('location');
    filterCollectionPoints(materialType, location);
    
    Utils.showToast('Busca realizada com sucesso!', 'info');
}
function filterCollectionPoints(materialType, location) {
    const pointsContainer = document.getElementById('collectionPoints');
    if (!pointsContainer) return;
    
    const trimmedMaterial = (materialType || '').trim();
    const trimmedLocation = (location || '').trim().toLowerCase();

    let filteredPoints = Array.isArray(AppData.pontos) ? [...AppData.pontos] : [];

    if (trimmedMaterial) {
        filteredPoints = filteredPoints.filter(ponto =>
            (ponto.materiais || []).includes(trimmedMaterial)
        );
    }

    if (trimmedLocation) {
        filteredPoints = filteredPoints.filter(ponto =>
            (ponto.endereco || '').toLowerCase().includes(trimmedLocation)
        );
    }
    renderCollectionPoints(filteredPoints, pointsContainer);
}
function renderCollectionPoints(points, container) {
    container.innerHTML = '';
    
    if (points.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <h5>Nenhum ponto encontrado</h5>
                    <p>Tente ajustar os filtros de busca.</p>
                </div>
            </div>
        `;
        return;
    }
    
    points.forEach(ponto => {
        const statusClass = ponto.status === 'disponivel' ? 'success' : 
                           ponto.status === 'limitado' ? 'warning' : 'danger';
        const statusText = ponto.status === 'disponivel' ? 'Disponível' : 
                          ponto.status === 'limitado' ? 'Capacidade Limitada' : 'Manutenção';
        
        const materialsHtml = (ponto.materiais || []).map(material => 
            `<span class="badge bg-primary me-1">${material.charAt(0).toUpperCase() + material.slice(1)}</span>`
        ).join('');
        
        const pointHtml = `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${ponto.nome}</h5>
                        <p class="card-text">
                            <strong>Materiais:</strong><br>${materialsHtml}<br>
                            <strong>Endereço:</strong> ${ponto.endereco}<br>
                            <strong>Horário:</strong> ${ponto.horario_funcionamento || 'N/A'}
                        </p>
                        <span class="badge bg-${statusClass}">${statusText}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += pointHtml;
    });
}
async function loadDashboardStats() {
    try {
        const stats = await DatabaseAPI.getStats();
        
        // Atualizar estatísticas principais
        const elements = {
            'activePontos': stats.activePontos,
            'pendingPontos': stats.pendingPontos,
            'totalUsers': stats.totalUsers,
            'materialTypes': stats.materialTypes
        };
        
        Object.keys(elements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = elements[id];
            }
        });
        
        // Atualizar barras de progresso
        updateProgressBar('activePointsProgress', 'activePointsPercent', stats.activePointsPercent);
        updateProgressBar('capacityProgress', 'capacityPercent', stats.capacityPercent);
        updateProgressBar('activeUsersProgress', 'activeUsersPercent', stats.activeUsersPercent);
        
        // Atualizar materiais mais coletados
        updateMaterialsStats(stats.materialsStats);
        
        // Atualizar atividades recentes
        updateRecentActivities(stats.recentActivities);
        
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
        Utils.showToast('Erro ao carregar estatísticas do dashboard', 'danger');
    }
}

function updateProgressBar(progressId, percentId, percent) {
    const progressBar = document.getElementById(progressId);
    const percentElement = document.getElementById(percentId);
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
    }
    if (percentElement) {
        percentElement.textContent = `${percent}%`;
    }
}

function updateMaterialsStats(materials) {
    const container = document.getElementById('materialsStats');
    if (!container) return;
    
    if (materials.length === 0) {
        container.innerHTML = '<div class="text-center text-muted"><em>Nenhum dado de material disponível</em></div>';
        return;
    }
    
    let html = '';
    materials.forEach(material => {
        const percent = Math.round((material.count / materials[0].count) * 100);
        html += `
            <div class="mb-2">
                <div class="d-flex justify-content-between">
                    <span>${material.material.charAt(0).toUpperCase() + material.material.slice(1)}</span>
                    <strong>${percent}%</strong>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function updateRecentActivities(activities) {
    const container = document.getElementById('recentActivities');
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = '<div class="list-group-item text-center text-muted"><em>Nenhuma atividade recente</em></div>';
        return;
    }
    
    let html = '';
    activities.forEach(activity => {
        const timeAgo = getTimeAgo(activity.created_at);
        html += `
            <div class="list-group-item d-flex justify-content-between align-items-start">
                <div class="ms-2 me-auto">
                    <div class="fw-bold">${activity.activity}</div>
                    ${activity.description}
                </div>
                <small class="text-muted">${timeAgo}</small>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Agora mesmo';
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 dia atrás';
    return `${diffInDays} dias atrás`;
}
function handlePontosSearch(e) {
    e.preventDefault();

    const form = e.target;
    const filters = {
        name: form.querySelector('#searchName')?.value || '',
        material: form.querySelector('#filterMaterial')?.value || '',
        status: form.querySelector('#filterStatus')?.value || ''
    };

    applyPontosFilters(filters);
    Utils.showToast('Busca realizada!', 'info');
}

async function handleAddPonto(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Coletar materiais selecionados
    const materials = [];
    const materialCheckboxes = form.querySelectorAll('input[name="materials[]"]:checked');
    materialCheckboxes.forEach(checkbox => {
        materials.push(checkbox.value);
    });
    
    const pontoData = {
        nome: data.nome,
        endereco: data.endereco,
        telefone: data.telefone || null,
        horario_funcionamento: data.horario_inicio && data.horario_fim && data.dias_funcionamento 
            ? `${data.dias_funcionamento}: ${data.horario_inicio} - ${data.horario_fim}`
            : data.dias_funcionamento || null,
        status: data.status || 'disponivel',
        responsavel_id: data.responsavel_id || null,
        materiais: materials
    };
    
    const submitBtn = form.querySelector('button[type="submit"]') || 
                     document.querySelector('button[form="addPontoForm"]') ||
                     document.querySelector('#addPontoModal button[type="submit"]');
    if (!submitBtn) {
        console.error('Botão de submit não encontrado no formulário');
        Utils.showToast('Erro: Botão de submit não encontrado', 'danger');
        return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adicionando...';
    
    try {
        await DatabaseAPI.createPonto(pontoData);
    Utils.showToast('Ponto de coleta adicionado com sucesso!', 'success');
        
        // Recarregar lista de pontos
        await loadPontos();
        
        // Recarregar dashboard se estiver aberto
        if (window.refreshDashboardData) {
            await window.refreshDashboardData();
        }
        
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPontoModal'));
    if (modal) modal.hide();
        form.reset();
        
    } catch (error) {
        Utils.showToast('Erro ao adicionar ponto de coleta: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleEditPonto(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Coletar materiais selecionados
    const materials = [];
    const materialCheckboxes = form.querySelectorAll('input[name="materials[]"]:checked');
    materialCheckboxes.forEach(checkbox => {
        materials.push(checkbox.value);
    });
    
    const pontoData = {
        nome: data.nome,
        endereco: data.endereco,
        telefone: data.telefone || null,
        horario_funcionamento: data.horario_inicio && data.horario_fim && data.dias_funcionamento 
            ? `${data.dias_funcionamento}: ${data.horario_inicio} - ${data.horario_fim}`
            : data.dias_funcionamento || null,
        status: data.status || 'disponivel',
        responsavel_id: data.responsavel_id || null,
        materiais: materials
    };
    
    const submitBtn = form.querySelector('button[type="submit"]') || 
                     document.querySelector('button[form="editPontoForm"]') ||
                     document.querySelector('#editPontoModal button[type="submit"]');
    if (!submitBtn) {
        console.error('Botão de submit não encontrado no formulário');
        Utils.showToast('Erro: Botão de submit não encontrado', 'danger');
        return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    
    try {
        await DatabaseAPI.updatePonto(data.pontoId, pontoData);
        Utils.showToast('Ponto de coleta atualizado com sucesso!', 'success');
        
        // Recarregar lista de pontos
        await loadPontos();
        
        // Recarregar dashboard se estiver aberto
        if (window.refreshDashboardData) {
            await window.refreshDashboardData();
        }
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editPontoModal'));
        if (modal) modal.hide();
        
    } catch (error) {
        Utils.showToast('Erro ao atualizar ponto de coleta: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
function handleUsersSearch(e) {
    e.preventDefault();

    const form = e.target;
    const filters = {
        name: form.querySelector('#searchUserName')?.value || '',
        type: form.querySelector('#filterUserType')?.value || '',
        status: form.querySelector('#filterUserStatus')?.value || ''
    };

    applyUsersFilters(filters);
    Utils.showToast('Busca de usuários realizada!', 'info');
}

async function handleAddUser(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Preparar dados para envio
    const nomeCompleto = `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim();
    const userData = {
        nome: nomeCompleto,
        email: data.email,
        senha: data.password,
        tipo: data.userType || data.tipo,
        status: data.status || 'pendente',
        organizacao: data.organization || null,
        telefone: data.phone || null,
        endereco: data.address || null,
        cnpj: data.cnpj || null
    };
    
    const submitBtn = form.querySelector('button[type="submit"]') || 
                     document.querySelector('button[form="addUserForm"]') ||
                     document.querySelector('#addUserModal button[type="submit"]');
    if (!submitBtn) {
        console.error('Botão de submit não encontrado no formulário');
        Utils.showToast('Erro: Botão de submit não encontrado', 'danger');
        return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adicionando...';
    
    try {
        await DatabaseAPI.createUser(userData);
        Utils.showToast('Usuário adicionado com sucesso!', 'success');
        
        // Fechar modal e limpar formulário
        const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
        if (modal) modal.hide();
        form.reset();
        
        // Recarregar lista de usuários
        await loadUsers();
        
        // Recarregar dashboard se estiver aberto
        if (window.refreshDashboardData) {
            await window.refreshDashboardData();
        }
        
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        Utils.showToast('Erro ao adicionar usuário: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function handleEditUser(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Preparar dados para envio
    const nomeCompleto = `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim();
    const userData = {
        nome: nomeCompleto,
        email: data.email,
        tipo: data.userType,
        status: data.status,
        organizacao: data.organization || null,
        telefone: data.phone || null,
        endereco: data.address || null,
        cnpj: data.cnpj || null
    };
    
    const submitBtn = form.querySelector('button[type="submit"]') || 
                     document.querySelector('button[form="editUserForm"]') ||
                     document.querySelector('#editUserModal button[type="submit"]');
    if (!submitBtn) {
        console.error('Botão de submit não encontrado no formulário');
        Utils.showToast('Erro: Botão de submit não encontrado', 'danger');
        return;
    }
    
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    
    try {
        await DatabaseAPI.updateUser(data.userId, userData);
        Utils.showToast('Usuário atualizado com sucesso!', 'success');
        
        // Fechar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('editUserModal'));
        if (modal) modal.hide();
        
        // Recarregar lista de usuários
        await loadUsers();
        
        // Recarregar dashboard se estiver aberto
        if (window.refreshDashboardData) {
            await window.refreshDashboardData();
        }
        
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        Utils.showToast('Erro ao atualizar usuário: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}
async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    
    // Preparar dados para envio
    const nomeCompleto = `${(data.firstName || '').trim()} ${(data.lastName || '').trim()}`.trim();
    const userData = {
        nome: nomeCompleto,
        email: data.email,
        organizacao: data.organizationName || null,
        telefone: data.phone || null,
        endereco: data.address || null,
        cnpj: data.cnpj || null
    };
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Atualizando...';
    
    try {
        const currentUser = Auth.getCurrentUser();
        if (!currentUser) {
            Utils.showToast('Sessão expirada. Faça login novamente.', 'danger');
            Auth.logout();
            return;
        }

        await DatabaseAPI.updateUser(currentUser.id, userData);
        
        // Atualizar dados do usuário no localStorage
        const updatedUser = { ...currentUser, ...userData };
        localStorage.setItem('reciclafacil_user', JSON.stringify(updatedUser));
        
        Utils.showToast('Perfil atualizado com sucesso!', 'success');
        
        // Atualizar nome na interface
        updateUserInterface(updatedUser);
        fillProfileForm(updatedUser);
        
    } catch (error) {
        console.error('Erro ao atualizar perfil:', error);
        Utils.showToast('Erro ao atualizar perfil: ' + error.message, 'danger');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

function handlePasswordChange(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmNewPassword = formData.get('confirmNewPassword');
    
    if (newPassword !== confirmNewPassword) {
        Utils.showToast('As senhas não coincidem!', 'danger');
        return;
    }
    
    if (newPassword.length < 6) {
        Utils.showToast('A nova senha deve ter pelo menos 6 caracteres!', 'danger');
        return;
    }
    
    Utils.showToast('Senha alterada com sucesso!', 'success');
    e.target.reset();
}

function handleSettingsUpdate(e) {
    e.preventDefault();
    Utils.showToast('Configurações salvas com sucesso!', 'success');
}
async function editPonto(id) {
    try {
        // Buscar dados do ponto
        const ponto = await DatabaseAPI.getPonto(id);
        
        // Preencher o modal com os dados do ponto
        document.getElementById('editPontoId').value = ponto.id;
        document.getElementById('editPontoNome').value = ponto.nome;
        document.getElementById('editPontoEndereco').value = ponto.endereco;
        document.getElementById('editPontoTelefone').value = ponto.telefone || '';
        document.getElementById('editPontoStatus').value = ponto.status;
        document.getElementById('editPontoResponsavel').value = ponto.responsavel_id || '';
        
        // Processar horário de funcionamento
        if (ponto.horario_funcionamento) {
            const horarioParts = ponto.horario_funcionamento.split(': ');
            if (horarioParts.length === 2) {
                document.getElementById('editPontoDias').value = horarioParts[0];
                const horarioRange = horarioParts[1].split(' - ');
                if (horarioRange.length === 2) {
                    document.getElementById('editPontoInicio').value = horarioRange[0];
                    document.getElementById('editPontoFim').value = horarioRange[1];
                }
            }
        }
        
        // Marcar materiais aceitos
        const materialCheckboxes = document.querySelectorAll('#editPontoForm input[name="materials[]"]');
        materialCheckboxes.forEach(checkbox => {
            checkbox.checked = ponto.materiais && ponto.materiais.includes(checkbox.value);
        });
        
        // Carregar responsáveis no dropdown
        await loadResponsaveisForEdit();
        
        // Abrir o modal
        const modal = new bootstrap.Modal(document.getElementById('editPontoModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao carregar dados do ponto:', error);
        Utils.showToast('Erro ao carregar dados do ponto', 'danger');
    }
}
function viewPonto(id) {
    Utils.showToast(`Visualizando ponto ${id}`, 'info');
}
async function deletePonto(id) {
    if (confirm('Tem certeza que deseja excluir este ponto de coleta?')) {
        try {
            await DatabaseAPI.deletePonto(id);
            Utils.showToast('Ponto de coleta excluído com sucesso!', 'success');
            await loadPontos(); // Recarregar lista
            
            // Recarregar dashboard se estiver aberto
            if (window.refreshDashboardData) {
                await window.refreshDashboardData();
            }
        } catch (error) {
            Utils.showToast('Erro ao excluir ponto de coleta: ' + error.message, 'danger');
        }
    }
}

async function editUser(id) {
    try {
        // Buscar dados do usuário
        const user = await DatabaseAPI.getUser(id);
        
        // Preencher o modal com os dados do usuário
        const nomeParts = user.nome.split(' ');
        document.getElementById('editUserId').value = user.id;
        document.getElementById('editUserFirstName').value = nomeParts[0] || '';
        document.getElementById('editUserLastName').value = nomeParts.slice(1).join(' ') || '';
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserPhone').value = user.telefone || '';
        document.getElementById('editUserType').value = user.tipo;
        document.getElementById('editUserStatus').value = user.status;
        document.getElementById('editUserAddress').value = user.endereco || '';
        document.getElementById('editUserOrganization').value = user.organizacao || '';
        document.getElementById('editUserCnpj').value = user.cnpj || '';
        
        // Mostrar/ocultar campos de cooperativa
        const cooperativaFields = document.getElementById('editCooperativaUserFields');
        if (user.tipo === 'cooperativa') {
            cooperativaFields.style.display = 'block';
        } else {
            cooperativaFields.style.display = 'none';
        }
        
        // Abrir o modal
        const modal = new bootstrap.Modal(document.getElementById('editUserModal'));
        modal.show();
        
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
        Utils.showToast('Erro ao carregar dados do usuário', 'danger');
    }
}


async function deleteUser(id) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        try {
            await DatabaseAPI.deleteUser(id);
            Utils.showToast('Usuário excluído com sucesso!', 'success');
            await loadUsers(); // Recarregar lista
            
            // Recarregar dashboard se estiver aberto
            if (window.refreshDashboardData) {
                await window.refreshDashboardData();
            }
        } catch (error) {
            Utils.showToast('Erro ao excluir usuário: ' + error.message, 'danger');
        }
    }
}
function approveUser(id) {
    if (confirm('Aprovar este usuário?')) {
        Utils.showToast('Usuário aprovado!', 'success');
    }
}
function resetForm() {
    const user = Auth.getCurrentUser();
    fillProfileForm(user);
    Utils.showToast('Alterações canceladas', 'info');
}
function exportData() {
    Utils.showToast('Exportação de dados iniciada. Você receberá um email em breve.', 'info');
}
function deleteAccount() {
    const modal = new bootstrap.Modal(document.getElementById('deleteAccountModal'));
    modal.show();
}
function confirmDeleteAccount() {
    const password = document.getElementById('confirmDeletePassword').value;
    
    if (!password) {
        Utils.showToast('Por favor, digite sua senha para confirmar.', 'danger');
        return;
    }
    
    if (confirm('Esta ação é irreversível. Tem certeza absoluta?')) {
        Utils.showToast('Conta excluída. Você será redirecionado...', 'success');
        setTimeout(() => {
            Auth.logout();
        }, 2000);
    }
}
// Funções para integração com banco de dados
const DatabaseAPI = {
    baseURL: 'api',
    
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };
        
        try {
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Erro na requisição');
            }
            
            return data;
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    },
    
    // Usuários
    async getUsers() {
        const response = await this.request('users.php');
        AppData.users = response.data;
        return response.data;
    },
    
    async getUser(id) {
        const response = await this.request(`users.php/${id}`);
        return response.data;
    },
    
    async createUser(userData) {
        const response = await this.request('users.php', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return response;
    },
    
    async updateUser(id, userData) {
        const response = await this.request(`users.php/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        return response;
    },
    
    async deleteUser(id) {
        const response = await this.request(`users.php/${id}`, {
            method: 'DELETE'
        });
        return response;
    },
    
    // Pontos de Coleta
    async getPontos() {
        const response = await this.request('pontos.php');
        AppData.pontos = response.data;
        return response.data;
    },
    
    async getPonto(id) {
        const response = await this.request(`pontos.php/${id}`);
        return response.data;
    },
    
    async createPonto(pontoData) {
        const response = await this.request('pontos.php', {
            method: 'POST',
            body: JSON.stringify(pontoData)
        });
        return response;
    },
    
    async updatePonto(id, pontoData) {
        const response = await this.request(`pontos.php/${id}`, {
            method: 'PUT',
            body: JSON.stringify(pontoData)
        });
        return response;
    },
    
    async deletePonto(id) {
        const response = await this.request(`pontos.php/${id}`, {
            method: 'DELETE'
        });
        return response;
    },
    
    // Estatísticas
    async getStats() {
        const response = await this.request('stats.php');
        return response.data;
    }
};

// Função global para recarregar dados
window.refreshDashboardData = async function() {
    if (typeof loadDashboardStats === 'function') {
        await loadDashboardStats();
    }
    if (typeof loadUsers === 'function') {
        await loadUsers();
    }
    if (typeof loadPontos === 'function') {
        await loadPontos();
    }
};

window.ReciclaFacil = {
    Auth,
    Utils,
    FormValidator,
    DatabaseAPI,
    AppData,
    editPonto,
    viewPonto,
    deletePonto,
    editUser,
    deleteUser,
    approveUser,
    resetForm,
    exportData,
    deleteAccount,
    confirmDeleteAccount,
    refreshDashboardData: window.refreshDashboardData
};
