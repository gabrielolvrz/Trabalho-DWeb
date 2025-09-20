<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));
    
    // Extrair ID se presente na URL
    $id = null;
    // Procurar por ID em qualquer posição da URL
    foreach ($pathParts as $part) {
        if (is_numeric($part)) {
            $id = (int)$part;
            break;
        }
    }
    
    switch ($method) {
        case 'GET':
            if ($id) {
                // Buscar usuário específico
                $user = $db->fetchOne(
                    "SELECT id, nome, email, tipo, status, organizacao, telefone, endereco, cnpj, data_criacao 
                     FROM usuarios WHERE id = ?",
                    [$id]
                );
                
                if ($user) {
                    echo json_encode(['success' => true, 'data' => $user]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']);
                }
            } else {
                // Buscar todos os usuários
                $users = $db->fetchAll(
                    "SELECT id, nome, email, tipo, status, organizacao, telefone, endereco, cnpj, data_criacao 
                     FROM usuarios ORDER BY data_criacao DESC"
                );
                
                echo json_encode(['success' => true, 'data' => $users]);
            }
            break;
            
        case 'POST':
            // Criar novo usuário
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
                break;
            }
            
            // Validar dados obrigatórios
            $required = ['nome', 'email', 'senha', 'tipo'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => "Campo '$field' é obrigatório"]);
                    exit;
                }
            }
            
            // Verificar se email já existe
            $existing = $db->fetchOne("SELECT id FROM usuarios WHERE email = ?", [$input['email']]);
            if ($existing) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Email já cadastrado']);
                break;
            }
            
            // Preparar dados para inserção
            $userData = [
                'nome' => $input['nome'],
                'email' => $input['email'],
                'senha' => password_hash($input['senha'], PASSWORD_DEFAULT),
                'tipo' => $input['tipo'],
                'status' => $input['status'] ?? 'pendente',
                'organizacao' => $input['organizacao'] ?? null,
                'telefone' => $input['telefone'] ?? null,
                'endereco' => $input['endereco'] ?? null,
                'cnpj' => $input['cnpj'] ?? null
            ];
            
            $userId = $db->insert('usuarios', $userData);
            
            // Buscar usuário criado
            $newUser = $db->fetchOne(
                "SELECT id, nome, email, tipo, status, organizacao, telefone, endereco, cnpj, data_criacao 
                 FROM usuarios WHERE id = ?",
                [$userId]
            );
            
            echo json_encode(['success' => true, 'data' => $newUser]);
            break;
            
        case 'PUT':
            // Atualizar usuário
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID do usuário é obrigatório']);
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
                break;
            }
            
            // Verificar se usuário existe
            $existing = $db->fetchOne("SELECT id FROM usuarios WHERE id = ?", [$id]);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']);
                break;
            }
            
            // Preparar dados para atualização
            $updateData = [];
            $allowedFields = ['nome', 'email', 'tipo', 'status', 'organizacao', 'telefone', 'endereco', 'cnpj'];
            
            foreach ($allowedFields as $field) {
                if (isset($input[$field])) {
                    $updateData[$field] = $input[$field];
                }
            }
            
            // Se senha foi fornecida, hash ela
            if (isset($input['senha']) && !empty($input['senha'])) {
                $updateData['senha'] = password_hash($input['senha'], PASSWORD_DEFAULT);
            }
            
            if (empty($updateData)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nenhum dado para atualizar']);
                break;
            }
            
            $db->update('usuarios', $updateData, 'id = ?', [$id]);
            
            // Buscar usuário atualizado
            $updatedUser = $db->fetchOne(
                "SELECT id, nome, email, tipo, status, organizacao, telefone, endereco, cnpj, data_criacao 
                 FROM usuarios WHERE id = ?",
                [$id]
            );
            
            echo json_encode(['success' => true, 'data' => $updatedUser]);
            break;
            
        case 'DELETE':
            // Deletar usuário
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID do usuário é obrigatório']);
                break;
            }
            
            // Verificar se usuário existe
            $existing = $db->fetchOne("SELECT id, tipo FROM usuarios WHERE id = ?", [$id]);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Usuário não encontrado']);
                break;
            }
            
            // Não permitir deletar administradores
            if ($existing['tipo'] === 'admin') {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Não é possível excluir administradores']);
                break;
            }
            
            $db->delete('usuarios', 'id = ?', [$id]);
            
            echo json_encode(['success' => true, 'message' => 'Usuário excluído com sucesso']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método não permitido']);
            break;
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
