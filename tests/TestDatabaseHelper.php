<?php
/**
 * TestDatabaseHelper
 *
 * Provides a shared mysqli connection for integration tests.
 * Uses the test database constants defined in bootstrap.php.
 * Also provides utility methods for setting up and tearing
 * down test data between test cases.
 */

namespace Tests;

use mysqli;
use RuntimeException;

class TestDatabaseHelper
{
    private static ?mysqli $connection = null;

    /**
     * Get a single shared mysqli connection to the test database.
     * Creates the connection on first call and reuses it thereafter.
     */
    public static function getConnection(): mysqli
    {
        if (self::$connection === null) {
            $conn = new mysqli(
                TEST_DB_HOST,
                TEST_DB_USER,
                TEST_DB_PASS,
                TEST_DB_NAME,
                TEST_DB_PORT
            );

            if ($conn->connect_error) {
                throw new RuntimeException(
                    'Test database connection failed: ' . $conn->connect_error
                );
            }

            $conn->set_charset('utf8mb4');
            self::$connection = $conn;
        }

        return self::$connection;
    }

    /**
     * Apply the application SQL schema to the test database.
     * Reads Design/database/schema.sql and executes it.
     */
    public static function applySchema(): void
    {
        $conn   = self::getConnection();
        $schema = file_get_contents(__DIR__ . '/../Design/database/schema.sql');

        if ($schema === false) {
            throw new RuntimeException('Could not read Design/database/schema.sql');
        }

        // Execute each statement individually (multi_query can be unreliable)
        $statements = array_filter(
            array_map('trim', explode(';', $schema)),
            fn(string $s) => $s !== '' && !str_starts_with(ltrim($s), '--')
        );

        foreach ($statements as $statement) {
            if (!$conn->query($statement)) {
                // Ignore "table already exists" errors (1050) during test setup
                if ($conn->errno !== 1050) {
                    throw new RuntimeException(
                        'Schema error: ' . $conn->error . ' | Statement: ' . $statement
                    );
                }
            }
        }
    }

    /**
     * Remove all rows from the given table without dropping the table itself.
     * Temporarily disables foreign key checks so dependent tables can be cleared.
     */
    public static function clearTable(string $tableName): void
    {
        $conn = self::getConnection();
        $conn->query('SET FOREIGN_KEY_CHECKS = 0');
        $conn->query('DELETE FROM `' . $tableName . '`');
        $conn->query('SET FOREIGN_KEY_CHECKS = 1');
    }

    /**
     * Close the shared connection. Call in tearDownAfterClass if needed.
     */
    public static function closeConnection(): void
    {
        if (self::$connection !== null) {
            self::$connection->close();
            self::$connection = null;
        }
    }
}
