<?php
// profile.php — User Profile API endpoints

require_once '../database/db_connect.php';
require_once '../utils/helpers.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'get':
        // Fetch current user profile
        $user_id = check_auth();
        
        $sql = "SELECT id, name, email, created_at FROM users WHERE id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($user = $result->fetch_assoc()) {
            send_json([
                'success' => true,
                'user' => [
                    'id' => $user['id'],
                    'name' => $user['name'],
                    'email' => $user['email'],
                    'created_at' => $user['created_at']
                ]
            ]);
        } else {
            send_error('User not found', 404);
        }
        break;

    case 'update':
        // Update user profile
        $user_id = check_auth();
        
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        // Validate inputs
        if (empty($name) || empty($email)) {
            send_error('Name and email are required');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            send_error('Invalid email format');
        }

        // Check if new email is already used by another user
        $check_sql = "SELECT id FROM users WHERE email = ? AND id != ?";
        $check_stmt = $conn->prepare($check_sql);
        $check_stmt->bind_param("si", $email, $user_id);
        $check_stmt->execute();
        if ($check_stmt->get_result()->num_rows > 0) {
            send_error('Email is already in use by another account');
        }

        // Build update query
        if (!empty($password)) {
            // Update with new password
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            $sql = "UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("sssi", $name, $email, $hashed_password, $user_id);
        } else {
            // Update without password (keep existing password)
            $sql = "UPDATE users SET name = ?, email = ? WHERE id = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("ssi", $name, $email, $user_id);
        }

        if ($stmt->execute()) {
            // Update session variables
            $_SESSION['user_name'] = $name;
            $_SESSION['user_email'] = $email;

            send_json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => [
                    'name' => $name,
                    'email' => $email
                ]
            ]);
        } else {
            send_error('Failed to update profile: ' . $conn->error);
        }
        break;

    case 'check-email':
        // Check if email is available (for validation during editing)
        $email = $_GET['email'] ?? '';
        $user_id = check_auth();

        if (empty($email)) {
            send_error('Email is required');
        }

        $sql = "SELECT id FROM users WHERE email = ? AND id != ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("si", $email, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        send_json([
            'available' => $result->num_rows === 0
        ]);
        break;

    default:
        send_error('Invalid action');
}
?>
