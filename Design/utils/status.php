<?php
header('Content-Type: application/json');
echo json_encode([
    'php_version' => phpversion(),
    'method' => $_SERVER['REQUEST_METHOD'],
    'status' => 'ok'
]);
?>
