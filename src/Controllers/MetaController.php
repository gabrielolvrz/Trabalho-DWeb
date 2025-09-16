<?php
namespace App\Controllers;

use App\Core\Response;
use App\Core\Storage;

class MetaController
{
    public function get(): void
    {
        $pontos = Storage::read('pontos.json');
        $materials = [];
        $statuses = [];
        foreach ($pontos as $p) {
            foreach (($p['materials'] ?? []) as $m) {
                $m = (string)$m;
                if ($m !== '') $materials[$m] = true;
            }
            $s = isset($p['status']) ? (string)$p['status'] : '';
            if ($s !== '') $statuses[$s] = true;
        }
        $materials = array_keys($materials);
        $statuses = array_keys($statuses);
        sort($materials, SORT_STRING | SORT_FLAG_CASE);
        sort($statuses, SORT_STRING | SORT_FLAG_CASE);

        Response::json([
            'materials' => $materials,
            'statuses' => $statuses,
        ]);
    }
}

