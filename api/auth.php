<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../src/Core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance();
    $method = $_SERVER['REQUEST_METHOD'];
    
    if ($method === 'POST') {
        $input = json_decode(file_get_contents('php://input'), true);
        
        if (!$input) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
            exit;
        }
        
        $action = $input['action'] ?? '';
        
        switch ($action) {
            case 'login':
                handleLogin($db, $input);
                break;
            case 'logout':
                handleLogout();
                break;
            case 'check':
                handleCheckAuth($db);
                break;
            default:
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Ação inválida']);
                break;
        }
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}

function handleLogin($db, $input) {
    $email = $input['email'] ?? '';
    $password = $input['password'] ?? '';
    $userType = $input['userType'] ?? '';
    
    if (empty($email) || empty($password) || empty($userType)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email, senha e tipo de usuário são obrigatórios']);
        return;
    }
    
    // Buscar usuário no banco
    $user = $db->fetchOne(
        "SELECT id, nome, email, senha, tipo, status, organizacao, telefone, endereco, cnpj 
         FROM usuarios 
         WHERE email = ? AND tipo = ?",
        [$email, $userType]
    );
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Credenciais inválidas']);
        return;
    }
    
    // Verificar senha
    if (!password_verify($password, $user['senha'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Credenciais inválidas']);
        return;
    }
    
    // Verificar se usuário está ativo
    if ($user['status'] !== 'ativo') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Usuário inativo. Entre em contato com o administrador.']);
        return;
    }
    
    // Remover senha da resposta
    unset($user['senha']);
    
    // Criar token de sessão (simples)
    $token = bin2hex(random_bytes(32));
    
    // Salvar sessão (opcional - pode usar session do PHP)
    session_start();
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_token'] = $token;
    $_SESSION['user_data'] = $user;
    
    echo json_encode([
        'success' => true, 
        'message' => 'Login realizado com sucesso',
        'data' => [
            'user' => $user,
            'token' => $token
        ]
    ]);
}

function handleLogout() {
    session_start();
    session_destroy();
    
    echo json_encode([
        'success' => true, 
        'message' => 'Logout realizado com sucesso'
    ]);
}

function handleCheckAuth($db) {
    session_start();
    
    if (!isset($_SESSION['user_id']) || !isset($_SESSION['user_token'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Não autenticado']);
        return;
    }
    
    $userId = $_SESSION['user_id'];
    
    // Verificar se usuário ainda existe e está ativo
    $user = $db->fetchOne(
        "SELECT id, nome, email, tipo, status, organizacao, telefone, endereco, cnpj 
         FROM usuarios 
         WHERE id = ? AND status = 'ativo'",
        [$userId]
    );
    
    if (!$user) {
        session_destroy();
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Usuário não encontrado ou inativo']);
        return;
    }
    
    echo json_encode([
        'success' => true, 
        'data' => $user
    ]);
}


