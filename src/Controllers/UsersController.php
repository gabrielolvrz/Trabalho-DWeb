<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Storage;

class UsersController
{
    public function list(): void
    {
        Auth::requireAdmin();
        $users = Storage::read('users.json');
        $public = array_map(fn($u) => Auth::publicUser($u), $users);
        Response::json(['users' => $public]);
    }

    public function create(): void
    {
        Auth::requireAdmin();
        $data = Request::json();
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $type = $data['type'] ?? 'cooperativa';
        $password = (string)($data['password'] ?? '');
        if ($name === '' || $email === '' || strlen($password) < 6) {
            Response::json(['error' => 'invalid_payload'], 400);
        }
        $users = Storage::read('users.json');
        foreach ($users as $u) {
            if (strcasecmp($u['email'], $email) === 0) {
                Response::json(['error' => 'email_in_use'], 409);
            }
        }
        $id = Storage::nextId('users.json');
        $user = [
            'id' => $id,
            'name' => $name,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'type' => $type,
            'status' => $data['status'] ?? 'ativo',
            'organization' => $data['organization'] ?? '',
            'phone' => $data['phone'] ?? '',
            'address' => $data['address'] ?? '',
            'createdAt' => date('Y-m-d')
        ];
        $users[] = $user;
        Storage::write('users.json', $users);
        Response::json(['user' => Auth::publicUser($user)], 201);
    }

    public function update(string $id): void
    {
        Auth::requireAdmin();
        $data = Request::json();
        $id = (int)$id;
        $users = Storage::read('users.json');
        $found = false;
        foreach ($users as &$u) {
            if ($u['id'] === $id) {
                $u['name'] = $data['name'] ?? $u['name'];
                $u['type'] = $data['type'] ?? $u['type'];
                $u['status'] = $data['status'] ?? $u['status'];
                $u['organization'] = $data['organization'] ?? $u['organization'];
                $u['phone'] = $data['phone'] ?? $u['phone'];
                $u['address'] = $data['address'] ?? $u['address'];
                if (!empty($data['password'])) {
                    $u['password_hash'] = password_hash((string)$data['password'], PASSWORD_DEFAULT);
                }
                $found = true;
                break;
            }
        }
        if (!$found) Response::json(['error' => 'not_found'], 404);
        Storage::write('users.json', $users);
        Response::json(['user' => Auth::publicUser($u)]);
    }

    public function delete(string $id): void
    {
        Auth::requireAdmin();
        $id = (int)$id;
        $users = Storage::read('users.json');
        $before = count($users);
        $users = array_values(array_filter($users, fn($u) => $u['id'] !== $id));
        if (count($users) === $before) Response::json(['error' => 'not_found'], 404);
        Storage::write('users.json', $users);
        Response::json(['success' => true]);
    }
}

