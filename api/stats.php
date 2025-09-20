<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../src/Core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Buscar estatísticas
        $stats = [];
        
        // Contar pontos ativos
        $activePontos = $db->fetchOne(
            "SELECT COUNT(*) AS count FROM pontos_coleta WHERE status = 'disponivel'"
        );
        $stats['activePontos'] = $activePontos['count'] ?? 0;

        $pendingPontos = $db->fetchOne(
            "SELECT COUNT(*) AS count FROM pontos_coleta WHERE status = 'limitado'"
        );
        $stats['pendingPontos'] = $pendingPontos['count'] ?? 0;

        $totalUsersActive = $db->fetchOne(
            "SELECT COUNT(*) AS count FROM usuarios WHERE status = 'ativo'"
        );
        $stats['totalUsers'] = $totalUsersActive['count'] ?? 0;

        $materialTypes = $db->fetchOne(
            "SELECT COUNT(DISTINCT material) AS count FROM materiais_ponto"
        );
        $stats['materialTypes'] = $materialTypes['count'] ?? 0;

        $totalPontos = $db->fetchOne("SELECT COUNT(*) AS count FROM pontos_coleta");
        $totalPontosValue = $totalPontos['count'] ?? 0;
        $stats['activePointsPercent'] = $totalPontosValue > 0
            ? (int)round(($stats['activePontos'] / $totalPontosValue) * 100)
            : 0;

        $totalUsers = $db->fetchOne("SELECT COUNT(*) AS count FROM usuarios");
        $totalUsersValue = $totalUsers['count'] ?? 0;
        $stats['activeUsersPercent'] = $totalUsersValue > 0
            ? (int)round(($stats['totalUsers'] / $totalUsersValue) * 100)
            : 0;

        // Capacidade média ainda é um valor simulado
        $stats['capacityPercent'] = 75;

        $materialStats = $db->fetchAll(
            "SELECT material, COUNT(*) AS count
             FROM materiais_ponto
             GROUP BY material
             ORDER BY count DESC
             LIMIT 5"
        );
        $stats['materialsStats'] = array_map(static function ($row) {
            return [
                'material' => $row['material'],
                'count' => (int)$row['count'],
            ];
        }, $materialStats);

        $recentActivities = $db->fetchAll(
            "SELECT 'Novo ponto cadastrado' AS activity, nome AS description, data_criacao
             FROM pontos_coleta
             ORDER BY data_criacao DESC
             LIMIT 5"
        );
        $stats['recentActivities'] = array_map(static function ($row) {
            return [
                'activity' => $row['activity'],
                'description' => $row['description'],
                'created_at' => $row['data_criacao'],
            ];
        }, $recentActivities);
        
        echo json_encode(['success' => true, 'data' => $stats]);
        
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
