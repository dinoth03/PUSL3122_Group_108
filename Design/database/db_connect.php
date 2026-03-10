<?php
$servername = getenv('DB_HOST') ?: "127.0.0.1";
$username   = getenv('DB_USER') ?: "root";
$password   = getenv('DB_PASS') !== false ? getenv('DB_PASS') : "";
$dbname     = getenv('DB_NAME') ?: "hci_design";
$port       = getenv('DB_PORT') ?: "3306";

// Create connection - in CI/Production, we connect directly to the DB if possible
try {
    // Suppress warnings and use try-catch for a cleaner failure in tests
    mysqli_report(MYSQLI_REPORT_OFF);
    $conn = new mysqli($servername, $username, $password, $dbname, $port);

    if ($conn->connect_error) {
        // Fallback: try connecting without DB name in case it needs to be created
        $conn = new mysqli($servername, $username, $password, "", $port);
        if ($conn->connect_error) {
            die("Database connection failed: " . $conn->connect_error);
        }
        
        // Try creating/selecting if we are in a dev/test environment
        $conn->query("CREATE DATABASE IF NOT EXISTS $dbname");
        $conn->select_db($dbname);
    }
} catch (Exception $e) {
    die("Database error: " . $e->getMessage());
}

// Return connection for use in other files
return $conn;
