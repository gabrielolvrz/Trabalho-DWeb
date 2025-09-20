<?php
// Script para redefinir senha de usuário
require_once 'src/Core/Database.php';

use App\Core\Database;

if ($argc < 3) {
    echo "Uso: php reset_password.php <email> <nova_senha>\n";
    echo "Exemplo: php reset_password.php admin@reciclafacil.com admin123\n";
    exit(1);
}

$email = $argv[1];
$newPassword = $argv[2];

try {
    $db = Database::getInstance();
    
    // Verificar se o usuário existe
    $user = $db->fetchOne("SELECT id, nome, email FROM usuarios WHERE email = ?", [$email]);
    
    if (!$user) {
        echo "❌ Usuário com email '{$email}' não encontrado.\n";
        exit(1);
    }
    
    // Gerar hash da nova senha
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    
    // Atualizar senha no banco
    $db->update('usuarios', ['senha' => $hashedPassword], 'email = ?', [$email]);
    
    echo "✅ Senha redefinida com sucesso!\n";
    echo "Usuário: {$user['nome']} ({$user['email']})\n";
    echo "Nova senha: {$newPassword}\n";
    
} catch (Exception $e) {
    echo "❌ Erro: " . $e->getMessage() . "\n";
    exit(1);
}
?>
