<?php
// furniture.php — Furniture catalog API endpoints

require_once '../database/db_connect.php';
require_once '../utils/helpers.php';

$action = $_GET['action'] ?? 'list';

switch ($action) {

    // ── GET all active furniture items (optionally filtered by category) ──────
    case 'list':
        $category = $_GET['category'] ?? '';
        if ($category) {
            $sql  = "SELECT id, name, category, icon, default_color, width, depth, height
                     FROM furniture_catalog WHERE is_active = 1 AND category = ?
                     ORDER BY category, name";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("s", $category);
        } else {
            $sql  = "SELECT id, name, category, icon, default_color, width, depth, height
                     FROM furniture_catalog WHERE is_active = 1
                     ORDER BY FIELD(category,'Sofa','Chair','Bed','Table','Cabinet','Desk','Decor','Window & Door','Bedroom','Lighting'), name";
            $stmt = $conn->prepare($sql);
        }
        $stmt->execute();
        $result = $stmt->get_result();

        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = [
                'id'           => $row['id'],
                'name'         => $row['name'],
                'category'     => $row['category'],
                'icon'         => $row['icon'],
                'defaultColor' => $row['default_color'],
                'width'        => (float)$row['width'],
                'depth'        => (float)$row['depth'],
                'height'       => (float)$row['height'],
            ];
        }
        send_json($items);
        break;

    // ── GET categories list ────────────────────────────────────────────────────
    case 'categories':
        $sql  = "SELECT DISTINCT category FROM furniture_catalog WHERE is_active = 1
                 ORDER BY FIELD(category,'Sofa','Chair','Bed','Table','Cabinet','Desk','Decor','Window & Door','Bedroom','Lighting')";
        $stmt = $conn->prepare($sql);
        $stmt->execute();
        $result = $stmt->get_result();
        $cats = [];
        while ($row = $result->fetch_assoc()) {
            $cats[] = $row['category'];
        }
        send_json($cats);
        break;

    // ── ADMIN: Add a new furniture item ───────────────────────────────────────
    case 'add':
        $id            = $_POST['id']            ?? '';
        $name          = $_POST['name']          ?? '';
        $category      = $_POST['category']      ?? '';
        $icon          = $_POST['icon']          ?? '🪑';
        $default_color = $_POST['default_color'] ?? '#888888';
        $width         = (float)($_POST['width']  ?? 0);
        $depth         = (float)($_POST['depth']  ?? 0);
        $height        = (float)($_POST['height'] ?? 0);

        if (!$id || !$name || !$category || $width <= 0 || $depth <= 0 || $height <= 0) {
            send_error('Missing or invalid fields');
        }

        $sql  = "INSERT INTO furniture_catalog (id, name, category, icon, default_color, width, depth, height)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                   name = VALUES(name), category = VALUES(category), icon = VALUES(icon),
                   default_color = VALUES(default_color), width = VALUES(width),
                   depth = VALUES(depth), height = VALUES(height), is_active = 1";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sssssddd", $id, $name, $category, $icon, $default_color, $width, $depth, $height);

        if ($stmt->execute()) {
            send_json(['success' => true, 'id' => $id]);
        } else {
            send_error('Failed to add furniture item: ' . $stmt->error);
        }
        break;

    // ── ADMIN: Soft-delete (deactivate) a furniture item ──────────────────────
    case 'delete':
        $id   = $_POST['id'] ?? '';
        $sql  = "UPDATE furniture_catalog SET is_active = 0 WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $id);
        if ($stmt->execute()) {
            send_json(['success' => true]);
        } else {
            send_error('Failed to delete item');
        }
        break;

    default:
        send_error('Invalid action');
}
?>
