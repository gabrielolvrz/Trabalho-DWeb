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

/**
 * Mapeia materiais (materiais_ponto) para cada ponto informado.
 * @param Database $db
 * @param int[] $pontoIds
 * @return array<int,array<int,string>>
 */
function loadMateriais(Database $db, array $pontoIds): array
{
    if (empty($pontoIds)) return [];

    $placeholders = implode(',', array_fill(0, count($pontoIds), '?'));
    $rows = $db->fetchAll(
        "SELECT ponto_id, material FROM materiais_ponto WHERE ponto_id IN ($placeholders)",
        $pontoIds
    );

    $map = [];
    foreach ($rows as $row) {
        $pid = (int)$row['ponto_id'];
        $map[$pid][] = $row['material'];
    }

    return $map;
}

/**
 * Normaliza o payload de materiais recebido da requisição.
 * @param mixed $materiais
 * @return array<int,string>
 */
function normalizeMateriais($materiais): array
{
    if (!is_array($materiais)) return [];
    $filtered = array_map(static function ($m) {
        return trim((string)$m);
    }, $materiais);

    $filtered = array_values(array_filter(array_unique($filtered), static function ($m) {
        return $m !== '';
    }));

    return $filtered;
}

/**
 * Persiste os materiais (apagando os anteriores) para um ponto.
 */
function persistMateriais(Database $db, int $pontoId, array $materiais): void
{
    // Limpa materiais atuais e insere os fornecidos
    $db->delete('materiais_ponto', 'ponto_id = ?', [$pontoId]);

    if (empty($materiais)) return;

    $conn = $db->getConnection();
    $stmt = $conn->prepare('INSERT INTO materiais_ponto (ponto_id, material) VALUES (:ponto_id, :material)');
    foreach ($materiais as $material) {
        $stmt->execute([
            'ponto_id' => $pontoId,
            'material' => $material,
        ]);
    }
}

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
                // Buscar ponto específico
                $ponto = $db->fetchOne(
                    "SELECT p.id, p.nome, p.endereco, p.telefone, p.horario_funcionamento, 
                            p.status, p.responsavel_id, u.nome AS responsavel_nome,
                            p.data_criacao, p.data_atualizacao
                     FROM pontos_coleta p
                     LEFT JOIN usuarios u ON p.responsavel_id = u.id
                     WHERE p.id = ?",
                    [$id]
                );
                
                if ($ponto) {
                    $materiais = loadMateriais($db, [$ponto['id']]);
                    $ponto['materiais'] = $materiais[$ponto['id']] ?? [];
                    echo json_encode(['success' => true, 'data' => $ponto]);
                } else {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Ponto de coleta não encontrado']);
                }
            } else {
                // Buscar todos os pontos
                $pontos = $db->fetchAll(
                    "SELECT p.id, p.nome, p.endereco, p.telefone, p.horario_funcionamento,
                            p.status, p.responsavel_id, u.nome AS responsavel_nome,
                            p.data_criacao, p.data_atualizacao
                     FROM pontos_coleta p
                     LEFT JOIN usuarios u ON p.responsavel_id = u.id
                     ORDER BY p.data_criacao DESC"
                );

                $materiaisMap = loadMateriais($db, array_column($pontos, 'id'));
                foreach ($pontos as &$ponto) {
                    $ponto['materiais'] = $materiaisMap[$ponto['id']] ?? [];
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
            
            $materiais = normalizeMateriais($input['materiais'] ?? []);

            $pontoData = [
                'nome' => $input['nome'],
                'endereco' => $input['endereco'],
                'telefone' => $input['telefone'] ?? null,
                'horario_funcionamento' => $input['horario_funcionamento'] ?? null,
                'status' => $input['status'] ?? 'disponivel',
                'responsavel_id' => $input['responsavel_id'] ?? null,
            ];

            $pontoId = (int)$db->insert('pontos_coleta', $pontoData);
            persistMateriais($db, $pontoId, $materiais);

            $newPonto = $db->fetchOne(
                "SELECT p.id, p.nome, p.endereco, p.telefone, p.horario_funcionamento,
                        p.status, p.responsavel_id, u.nome AS responsavel_nome,
                        p.data_criacao, p.data_atualizacao
                 FROM pontos_coleta p
                 LEFT JOIN usuarios u ON p.responsavel_id = u.id
                 WHERE p.id = ?",
                [$pontoId]
            );

            $newPonto['materiais'] = $materiais;

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
            
            $updateData = [];
            $fieldMapping = [
                'nome' => 'nome',
                'endereco' => 'endereco', 
                'telefone' => 'telefone',
                'horario_funcionamento' => 'horario_funcionamento',
                'status' => 'status',
                'responsavel_id' => 'responsavel_id'
            ];

            foreach ($fieldMapping as $inputField => $dbField) {
                if (array_key_exists($inputField, $input)) {
                    $updateData[$dbField] = $input[$inputField];
                }
            }

            if (!empty($updateData)) {
                $db->update('pontos_coleta', $updateData, 'id = ?', [$id]);
            }

            $materiais = null;
            if (array_key_exists('materiais', $input)) {
                $materiais = normalizeMateriais($input['materiais']);
                persistMateriais($db, $id, $materiais);
            }

            $updatedPonto = $db->fetchOne(
                "SELECT p.id, p.nome, p.endereco, p.telefone, p.horario_funcionamento,
                        p.status, p.responsavel_id, u.nome AS responsavel_nome,
                        p.data_criacao, p.data_atualizacao
                 FROM pontos_coleta p
                 LEFT JOIN usuarios u ON p.responsavel_id = u.id
                 WHERE p.id = ?",
                [$id]
            );

            if ($updatedPonto) {
                if ($materiais === null) {
                    $materiaisMap = loadMateriais($db, [$id]);
                    $updatedPonto['materiais'] = $materiaisMap[$id] ?? [];
                } else {
                    $updatedPonto['materiais'] = $materiais;
                }
            }
            
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
