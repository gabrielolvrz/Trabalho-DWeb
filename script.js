// Dados simulados para demonstração
const mockData = {
    users: [
        {
            id: 1,
            name: 'João Silva',
            email: 'joao.silva@cooperativaverde.com',
            type: 'cooperativa',
            status: 'ativo',
            organization: 'Cooperativa Verde Ltda.',
            phone: '(11) 99999-9999',
            address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
            createdAt: '2024-01-15'
        },
        {
            id: 2,
            name: 'Maria Santos',
            email: 'maria.santos@ecorecicla.com',
            type: 'cooperativa',
            status: 'ativo',
            organization: 'EcoRecicla',
            phone: '(11) 88888-8888',
            address: 'Av. Sustentável, 456 - Bairro Novo - São Paulo/SP',
            createdAt: '2024-01-22'
        },
        {
            id: 3,
            name: 'Carlos Almeida',
            email: 'carlos.admin@reciclafacil.com',
            type: 'admin',
            status: 'ativo',
            organization: 'ReciclaFácil',
            phone: '(11) 77777-7777',
            address: 'Rua Administrativa, 789 - Centro - São Paulo/SP',
            createdAt: '2024-01-10'
        }
    ],
    pontos: [
        {
            id: 1,
            name: 'EcoPonto Centro',
            materials: ['papel', 'plastico', 'vidro'],
            address: 'Rua das Flores, 123 - Centro - São Paulo/SP',
            status: 'disponivel',
            responsible: 'Cooperativa Verde',
            phone: '(11) 99999-9999',
            hours: 'Seg-Sex: 8h-17h'
        },
        {
            id: 2,
            name: 'Cooperativa Sustentável',
            materials: ['metal', 'eletronicos'],
            address: 'Av. Sustentável, 456 - Bairro Novo - São Paulo/SP',
            status: 'limitado',
            responsible: 'João Silva',
            phone: '(11) 88888-8888',
            hours: 'Seg-Sáb: 7h-16h'
        },
        {
            id: 3,
            name: 'Recicla Mais',
            materials: ['papel', 'plastico', 'metal'],
            address: 'Rua Ecológica, 789 - Vila Verde - São Paulo/SP',
            status: 'disponivel',
            responsible: 'Maria Santos',
            phone: '(11) 77777-7777',
            hours: 'Ter-Dom: 9h-18h'
        }
    ],
    currentUser: {
        id: 1,
        name: 'João Silva',
        email: 'joao.silva@cooperativaverde.com',
        type: 'cooperativa',
        organization: 'Cooperativa Verde Ltda.'
    }
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
        await Utils.delay(1000);
        const validCredentials = [
            { email: 'admin@reciclafacil.com', password: 'admin123', type: 'admin' },
            { email: 'cooperativa@exemplo.com', password: 'coop123', type: 'cooperativa' }
        ];

        const user = validCredentials.find(cred => 
            cred.email === email && cred.password === password && cred.type === userType
        );

        if (user) {
            const userData = {
                id: user.type === 'admin' ? 999 : 1,
                name: user.type === 'admin' ? 'Administrador' : 'João Silva',
                email: user.email,
                type: user.type,
                organization: user.type === 'admin' ? 'ReciclaFácil' : 'Cooperativa Verde Ltda.'
            };
            
            localStorage.setItem('reciclafacil_user', JSON.stringify(userData));
            return { success: true, user: userData };
        } else {
            return { success: false, message: 'Credenciais inválidas' };
        }
    },

    logout: () => {
        localStorage.removeItem('reciclafacil_user');
        window.location.href = '../index.html';
    },

    getCurrentUser: () => {
        const userData = localStorage.getItem('reciclafacil_user');
        return userData ? JSON.parse(userData) : null;
    },

    isAdmin: () => {
        const user = Auth.getCurrentUser();
        return user && user.type === 'admin';
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
    if (window.location.pathname.includes('/private/')) {
        if (!Auth.isLoggedIn()) {
            window.location.href = '../login.html';
            return;
        }
        initializePrivateArea();
    }

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
        if (el) el.textContent = user.name;
    });

    const userEmailElements = document.querySelectorAll('#profileUserEmail');
    userEmailElements.forEach(el => {
        if (el) el.textContent = user.email;
    });

    const userTypeElements = document.querySelectorAll('#profileUserType');
    userTypeElements.forEach(el => {
        if (el) el.textContent = user.type === 'admin' ? 'Administrador' : 'Cooperativa';
    });
    const userInitialsElements = document.querySelectorAll('#userInitials');
    userInitialsElements.forEach(el => {
        if (el) el.textContent = Utils.getInitials(user.name);
    });
}
function setupUserNavigation(user) {
    const usersNavItem = document.getElementById('usersNavItem');
    const manageUsersBtn = document.getElementById('manageUsersBtn');
    if (user.type !== 'admin') {
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
            initializeDashboard();
            break;
        case 'pontos-coleta.html':
            initializePontosColeta();
            break;
        case 'usuarios.html':
            initializeUsuarios();
            break;
        case 'perfil.html':
            initializePerfil();
            break;
    }
}
function initializeHomePage() {
    const searchForm = document.getElementById('searchForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleSearchSubmit);
    }
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
function initializeDashboard() {
    loadDashboardStats();
}
function initializePontosColeta() {
    const searchForm = document.getElementById('searchFilterForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handlePontosSearch);
    }

    const addPontoForm = document.getElementById('addPontoForm');
    if (addPontoForm) {
        addPontoForm.addEventListener('submit', handleAddPonto);
    }
}
function initializeUsuarios() {
    if (!Auth.isAdmin()) {
        window.location.href = 'dashboard.html';
        return;
    }
    const searchForm = document.getElementById('searchUserForm');
    if (searchForm) {
        searchForm.addEventListener('submit', handleUsersSearch);
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
        'firstName': user.name.split(' ')[0] || '',
        'lastName': user.name.split(' ').slice(1).join(' ') || '',
        'email': user.email || '',
        'userTypeDisplay': user.type === 'admin' ? 'Administrador' : 'Cooperativa',
        'organizationName': user.organization || ''
    };
    
    Object.keys(fields).forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.value = fields[fieldName];
        }
    });
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
                window.location.href = 'private/dashboard.html';
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
        await Utils.delay(2000);
        
        Utils.showToast('Conta criada com sucesso! Você pode fazer login agora.', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 2000);
    } catch (error) {
        Utils.showToast('Erro ao criar conta. Tente novamente.', 'danger');
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
    
    let filteredPoints = mockData.pontos;
    
    if (materialType) {
        filteredPoints = filteredPoints.filter(ponto => 
            ponto.materials.includes(materialType)
        );
    }
    
    if (location) {
        filteredPoints = filteredPoints.filter(ponto => 
            ponto.address.toLowerCase().includes(location.toLowerCase())
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
        
        const materialsHtml = ponto.materials.map(material => 
            `<span class="badge bg-primary me-1">${material.charAt(0).toUpperCase() + material.slice(1)}</span>`
        ).join('');
        
        const pointHtml = `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <h5 class="card-title">${ponto.name}</h5>
                        <p class="card-text">
                            <strong>Materiais:</strong><br>${materialsHtml}<br>
                            <strong>Endereço:</strong> ${ponto.address}<br>
                            <strong>Horário:</strong> ${ponto.hours}
                        </p>
                        <span class="badge bg-${statusClass}">${statusText}</span>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML += pointHtml;
    });
}
function loadDashboardStats() {
    const stats = {
        activePontos: mockData.pontos.filter(p => p.status === 'disponivel').length,
        pendingPontos: mockData.pontos.filter(p => p.status === 'limitado').length,
        totalUsers: mockData.users.length,
        materialTypes: 5
    };
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
}
function handlePontosSearch(e) {
    e.preventDefault();
    Utils.showToast('Busca realizada!', 'info');
}

function handleAddPonto(e) {
    e.preventDefault();
    Utils.showToast('Ponto de coleta adicionado com sucesso!', 'success');
    const modal = bootstrap.Modal.getInstance(document.getElementById('addPontoModal'));
    if (modal) modal.hide();
    e.target.reset();
}
function handleUsersSearch(e) {
    e.preventDefault();
    Utils.showToast('Busca de usuários realizada!', 'info');
}

function handleAddUser(e) {
    e.preventDefault();
    Utils.showToast('Usuário adicionado com sucesso!', 'success');
    const modal = bootstrap.Modal.getInstance(document.getElementById('addUserModal'));
    if (modal) modal.hide();
    e.target.reset();
}
function handleProfileUpdate(e) {
    e.preventDefault();
    Utils.showToast('Perfil atualizado com sucesso!', 'success');
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
function editPonto(id) {
    Utils.showToast(`Editando ponto ${id}`, 'info');
}
function viewPonto(id) {
    Utils.showToast(`Visualizando ponto ${id}`, 'info');
}
function deletePonto(id) {
    if (confirm('Tem certeza que deseja excluir este ponto de coleta?')) {
        Utils.showToast('Ponto de coleta excluído!', 'success');
    }
}
function editUser(id) {
    Utils.showToast(`Editando usuário ${id}`, 'info');
}
function viewUser(id) {
    Utils.showToast(`Visualizando usuário ${id}`, 'info');
}
function deleteUser(id) {
    if (confirm('Tem certeza que deseja excluir este usuário?')) {
        Utils.showToast('Usuário excluído!', 'success');
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
window.ReciclaFacil = {
    Auth,
    Utils,
    FormValidator,
    editPonto,
    viewPonto,
    deletePonto,
    editUser,
    viewUser,
    deleteUser,
    approveUser,
    resetForm,
    exportData,
    deleteAccount,
    confirmDeleteAccount
};

