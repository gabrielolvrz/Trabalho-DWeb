<?php
namespace App\Core;

class Auth
{
    public static function login(string $email, string $password): ?array
    {
        $users = Storage::read('users.json');
        foreach ($users as $user) {
            if (strcasecmp($user['email'], $email) === 0 && password_verify($password, $user['password_hash'])) {
                if (($user['status'] ?? 'ativo') !== 'ativo') {
                    return null;
                }
                $token = bin2hex(random_bytes(24));
                $sessions = Storage::read('sessions.json');
                $sessions[] = [
                    'token' => $token,
                    'user_id' => $user['id'],
                    'createdAt' => date('c')
                ];
                Storage::write('sessions.json', $sessions);
                return ['token' => $token, 'user' => $user];
            }
        }
        return null;
    }

    public static function logout(string $token): void
    {
        $sessions = Storage::read('sessions.json');
        $sessions = array_values(array_filter($sessions, fn($s) => $s['token'] !== $token));
        Storage::write('sessions.json', $sessions);
    }

    public static function userFromToken(?string $token): ?array
    {
        if (!$token) return null;
        $sessions = Storage::read('sessions.json');
        $session = null;
        foreach ($sessions as $s) {
            if ($s['token'] === $token) { $session = $s; break; }
        }
        if (!$session) return null;
        $users = Storage::read('users.json');
        foreach ($users as $user) {
            if ($user['id'] === $session['user_id']) return $user;
        }
        return null;
    }

    public static function bearerToken(): ?string
    {
        $h = Request::header('Authorization');
        if (!$h) return null;
        if (stripos($h, 'Bearer ') === 0) return trim(substr($h, 7));
        return null;
    }

    public static function requireAuth(): array
    {
        $token = self::bearerToken();
        $user = self::userFromToken($token);
        if (!$user) Response::json(['error' => 'unauthorized'], 401);
        return $user;
    }

    public static function requireAdmin(): array
    {
        $user = self::requireAuth();
        if (($user['type'] ?? '') !== 'admin') {
            Response::json(['error' => 'forbidden'], 403);
        }
        return $user;
    }

    public static function publicUser(array $user): array
    {
        $copy = $user;
        unset($copy['password_hash']);
        return $copy;
    }
}

