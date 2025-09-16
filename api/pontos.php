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
    if (count($pathParts) > 2 && is_numeric($pathParts[2])) {
        $id = (int)$pathParts[2];
    }
    
    switch ($method) {
        case 'GET':
            if ($id) {
                // Buscar ponto específico
                $ponto = $db->fetchOne(
                    "SELECT p.id, p.name as nome, p.address as endereco, p.phone as telefone, p.hours as horario_funcionamento, 
                            p.status, p.user_id as responsavel_id, u.nome as responsavel_nome,
                            p.materials as materiais
                     FROM pontos_coleta p
                     LEFT JOIN usuarios u ON p.user_id = u.id
                     WHERE p.id = ?",
                    [$id]
                );
                
                if ($ponto) {
                    $ponto['materiais'] = $ponto['materiais'] ? json_decode($ponto['materiais'], true) : [];
                    echo json_encode(['success' => true, 'data' => $ponto]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Ponto de coleta não encontrado']);
                }
            } else {
                // Buscar todos os pontos
                $pontos = $db->fetchAll(
                    "SELECT p.id, p.name as nome, p.address as endereco, p.phone as telefone, p.hours as horario_funcionamento, 
                            p.status, p.user_id as responsavel_id, u.nome as responsavel_nome,
                            p.materials as materiais
                     FROM pontos_coleta p
                     LEFT JOIN usuarios u ON p.user_id = u.id
                     ORDER BY p.created_at DESC"
                );
                
                // Processar materiais
                foreach ($pontos as &$ponto) {
                    $ponto['materiais'] = $ponto['materiais'] ? json_decode($ponto['materiais'], true) : [];
                }
                
                echo json_encode(['success' => true, 'data' => $pontos]);
            }
            break;
            
        case 'POST':
            // Criar novo ponto
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
                break;
            }
            
            // Validar dados obrigatórios
            $required = ['nome', 'endereco', 'materiais'];
            foreach ($required as $field) {
                if (empty($input[$field])) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => "Campo '$field' é obrigatório"]);
                    exit;
                }
            }
            
            // Inserir ponto
            $pontoData = [
                'name' => $input['nome'],
                'address' => $input['endereco'],
                'phone' => $input['telefone'] ?? '',
                'hours' => $input['horario_funcionamento'] ?? '',
                'status' => $input['status'] ?? 'disponivel',
                'user_id' => $input['responsavel_id'] ?? null,
                'responsible' => '', // Campo obrigatório
                'materials' => !empty($input['materiais']) ? json_encode($input['materiais']) : '[]'
            ];
            
            $pontoId = $db->insert('pontos_coleta', $pontoData);
            
            // Buscar ponto criado
            $newPonto = $db->fetchOne(
                "SELECT p.id, p.name as nome, p.address as endereco, p.phone as telefone, p.hours as horario_funcionamento, 
                        p.status, p.user_id as responsavel_id, u.nome as responsavel_nome,
                        p.materials as materiais
                 FROM pontos_coleta p
                 LEFT JOIN usuarios u ON p.user_id = u.id
                 WHERE p.id = ?",
                [$pontoId]
            );
            
            $newPonto['materiais'] = $newPonto['materiais'] ? json_decode($newPonto['materiais'], true) : [];
            
            echo json_encode(['success' => true, 'data' => $newPonto]);
            break;
            
        case 'PUT':
            // Atualizar ponto
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID do ponto é obrigatório']);
                break;
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Dados inválidos']);
                break;
            }
            
            // Verificar se ponto existe
            $existing = $db->fetchOne("SELECT id FROM pontos_coleta WHERE id = ?", [$id]);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ponto de coleta não encontrado']);
                break;
            }
            
            // Atualizar dados do ponto
            $updateData = [];
            $fieldMapping = [
                'nome' => 'name',
                'endereco' => 'address', 
                'telefone' => 'phone',
                'horario_funcionamento' => 'hours',
                'status' => 'status',
                'responsavel_id' => 'user_id'
            ];
            
            foreach ($fieldMapping as $inputField => $dbField) {
                if (isset($input[$inputField])) {
                    $updateData[$dbField] = $input[$inputField];
                }
            }
            
            // Atualizar materiais se fornecidos
            if (isset($input['materiais']) && is_array($input['materiais'])) {
                $updateData['materials'] = json_encode($input['materiais']);
            }
            
            if (!empty($updateData)) {
                $db->query("UPDATE pontos_coleta SET " . implode(' = ?, ', array_keys($updateData)) . " = ? WHERE id = ?", array_merge(array_values($updateData), [$id]));
            }
            
            // Buscar ponto atualizado
            $updatedPonto = $db->fetchOne(
                "SELECT p.id, p.name as nome, p.address as endereco, p.phone as telefone, p.hours as horario_funcionamento, 
                        p.status, p.user_id as responsavel_id, u.nome as responsavel_nome,
                        p.materials as materiais
                 FROM pontos_coleta p
                 LEFT JOIN usuarios u ON p.user_id = u.id
                 WHERE p.id = ?",
                [$id]
            );
            
            $updatedPonto['materiais'] = $updatedPonto['materiais'] ? json_decode($updatedPonto['materiais'], true) : [];
            
            echo json_encode(['success' => true, 'data' => $updatedPonto]);
            break;
            
        case 'DELETE':
            // Deletar ponto
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID do ponto é obrigatório']);
                break;
            }
            
            // Verificar se ponto existe
            $existing = $db->fetchOne("SELECT id FROM pontos_coleta WHERE id = ?", [$id]);
            if (!$existing) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Ponto de coleta não encontrado']);
                break;
            }
            
            // Deletar ponto (materiais serão deletados automaticamente por CASCADE)
            $db->delete('pontos_coleta', 'id = ?', [$id]);
            
            echo json_encode(['success' => true, 'message' => 'Ponto de coleta excluído com sucesso']);
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
