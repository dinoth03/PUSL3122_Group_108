<?php
/**
 * PHPUnit Bootstrap File
 *
 * This file is loaded before any test runs.
 * It sets up the test environment: loads the autoloader,
 * defines test database constants, and starts the session mock.
 */

// Load Composer autoloader
require_once __DIR__ . '/../vendor/autoload.php';

// -------------------------------------------------------
// Database configuration for testing
// Reads from environment variables set in phpunit.xml
// or from the CI/CD pipeline environment.
// -------------------------------------------------------
define('TEST_DB_HOST', getenv('DB_HOST') ?: '127.0.0.1');
define('TEST_DB_NAME', getenv('DB_NAME') ?: 'hci_design');
define('TEST_DB_USER', getenv('DB_USER') ?: 'root');
define('TEST_DB_PASS', getenv('DB_PASS') ?: '');
define('TEST_DB_PORT', (int)(getenv('DB_PORT') ?: 3306));

// -------------------------------------------------------
// Mark that we are in the test environment.
// Used by db_connect.php to avoid overwriting real DB.
// -------------------------------------------------------
define('APP_ENV', 'testing');

// -------------------------------------------------------
// Start a PHP session if one is not already active.
// Required because helpers.php calls session_start().
// -------------------------------------------------------
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
