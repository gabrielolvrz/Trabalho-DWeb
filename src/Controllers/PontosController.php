<?php
namespace App\Controllers;

use App\Core\Auth;
use App\Core\Request;
use App\Core\Response;
use App\Core\Storage;

class PontosController
{
    public function list(): void
    {
        $query = $_GET ?? [];
        $materialType = isset($query['materialType']) ? trim((string)$query['materialType']) : '';
        $location = isset($query['location']) ? trim((string)$query['location']) : '';
        $status = isset($query['status']) ? trim((string)$query['status']) : '';

        // materials[]=[...] or materials="a,b"
        $materials = [];
        if (isset($query['materials'])) {
            if (is_array($query['materials'])) {
                $materials = $query['materials'];
            } else {
                $materials = explode(',', (string)$query['materials']);
            }
            $materials = array_values(array_filter(array_unique(array_map(fn($m) => trim((string)$m), $materials)), fn($m) => $m !== ''));
        }
        $materialsMode = strtolower((string)($query['materialsMode'] ?? 'any')) === 'all' ? 'all' : 'any';

        // Sorting and pagination
        $sortBy = in_array(($query['sortBy'] ?? 'name'), ['name','status'], true) ? (string)$query['sortBy'] : 'name';
        $sortDir = strtolower((string)($query['sortDir'] ?? 'asc')) === 'desc' ? 'desc' : 'asc';
        $limit = isset($query['pageSize']) ? (int)$query['pageSize'] : (int)($query['limit'] ?? 100);
        if ($limit <= 0) $limit = 100;
        $offset = (int)($query['offset'] ?? 0);
        if (isset($query['page'])) {
            $page = max(1, (int)$query['page']);
            $offset = ($page - 1) * $limit;
        }

        $pontos = Storage::read('pontos.json');
        $filtered = array_filter($pontos, function ($p) use ($materialType, $location, $status, $materials, $materialsMode) {
            $ok = true;
            if ($materialType !== '') {
                $ok = $ok && in_array($materialType, $p['materials'] ?? [], true);
            }
            if ($location !== '') {
                $ok = $ok && stripos($p['address'] ?? '', $location) !== false;
            }
            if ($status !== '') {
                $ok = $ok && (isset($p['status']) && strcasecmp($p['status'], $status) === 0);
            }
            if (!empty($materials)) {
                $pm = array_map('strval', $p['materials'] ?? []);
                if ($materialsMode === 'all') {
                    foreach ($materials as $m) {
                        if (!in_array($m, $pm, true)) { $ok = false; break; }
                    }
                } else {
                    $ok = $ok && count(array_intersect($materials, $pm)) > 0;
                }
            }
            return $ok;
        });

        // Sort
        usort($filtered, function ($a, $b) use ($sortBy, $sortDir) {
            $av = strtolower((string)($a[$sortBy] ?? ''));
            $bv = strtolower((string)($b[$sortBy] ?? ''));
            $cmp = $av <=> $bv;
            return $sortDir === 'desc' ? -$cmp : $cmp;
        });

        $total = count($filtered);
        $paged = array_slice($filtered, $offset, $limit);

        Response::json([
            'pontos' => array_values($paged),
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'sortBy' => $sortBy,
            'sortDir' => $sortDir,
        ]);
    }

    public function create(): void
    {
        Auth::requireAuth();
        $data = Request::json();
        $name = trim($data['name'] ?? '');
        $materials = $data['materials'] ?? [];
        $address = trim($data['address'] ?? '');
        if ($name === '' || $address === '' || !is_array($materials) || empty($materials)) {
            Response::json(['error' => 'invalid_payload'], 400);
        }
        $pontos = Storage::read('pontos.json');
        $id = Storage::nextId('pontos.json');
        $ponto = [
            'id' => $id,
            'name' => $name,
            'materials' => array_values(array_unique(array_map('strval', $materials))),
            'address' => $address,
            'status' => $data['status'] ?? 'disponivel',
            'responsible' => $data['responsible'] ?? '',
            'phone' => $data['phone'] ?? '',
            'hours' => $data['hours'] ?? ''
        ];
        $pontos[] = $ponto;
        Storage::write('pontos.json', $pontos);
        Response::json(['ponto' => $ponto], 201);
    }

    public function update(string $id): void
    {
        Auth::requireAuth();
        $id = (int)$id;
        $data = Request::json();
        $pontos = Storage::read('pontos.json');
        $found = false;
        foreach ($pontos as &$p) {
            if ($p['id'] === $id) {
                foreach (['name','address','status','responsible','phone','hours'] as $f) {
                    if (isset($data[$f])) $p[$f] = $data[$f];
                }
                if (isset($data['materials']) && is_array($data['materials'])) {
                    $p['materials'] = array_values(array_unique(array_map('strval', $data['materials'])));
                }
                $found = true;
                break;
            }
        }
        if (!$found) Response::json(['error' => 'not_found'], 404);
        Storage::write('pontos.json', $pontos);
        Response::json(['ponto' => $p]);
    }

    public function delete(string $id): void
    {
        Auth::requireAuth();
        $id = (int)$id;
        $pontos = Storage::read('pontos.json');
        $before = count($pontos);
        $pontos = array_values(array_filter($pontos, fn($p) => $p['id'] !== $id));
        if (count($pontos) === $before) Response::json(['error' => 'not_found'], 404);
        Storage::write('pontos.json', $pontos);
        Response::json(['success' => true]);
    }
}
