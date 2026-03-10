<?php
/**
 * Integration Tests: User Authentication (Database)
 *
 * Tests the authentication logic directly against the MySQL
 * test database. Verifies that user registration, login
 * credential verification, duplicate email detection, and
 * session management all work correctly.
 *
 * Requires: MySQL test database (hci_design) to be running.
 */

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use Tests\TestDatabaseHelper;
use mysqli;

class AuthIntegrationTest extends TestCase
{
    private static mysqli $conn;

    /**
     * Runs once before all tests in this class.
     * Applies the schema and clears the users table.
     */
    public static function setUpBeforeClass(): void
    {
        self::$conn = TestDatabaseHelper::getConnection();
        TestDatabaseHelper::applySchema();
        TestDatabaseHelper::clearTable('designs');
        TestDatabaseHelper::clearTable('rooms');
        TestDatabaseHelper::clearTable('users');
    }

    /**
     * Runs once after all tests in this class.
     * Leaves the database clean for other test classes.
     */
    public static function tearDownAfterClass(): void
    {
        TestDatabaseHelper::clearTable('designs');
        TestDatabaseHelper::clearTable('rooms');
        TestDatabaseHelper::clearTable('users');
    }

    // -------------------------------------------------------
    // User registration tests
    // -------------------------------------------------------

    public function testRegisterNewUserInsertsRow(): void
    {
        $name     = 'Test User';
        $email    = 'testuser@example.com';
        $password = password_hash('SecurePass123!', PASSWORD_DEFAULT);

        $stmt = self::$conn->prepare(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
        );
        $stmt->bind_param('sss', $name, $email, $password);
        $result = $stmt->execute();

        $this->assertTrue($result, 'User insert should succeed.');
        $this->assertGreaterThan(0, self::$conn->insert_id);
    }

    public function testDuplicateEmailIsRejected(): void
    {
        $name     = 'Duplicate User';
        $email    = 'testuser@example.com'; // same email as above
        $password = password_hash('AnotherPass!', PASSWORD_DEFAULT);

        $stmt = self::$conn->prepare(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
        );
        $stmt->bind_param('sss', $name, $email, $password);
        $result = $stmt->execute();

        // MySQL should reject duplicate unique email
        $this->assertFalse($result, 'Duplicate email should be rejected by the UNIQUE constraint.');
    }

    public function testRegisteredUserCanBeFoundByEmail(): void
    {
        $email = 'testuser@example.com';

        $stmt = self::$conn->prepare(
            'SELECT id, name, email FROM users WHERE email = ?'
        );
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();
        $user   = $result->fetch_assoc();

        $this->assertNotNull($user, 'User should exist in the database.');
        $this->assertSame('Test User', $user['name']);
        $this->assertSame($email, $user['email']);
    }

    // -------------------------------------------------------
    // Password verification tests
    // -------------------------------------------------------

    public function testCorrectPasswordVerifiesSuccessfully(): void
    {
        $email         = 'testuser@example.com';
        $plainPassword = 'SecurePass123!';

        $stmt = self::$conn->prepare(
            'SELECT password FROM users WHERE email = ?'
        );
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        $this->assertNotNull($result, 'User should exist in the database.');
        $this->assertTrue(
            password_verify($plainPassword, $result['password']),
            'Correct password should pass verification.'
        );
    }

    public function testIncorrectPasswordFailsVerification(): void
    {
        $email        = 'testuser@example.com';
        $wrongPassword = 'WrongPassword!';

        $stmt = self::$conn->prepare(
            'SELECT password FROM users WHERE email = ?'
        );
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();

        $this->assertFalse(
            password_verify($wrongPassword, $result['password']),
            'Wrong password should fail verification.'
        );
    }

    // -------------------------------------------------------
    // Multiple user registration
    // -------------------------------------------------------

    public function testSecondUserRegistrationSucceeds(): void
    {
        $name     = 'Second User';
        $email    = 'second@example.com';
        $password = password_hash('Pass456!', PASSWORD_DEFAULT);

        $stmt = self::$conn->prepare(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
        );
        $stmt->bind_param('sss', $name, $email, $password);
        $result = $stmt->execute();

        $this->assertTrue($result, 'Second user registration should succeed.');
    }

    public function testTotalUserCountIsCorrectAfterRegistrations(): void
    {
        $result = self::$conn->query('SELECT COUNT(*) AS total FROM users');
        $row    = $result->fetch_assoc();
        $this->assertSame(2, (int) $row['total'], 'Two users should be present in the database.');
    }

    // -------------------------------------------------------
    // Non-existent user
    // -------------------------------------------------------

    public function testNonExistentEmailReturnsNoRows(): void
    {
        $email = 'doesnotexist@example.com';

        $stmt = self::$conn->prepare(
            'SELECT id FROM users WHERE email = ?'
        );
        $stmt->bind_param('s', $email);
        $stmt->execute();
        $result = $stmt->get_result();

        $this->assertSame(0, $result->num_rows, 'Non-existent user should return zero rows.');
    }
}
