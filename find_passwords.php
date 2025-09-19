<?php
// Script para descobrir senhas dos usuários
require_once 'src/Core/Database.php';

use App\Core\Database;

try {
    $db = Database::getInstance();
    
    echo "=== DESCOBRINDO SENHAS DOS USUÁRIOS ===\n\n";
    
    // Listar todos os usuários
    $users = $db->fetchAll("SELECT id, nome, email, tipo, status FROM usuarios ORDER BY id");
    
    echo "Usuários cadastrados:\n";
    foreach ($users as $user) {
        echo "- ID: {$user['id']} | Nome: {$user['nome']} | Email: {$user['email']} | Tipo: {$user['tipo']} | Status: {$user['status']}\n";
    }
    
    echo "\n=== TESTANDO SENHAS ===\n\n";
    
    // Lista de senhas comuns para testar
    $commonPasswords = [
        'admin123', 'coop123', 'password', 'admin', '123456', 'teste', 'test',
        'oi', 'oioi', '123', 'senha', 'password123', 'admin1234', 'coop1234',
        'reciclafacil', 'recicla', 'facil', '1234', '0000', '1111', '2222',
        'cooperativa', 'cooperativa123', 'admin@123', 'coop@123'
    ];
    
    foreach ($users as $user) {
        echo "Usuário: {$user['email']} ({$user['nome']})\n";
        
        // Buscar hash da senha
        $userData = $db->fetchOne("SELECT senha FROM usuarios WHERE id = ?", [$user['id']]);
        
        $passwordFound = false;
        foreach ($commonPasswords as $password) {
            if (password_verify($password, $userData['senha'])) {
                echo "  ✅ Senha encontrada: {$password}\n";
                $passwordFound = true;
                break;
            }
        }
        
        if (!$passwordFound) {
            echo "  ❌ Senha não encontrada na lista de senhas comuns\n";
            echo "  Hash da senha: {$userData['senha']}\n";
        }
        echo "\n";
    }
    
    echo "=== INSTRUÇÕES PARA REDEFINIR SENHAS ===\n\n";
    echo "Se você não conseguir descobrir a senha de algum usuário, pode:\n\n";
    echo "1. Redefinir a senha diretamente no banco de dados:\n";
    echo "   UPDATE usuarios SET senha = '" . password_hash('nova_senha', PASSWORD_DEFAULT) . "' WHERE email = 'email_do_usuario';\n\n";
    
    echo "2. Ou usar este script para redefinir uma senha:\n";
    echo "   php reset_password.php email_do_usuario nova_senha\n\n";
    
    echo "3. Senhas padrão recomendadas:\n";
    echo "   - Admin: admin123\n";
    echo "   - Cooperativa: coop123\n";
    echo "   - Usuário comum: user123\n\n";
    
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage() . "\n";
}
?>
