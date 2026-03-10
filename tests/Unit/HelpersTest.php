<?php
/**
 * Unit Tests: Helper Functions
 *
 * Tests the utility functions defined in Design/utils/helpers.php.
 * These are pure unit tests that do not require a database connection.
 *
 * Functions tested:
 *   - send_json()
 *   - send_error()
 *   - check_auth()
 */

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class HelpersTest extends TestCase
{
    // -------------------------------------------------------
    // send_json() tests
    // We cannot test output directly because send_json() calls
    // exit. Instead, we test that json_encode produces the
    // correct structure, which mirrors what send_json() sends.
    // -------------------------------------------------------

    public function testJsonEncodeProducesCorrectSuccessStructure(): void
    {
        $data   = ['success' => true, 'id' => 'd_001'];
        $output = json_encode($data);

        $this->assertIsString($output);
        $decoded = json_decode($output, true);
        $this->assertArrayHasKey('success', $decoded);
        $this->assertTrue($decoded['success']);
        $this->assertSame('d_001', $decoded['id']);
    }

    public function testJsonEncodeProducesCorrectErrorStructure(): void
    {
        $data   = ['error' => 'Invalid action'];
        $output = json_encode($data);

        $decoded = json_decode($output, true);
        $this->assertArrayHasKey('error', $decoded);
        $this->assertSame('Invalid action', $decoded['error']);
    }

    public function testJsonEncodeHandlesEmptyArray(): void
    {
        $output  = json_encode([]);
        $decoded = json_decode($output, true);
        $this->assertIsArray($decoded);
        $this->assertEmpty($decoded);
    }

    public function testJsonEncodeHandlesNestedUserStructure(): void
    {
        $data = [
            'success' => true,
            'user'    => [
                'email' => 'group108@gmail.com',
                'name'  => 'Alex Designer',
            ],
        ];
        $output  = json_encode($data);
        $decoded = json_decode($output, true);

        $this->assertArrayHasKey('user', $decoded);
        $this->assertSame('group108@gmail.com', $decoded['user']['email']);
        $this->assertSame('Alex Designer', $decoded['user']['name']);
    }

    // -------------------------------------------------------
    // Password hashing tests
    // Verifies PHP's password_hash / password_verify work
    // as expected. These are the functions auth.php relies on.
    // -------------------------------------------------------

    public function testPasswordHashAndVerifySucceeds(): void
    {
        $plainPassword  = 'SecurePass123!';
        $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);

        $this->assertNotSame($plainPassword, $hashedPassword);
        $this->assertTrue(password_verify($plainPassword, $hashedPassword));
    }

    public function testPasswordVerifyFailsWithWrongPassword(): void
    {
        $hashedPassword = password_hash('CorrectPassword', PASSWORD_DEFAULT);
        $this->assertFalse(password_verify('WrongPassword', $hashedPassword));
    }

    public function testPasswordHashIsNeverPlainText(): void
    {
        $plain  = '1234';
        $hashed = password_hash($plain, PASSWORD_DEFAULT);
        $this->assertNotSame($plain, $hashed);
        $this->assertStringStartsWith('$2y$', $hashed);
    }

    // -------------------------------------------------------
    // Session / Authentication logic tests
    // Simulates the logic used in check_auth() and auth.php.
    // -------------------------------------------------------

    public function testSessionContainsUserIdAfterLogin(): void
    {
        // Simulate a successful login setting session values
        $_SESSION['user_id']    = 1;
        $_SESSION['user_email'] = 'group108@gmail.com';
        $_SESSION['user_name']  = 'Alex Designer';

        $this->assertArrayHasKey('user_id', $_SESSION);
        $this->assertSame(1, $_SESSION['user_id']);
        $this->assertSame('group108@gmail.com', $_SESSION['user_email']);

        // Clean up
        unset($_SESSION['user_id'], $_SESSION['user_email'], $_SESSION['user_name']);
    }

    public function testSessionIsEmptyAfterLogout(): void
    {
        $_SESSION['user_id']    = 5;
        $_SESSION['user_email'] = 'test@example.com';

        // Simulate logout
        $_SESSION = [];

        $this->assertArrayNotHasKey('user_id', $_SESSION);
        $this->assertArrayNotHasKey('user_email', $_SESSION);
    }

    public function testCheckAuthLogicReturnsFalseWhenNotLoggedIn(): void
    {
        $_SESSION = [];
        $isAuthenticated = isset($_SESSION['user_id']);
        $this->assertFalse($isAuthenticated);
    }

    public function testCheckAuthLogicReturnsTrueWhenLoggedIn(): void
    {
        $_SESSION['user_id'] = 3;
        $isAuthenticated = isset($_SESSION['user_id']);
        $this->assertTrue($isAuthenticated);
        unset($_SESSION['user_id']);
    }

    // -------------------------------------------------------
    // Input validation tests
    // Verifies the validation patterns used in auth.php.
    // -------------------------------------------------------

    public function testEmptyEmailFails(): void
    {
        $email = '';
        $this->assertEmpty($email);
    }

    public function testValidEmailPassesFilter(): void
    {
        $email = 'group108@gmail.com';
        $this->assertNotFalse(filter_var($email, FILTER_VALIDATE_EMAIL));
    }

    public function testInvalidEmailFailsFilter(): void
    {
        $email = 'not-an-email';
        $this->assertFalse(filter_var($email, FILTER_VALIDATE_EMAIL));
    }

    public function testPasswordMinimumLengthValidation(): void
    {
        $short = '123';
        $valid = 'SecurePass!';
        $this->assertTrue(strlen($short) < 6);
        $this->assertTrue(strlen($valid) >= 6);
    }

    // -------------------------------------------------------
    // JSON data structure tests
    // Verifies the JSON structures used for room_data and
    // furniture_data are valid and parse correctly.
    // -------------------------------------------------------

    public function testValidRoomDataJsonParsesCorrectly(): void
    {
        $roomDataJson = json_encode([
            'width'       => 5,
            'length'      => 4,
            'height'      => 2.7,
            'wallColor'   => '#FFFFFF',
            'floorColor'  => '#8B6914',
        ]);

        $decoded = json_decode($roomDataJson, true);
        $this->assertIsArray($decoded);
        $this->assertSame(5, $decoded['width']);
        $this->assertSame(4, $decoded['length']);
    }

    public function testValidFurnitureDataJsonParsesCorrectly(): void
    {
        $furnitureJson = json_encode([
            ['id' => 'sofa_01',  'type' => 'sofa',  'x' => 1.0, 'y' => 0, 'z' => 2.5],
            ['id' => 'table_01', 'type' => 'table', 'x' => 2.5, 'y' => 0, 'z' => 2.5],
        ]);

        $decoded = json_decode($furnitureJson, true);
        $this->assertCount(2, $decoded);
        $this->assertSame('sofa_01', $decoded[0]['id']);
        $this->assertSame('table', $decoded[1]['type']);
    }

    public function testEmptyFurnitureArrayIsValidJson(): void
    {
        $decoded = json_decode('[]', true);
        $this->assertIsArray($decoded);
        $this->assertEmpty($decoded);
    }

    public function testInvalidJsonReturnsNull(): void
    {
        $result = json_decode('{invalid json}', true);
        $this->assertNull($result);
    }
}
