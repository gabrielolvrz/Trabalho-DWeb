<?php
namespace App\Core;

class Router
{
    private array $routes = [];

    public function get(string $pattern, $handler): void { $this->add('GET', $pattern, $handler); }
    public function post(string $pattern, $handler): void { $this->add('POST', $pattern, $handler); }
    public function put(string $pattern, $handler): void { $this->add('PUT', $pattern, $handler); }
    public function delete(string $pattern, $handler): void { $this->add('DELETE', $pattern, $handler); }

    private function add(string $method, string $pattern, $handler): void
    {
        $regex = $this->toRegex($pattern);
        $this->routes[] = compact('method', 'pattern', 'regex', 'handler');
    }

    private function toRegex(string $pattern): string
    {
        $regex = preg_replace('#\{[^/]+\}#', '([^/]+)', $pattern);
        return '#^' . $regex . '$#';
    }

    public function dispatch(string $method, string $uri): void
    {
        $path = parse_url($uri, PHP_URL_PATH);
        foreach ($this->routes as $route) {
            if ($method !== $route['method']) continue;
            if (preg_match($route['regex'], $path, $matches)) {
                array_shift($matches); 
                $handler = $route['handler'];
                if (is_callable($handler)) {
                    $result = call_user_func_array($handler, $matches);
                    if ($result !== null) echo $result;
                    return;
                }
                if (is_array($handler) && count($handler) === 2) {
                    [$class, $methodName] = $handler;
                    $instance = new $class();
                    $result = call_user_func_array([$instance, $methodName], $matches);
                    if ($result !== null) echo $result;
                    return;
                }
            }
        }
        Response::json(['error' => 'not_found'], 404);
    }
}

