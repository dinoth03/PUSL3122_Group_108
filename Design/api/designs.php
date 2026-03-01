<?php
// designs.php — Design storage API endpoints

require_once '../database/db_connect.php';
require_once '../utils/helpers.php';

// check_auth(); // For authentication

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'save':
        $id = $_POST['id'] ?? ('d_' . time()); // Provide default ID if not provided
        $name = $_POST['name'] ?? 'New Design';
        $p_roomData = $_POST['room_data'] ?? '{}';
        $p_furnitureData = $_POST['furniture_data'] ?? '[]';
        $userId = $_SESSION['user_id'] ?? 1; // Default to user 1 for demo purposes
        
        $sql = "INSERT INTO designs (id, user_id, name, room_data, furniture_data) 
                VALUES (?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                name = VALUES(name), 
                room_data = VALUES(room_data), 
                furniture_data = VALUES(furniture_data)";

        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sisss", $id, $userId, $name, $p_roomData, $p_furnitureData);

        if ($stmt->execute()) {
            send_json(['success' => true, 'id' => $id]);
        } else {
            send_error('Failed to save design: ' . $stmt->error);
        }
        break;

    case 'load':
        $userId = $_SESSION['user_id'] ?? 1; // Default to user 1 for demo purposes
        $sql = "SELECT id, name, room_data, furniture_data, updated_at FROM designs WHERE user_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $designs = [];
        while ($row = $result->fetch_assoc()) {
            $row['room'] = json_decode($row['room_data'], true);
            $row['furniture'] = json_decode($row['furniture_data'], true);
            unset($row['room_data']);
            unset($row['furniture_data']);
            $designs[] = $row;
        }
        send_json($designs);
        break;

    case 'delete':
        $id = $_POST['id'] ?? '';
        $sql = "DELETE FROM designs WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $id);
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
