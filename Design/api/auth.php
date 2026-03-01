<?php
// auth.php — Authentication API endpoints

require_once '../database/db_connect.php';
require_once '../utils/helpers.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';

switch ($action) {
    case 'login':
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        $sql = "SELECT id, name, email, password FROM users WHERE email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($user = $result->fetch_assoc()) {
            if (password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['user_email'] = $user['email'];
                $_SESSION['user_name'] = $user['name'];
                
                send_json([
                    'success' => true,
                    'user' => [
                        'email' => $_SESSION['user_email'],
                        'name' => $_SESSION['user_name']
                    ]
                ]);
            } else {
                send_error('Invalid email or password');
            }
        } else {
            // Fallback for demo users if they haven't been migrated to DB yet
            if (($email === 'group108@gmail.com' && $password === '1234') || 
                ($email === 'admin@designcompiler.com' && $password === 'Admin123!')) {
                
                $_SESSION['user_id'] = ($email === 'group108@gmail.com') ? 1 : 2;
                $_SESSION['user_email'] = $email;
                $_SESSION['user_name'] = ($email === 'group108@gmail.com') ? 'Alex Designer' : 'Sam Admin';
                
                send_json([
                    'success' => true,
                    'user' => [
                        'email' => $_SESSION['user_email'],
                        'name' => $_SESSION['user_name']
                    ]
                ]);
            } else {
                send_error('Invalid email or password');
            }
        }
        break;

    case 'register':
        $name = $_POST['name'] ?? '';
        $email = $_POST['email'] ?? '';
        $password = $_POST['password'] ?? '';

        if (empty($name) || empty($email) || empty($password)) {
            send_error('All fields are required');
        }

        // Check if email already exists
        $check_sql = "SELECT id FROM users WHERE email = ?";
        $check_stmt = $conn->prepare($check_sql);
        $check_stmt->bind_param("s", $email);
        $check_stmt->execute();
        if ($check_stmt->get_result()->num_rows > 0) {
            send_error('Email already registered');
        }

        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $name, $email, $hashed_password);

        if ($stmt->execute()) {
            $new_id = $conn->insert_id;
            $_SESSION['user_id'] = $new_id;
            $_SESSION['user_email'] = $email;
            $_SESSION['user_name'] = $name;

            send_json([
                'success' => true,
                'user' => [
                    'email' => $email,
                    'name' => $name
                ]
            ]);
        } else {
            send_error('Registration failed: ' . $conn->error);
        }
        break;

    case 'logout':
        session_destroy();
        send_json(['success' => true]);
        break;

    case 'check':
        if (isset($_SESSION['user_id'])) {
            send_json([
                'authenticated' => true,
                'user' => [
                    'email' => $_SESSION['user_email'],
                    'name' => $_SESSION['user_name']
                ]
            ]);
        } else {
            send_json(['authenticated' => false]);
        }
        break;

    default:
        send_error('Invalid action');
}
?>
