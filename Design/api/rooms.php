<?php
// rooms.php — Room presets storage API endpoints

require_once '../database/db_connect.php';
require_once '../utils/helpers.php';

// check_auth(); 

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'save':
        $id = $_POST['id'] ?? ('r_' . time());
        $name = $_POST['name'] ?? 'New Room';
        $p_roomData = $_POST['room_data'] ?? '{}';
        $userId = $_SESSION['user_id'] ?? 1;
        
        $sql = "INSERT INTO rooms (id, user_id, name, room_data) 
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                name = VALUES(name), 
                room_data = VALUES(room_data)";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("siss", $id, $userId, $name, $p_roomData);

        if ($stmt->execute()) {
            send_json(['success' => true, 'id' => $id]);
        } else {
            send_error('Failed to save room template');
        }
        break;

    case 'load':
        $userId = $_SESSION['user_id'] ?? 1;
        $sql = "SELECT id, name, room_data, updated_at FROM rooms WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $rooms = [];
        while ($row = $result->fetch_assoc()) {
            $row['room'] = json_decode($row['room_data'], true);
            unset($row['room_data']);
            $rooms[] = $row;
        }
        send_json($rooms);
        break;

    case 'delete':
        $id = $_POST['id'] ?? '';
        $sql = "DELETE FROM rooms WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $id);
        if ($stmt->execute()) {
            send_json(['success' => true]);
        } else {
            send_error('Failed to delete room');
        }
        break;

    default:
        send_error('Invalid action');
}
?>
