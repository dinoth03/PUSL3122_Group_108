<?php
// helpers.php — Generic PHP backend helper functions

session_start();

/**
 * Send JSON response and exit
 */
function send_json($data, $status = 200) {
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($data);
    exit;
}

/**
 * Handle errors gracefully
 */
function send_error($message, $status = 400) {
    send_json(['error' => $message], $status);
}

/**
 * Verify authentication
 */
function check_auth() {
    if (!isset($_SESSION['user_id'])) {
        send_error('Unauthorized access', 401);
    }
    return $_SESSION['user_id'];
}
?>
