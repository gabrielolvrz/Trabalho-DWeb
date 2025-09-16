<?php
declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define('APP_ROOT', dirname(__DIR__));

spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    if (strncmp($class, $prefix, strlen($prefix)) !== 0) {
        return;
    }
    $rel = substr($class, strlen($prefix));
    $file = APP_ROOT . '/src/' . str_replace('\\', '/', $rel) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});

use App\Core\Router;
use App\Core\Response;
use App\Core\Storage;
use App\Core\Auth;
use App\Controllers\AuthController;
use App\Controllers\MeController;
use App\Controllers\UsersController;
use App\Controllers\PontosController;

Storage::bootstrap(APP_ROOT . '/data');

$router = new Router();

$router->get('/api/health', function () {
    return Response::json(['status' => 'ok']);
});

$router->post('/api/login', [AuthController::class, 'login']);
$router->post('/api/logout', [AuthController::class, 'logout']);

$router->get('/api/me', function () {
    $user = Auth::requireAuth();
    return Response::json(['user' => Auth::publicUser($user)]);
});

$router->put('/api/me', [MeController::class, 'updateProfile']);
$router->put('/api/me/password', [MeController::class, 'changePassword']);

// Pontos 
$router->get('/api/pontos', [PontosController::class, 'list']);
$router->post('/api/pontos', [PontosController::class, 'create']);
$router->put('/api/pontos/{id}', [PontosController::class, 'update']);
$router->delete('/api/pontos/{id}', [PontosController::class, 'delete']);

// Cadastro público e meta
$router->post('/api/register', [\App\Controllers\AuthController::class, 'register']);
$router->get('/api/meta', [\App\Controllers\MetaController::class, 'get']);

// Usuários (somente admin)
$router->get('/api/users', [UsersController::class, 'list']);
$router->post('/api/users', [UsersController::class, 'create']);
$router->put('/api/users/{id}', [UsersController::class, 'update']);
$router->delete('/api/users/{id}', [UsersController::class, 'delete']);

// Dispara roteamento
try {
    $router->dispatch($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);
} catch (Throwable $e) {
    Response::json([
        'error' => 'internal_error',
        'message' => $e->getMessage(),
    ], 500);
}
