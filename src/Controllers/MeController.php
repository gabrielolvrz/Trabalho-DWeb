<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Storage;

class MeController
{
    public function updateProfile(): void
    {
        $user = Auth::requireAuth();
        $data = Request::json();

        $users = Storage::read('users.json');
        foreach ($users as &$u) {
            if ($u['id'] === $user['id']) {
                $u['name'] = trim($data['name'] ?? $u['name']);
                $u['organization'] = trim($data['organization'] ?? ($u['organization'] ?? ''));
                $u['phone'] = trim($data['phone'] ?? ($u['phone'] ?? ''));
                $u['address'] = trim($data['address'] ?? ($u['address'] ?? ''));
                break;
            }
        }
        Storage::write('users.json', $users);

        Response::json(['user' => Auth::publicUser($users[array_search($user['id'], array_column($users, 'id'))])]);
    }

    public function changePassword(): void
    {
        $user = Auth::requireAuth();
        $data = Request::json();
        $current = (string)($data['currentPassword'] ?? '');
        $new = (string)($data['newPassword'] ?? '');
        if (strlen($new) < 6) {
            Response::json(['error' => 'weak_password'], 400);
        }
        if (!password_verify($current, $user['password_hash'])) {
            Response::json(['error' => 'invalid_current_password'], 400);
        }
        $users = Storage::read('users.json');
        foreach ($users as &$u) {
            if ($u['id'] === $user['id']) {
                $u['password_hash'] = password_hash($new, PASSWORD_DEFAULT);
                break;
            }
        }
        Storage::write('users.json', $users);
        Response::json(['success' => true]);
    }
}

