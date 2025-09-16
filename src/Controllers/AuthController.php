<?php
namespace App\Controllers;

use App\Core\Request;
use App\Core\Response;
use App\Core\Auth;
use App\Core\Storage;

class AuthController
{
    public function register(): void
    {
        $data = Request::json();
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
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
            'id' => (int)$id,
            'name' => $name,
            'email' => $email,
            'password_hash' => password_hash($password, PASSWORD_DEFAULT),
            'type' => 'cooperativa',
            'status' => 'ativo',
            'organization' => (string)($data['organization'] ?? ''),
            'phone' => (string)($data['phone'] ?? ''),
            'address' => (string)($data['address'] ?? ''),
            'createdAt' => date('Y-m-d')
        ];
        $users[] = $user;
        Storage::write('users.json', $users);

        $result = Auth::login($email, $password);
        if (!$result) {
            Response::json(['error' => 'registration_failed'], 500);
        }

        Response::json([
            'token' => $result['token'],
            'user' => Auth::publicUser($result['user'])
        ], 201);
    }
    public function login(): void
    {
        $data = Request::json();
        $email = trim($data['email'] ?? '');
        $password = (string)($data['password'] ?? '');
        if ($email === '' || $password === '') {
            Response::json(['error' => 'missing_credentials'], 400);
        }
        $result = Auth::login($email, $password);
        if (!$result) {
            Response::json(['error' => 'invalid_credentials'], 401);
        }
        Response::json([
            'token' => $result['token'],
            'user' => Auth::publicUser($result['user'])
        ]);
    }

    public function logout(): void
    {
        $token = Auth::bearerToken();
        if ($token) Auth::logout($token);
        Response::json(['success' => true]);
    }
}
