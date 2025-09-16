<?php
namespace App\Core;

class Storage
{
    private static string $basePath;

    public static function bootstrap(string $basePath): void
    {
        self::$basePath = $basePath;
        if (!is_dir($basePath)) {
            mkdir($basePath, 0777, true);
        }
        if (!file_exists(self::path('users.json'))) {
            $now = date('Y-m-d');
            $users = [
                [
                    'id' => 1,
                    'name' => 'Administrador',
                    'email' => 'admin@reciclafacil.com',
                    'password_hash' => password_hash('admin123', PASSWORD_DEFAULT),
                    'type' => 'admin',
                    'status' => 'ativo',
                    'organization' => 'ReciclaFácil',
                    'phone' => '',
                    'address' => '',
                    'createdAt' => $now
                ],
                [
                    'id' => 2,
                    'name' => 'João Silva',
                    'email' => 'cooperativa@exemplo.com',
                    'password_hash' => password_hash('coop123', PASSWORD_DEFAULT),
                    'type' => 'cooperativa',
                    'status' => 'ativo',
                    'organization' => 'Cooperativa Verde Ltda.',
                    'phone' => '(11) 99999-9999',
                    'address' => 'Rua das Flores, 123 - Centro - São Paulo/SP',
                    'createdAt' => $now
                ],
            ];
            self::write('users.json', $users);
        }
        // Seed pontos
        if (!file_exists(self::path('pontos.json'))) {
            $pontos = [
                [
                    'id' => 1,
                    'name' => 'EcoPonto Centro',
                    'materials' => ['papel','plastico','vidro'],
                    'address' => 'Rua das Flores, 123 - Centro - São Paulo/SP',
                    'status' => 'disponivel',
                    'responsible' => 'Cooperativa Verde',
                    'phone' => '(11) 99999-9999',
                    'hours' => 'Seg-Sex: 8h-17h'
                ],
                [
                    'id' => 2,
                    'name' => 'Cooperativa Sustentável',
                    'materials' => ['metal','eletronicos'],
                    'address' => 'Av. Sustentável, 456 - Bairro Novo - São Paulo/SP',
                    'status' => 'limitado',
                    'responsible' => 'João Silva',
                    'phone' => '(11) 88888-8888',
                    'hours' => 'Seg-Sáb: 7h-16h'
                ],
                [
                    'id' => 3,
                    'name' => 'Recicla Mais',
                    'materials' => ['papel','plastico','metal'],
                    'address' => 'Rua Ecológica, 789 - Vila Verde - São Paulo/SP',
                    'status' => 'disponivel',
                    'responsible' => 'Maria Santos',
                    'phone' => '(11) 77777-7777',
                    'hours' => 'Ter-Dom: 9h-18h'
                ],
            ];
            self::write('pontos.json', $pontos);
        }
        if (!file_exists(self::path('sessions.json'))) {
            self::write('sessions.json', []);
        }
    }

    public static function path(string $file): string
    {
        return self::$basePath . '/' . $file;
    }

    public static function read(string $file): array
    {
        $path = self::path($file);
        if (!file_exists($path)) return [];
        $json = file_get_contents($path);
        $data = json_decode($json, true);
        return is_array($data) ? $data : [];
    }

    public static function write(string $file, array $data): void
    {
        $path = self::path($file);
        file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    }

    public static function nextId(string $file): int
    {
        $list = self::read($file);
        $max = 0;
        foreach ($list as $item) {
            if (($item['id'] ?? 0) > $max) $max = $item['id'];
        }
        return $max + 1;
    }
}

