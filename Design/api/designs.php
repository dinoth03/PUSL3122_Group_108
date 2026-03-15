<?php
// designs.php — Design storage API endpoints

require_once '../database/db_connect.php';
require_once '../utils/helpers.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$userId = $_SESSION['user_id'] ?? 1; // Default to 1 for demo

switch ($action) {

    // ── Save (insert or update) ───────────────────────────────────────────────
    case 'save':
        $id             = $_POST['id']             ?? ('d_' . time());
        $name           = $_POST['name']           ?? 'New Design';
        $p_roomData     = $_POST['room_data']      ?? '{}';
        $p_furnitureData = $_POST['furniture_data'] ?? '[]';

        // Validate JSON
        if (!json_decode($p_roomData) || !json_decode($p_furnitureData)) {
            send_error('Invalid JSON in room_data or furniture_data');
        }

        $sql = "INSERT INTO designs (id, user_id, name, room_data, furniture_data)
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                  name           = VALUES(name),
                  room_data      = VALUES(room_data),
                  furniture_data = VALUES(furniture_data)";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sisss", $id, $userId, $name, $p_roomData, $p_furnitureData);

        if ($stmt->execute()) {
            send_json(['success' => true, 'id' => $id]);
        } else {
            send_error('Failed to save design: ' . $stmt->error);
        }
        break;

    // ── Load all designs for current user ─────────────────────────────────────
    case 'load':
        $sql  = "SELECT id, name, room_data, furniture_data, updated_at
                 FROM designs WHERE user_id = ? ORDER BY updated_at DESC";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $designs = [];
        while ($row = $result->fetch_assoc()) {
            $designs[] = [
                'id'        => $row['id'],
                'name'      => $row['name'],
                'room'      => json_decode($row['room_data'], true),
                'furniture' => json_decode($row['furniture_data'], true),
                'updatedAt' => $row['updated_at'],
            ];
        }
        send_json($designs);
        break;

    // ── Load a single design by ID ────────────────────────────────────────────
    case 'get':
        $id   = $_GET['id'] ?? '';
        $sql  = "SELECT id, name, room_data, furniture_data, updated_at
                 FROM designs WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $id, $userId);
        $stmt->execute();
        $row  = $stmt->get_result()->fetch_assoc();

        if (!$row) {
            send_error('Design not found', 404);
        }
        send_json([
            'id'        => $row['id'],
            'name'      => $row['name'],
            'room'      => json_decode($row['room_data'], true),
            'furniture' => json_decode($row['furniture_data'], true),
            'updatedAt' => $row['updated_at'],
        ]);
        break;

    // ── Delete a design ───────────────────────────────────────────────────────
    case 'delete':
        $id   = $_POST['id'] ?? '';
        $sql  = "DELETE FROM designs WHERE id = ? AND user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $id, $userId);
        if ($stmt->execute()) {
            send_json(['success' => true]);
        } else {
            send_error('Failed to delete design');
        }
        break;

    default:
        send_error('Invalid action');
}
?>
