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
        $stats['activePontos'] = $db->fetchOne(
            "SELECT COUNT(*) as count FROM pontos_coleta WHERE status = 'disponivel'"
        )['count'];
        
        // Contar pontos pendentes/limitados
        $stats['pendingPontos'] = $db->fetchOne(
            "SELECT COUNT(*) as count FROM pontos_coleta WHERE status = 'limitado'"
        )['count'];
        
        // Contar usuários ativos
        $stats['totalUsers'] = $db->fetchOne(
            "SELECT COUNT(*) as count FROM usuarios WHERE status = 'ativo'"
        )['count'];
        
        // Contar tipos de materiais únicos (baseado na coluna materials)
        $materialsCount = $db->fetchAll("SELECT materials FROM pontos_coleta WHERE materials IS NOT NULL");
        $uniqueMaterials = [];
        foreach ($materialsCount as $row) {
            $materials = json_decode($row['materials'], true);
            if ($materials) {
                $uniqueMaterials = array_merge($uniqueMaterials, $materials);
            }
        }
        $stats['materialTypes'] = count(array_unique($uniqueMaterials));
        
        // Percentuais para o status do sistema
        $totalPontos = $db->fetchOne("SELECT COUNT(*) as count FROM pontos_coleta")['count'];
        $stats['activePointsPercent'] = $totalPontos > 0 ? round(($stats['activePontos'] / $totalPontos) * 100) : 0;
        
        $totalUsers = $db->fetchOne("SELECT COUNT(*) as count FROM usuarios")['count'];
        $stats['activeUsersPercent'] = $totalUsers > 0 ? round(($stats['totalUsers'] / $totalUsers) * 100) : 0;
        
        // Capacidade média (simulado - pode ser calculado baseado em dados reais)
        $stats['capacityPercent'] = 75; // Valor simulado
        
        // Materiais mais coletados
        $materialsCount = $db->fetchAll("SELECT materials FROM pontos_coleta WHERE materials IS NOT NULL");
        $materialStats = [];
        foreach ($materialsCount as $row) {
            $materials = json_decode($row['materials'], true);
            if ($materials) {
                foreach ($materials as $material) {
                    $materialStats[$material] = ($materialStats[$material] ?? 0) + 1;
                }
            }
        }
        
        // Ordenar por quantidade e pegar os top 5
        arsort($materialStats);
        $stats['materialsStats'] = array_slice(array_map(function($material, $count) {
            return ['material' => $material, 'count' => $count];
        }, array_keys($materialStats), array_values($materialStats)), 0, 5);
        
        // Atividades recentes (últimos pontos criados)
        $recentActivities = $db->fetchAll(
            "SELECT 'Novo ponto cadastrado' as activity, name as description, created_at
             FROM pontos_coleta 
             ORDER BY created_at DESC 
             LIMIT 5"
        );
        
        $stats['recentActivities'] = $recentActivities;
        
        echo json_encode(['success' => true, 'data' => $stats]);
        
    } else {
        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método não permitido']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
