<?php
/**
 * Integration Tests: Designs CRUD (Database)
 *
 * Tests the save, load, update, and delete operations for
 * design records, directly against the MySQL test database.
 * Mirrors the logic in Design/api/designs.php.
 *
 * Requires: MySQL test database (hci_design) to be running.
 */

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use Tests\TestDatabaseHelper;
use mysqli;

class DesignsIntegrationTest extends TestCase
{
    private static mysqli $conn;

    private static int $testUserId;

    private static string $sampleRoomData;
    private static string $sampleFurnitureData;

    public static function setUpBeforeClass(): void
    {
        self::$conn = TestDatabaseHelper::getConnection();
        TestDatabaseHelper::applySchema();

        // Clear tables in dependency order
        TestDatabaseHelper::clearTable('designs');
        TestDatabaseHelper::clearTable('users');

        // Insert a user to own the designs
        $name     = 'Designer User';
        $email    = 'designer@example.com';
        $password = password_hash('TestPass!', PASSWORD_DEFAULT);

        $stmt = self::$conn->prepare(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
        );
        $stmt->bind_param('sss', $name, $email, $password);
        $stmt->execute();
        self::$testUserId = self::$conn->insert_id;

        // Reusable sample data
        self::$sampleRoomData      = json_encode([
            'width' => 5, 'length' => 4, 'height' => 2.7,
            'wallColor' => '#FFFFFF', 'floorColor' => '#8B6914',
        ]);
        self::$sampleFurnitureData = json_encode([
            ['id' => 'sofa_01', 'type' => 'sofa', 'x' => 1.0, 'y' => 0, 'z' => 2.5],
        ]);
    }

    public static function tearDownAfterClass(): void
    {
        TestDatabaseHelper::clearTable('designs');
        TestDatabaseHelper::clearTable('users');
    }

    // -------------------------------------------------------
    // Save (INSERT) tests
    // -------------------------------------------------------

    public function testSaveDesignInsertsNewRow(): void
    {
        $id     = 'd_test_001';
        $name   = 'Living Room Design';
        $userId = self::$testUserId;

        $stmt = self::$conn->prepare(
            'INSERT INTO designs (id, user_id, name, room_data, furniture_data)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->bind_param(
            'sisss',
            $id, $userId, $name,
            self::$sampleRoomData,
            self::$sampleFurnitureData
        );
        $result = $stmt->execute();

        $this->assertTrue($result, 'Design INSERT should succeed.');
    }

    public function testSavedDesignCanBeRetrievedById(): void
    {
        $id = 'd_test_001';

        $stmt = self::$conn->prepare(
            'SELECT id, name, room_data, furniture_data FROM designs WHERE id = ?'
        );
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        $this->assertNotNull($row, 'Saved design should be retrievable.');
        $this->assertSame($id, $row['id']);
        $this->assertSame('Living Room Design', $row['name']);
    }

    public function testRoomDataStoredAsValidJson(): void
    {
        $stmt = self::$conn->prepare(
            'SELECT room_data FROM designs WHERE id = ?'
        );
        $id = 'd_test_001';
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $row     = $stmt->get_result()->fetch_assoc();
        $decoded = json_decode($row['room_data'], true);

        $this->assertNotNull($decoded, 'room_data should be valid JSON.');
        $this->assertSame(5, $decoded['width']);
        $this->assertSame(4, $decoded['length']);
    }

    public function testFurnitureDataStoredAsValidJson(): void
    {
        $stmt = self::$conn->prepare(
            'SELECT furniture_data FROM designs WHERE id = ?'
        );
        $id = 'd_test_001';
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $row     = $stmt->get_result()->fetch_assoc();
        $decoded = json_decode($row['furniture_data'], true);

        $this->assertNotNull($decoded, 'furniture_data should be valid JSON.');
        $this->assertCount(1, $decoded);
        $this->assertSame('sofa_01', $decoded[0]['id']);
    }

    // -------------------------------------------------------
    // Upsert (ON DUPLICATE KEY UPDATE) tests
    // -------------------------------------------------------

    public function testSaveDesignWithSameIdUpdatesExistingRow(): void
    {
        $id      = 'd_test_001';  // same ID as above
        $newName = 'Updated Living Room';
        $userId  = self::$testUserId;

        $stmt = self::$conn->prepare(
            'INSERT INTO designs (id, user_id, name, room_data, furniture_data)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             room_data = VALUES(room_data),
             furniture_data = VALUES(furniture_data)'
        );
        $stmt->bind_param(
            'sisss',
            $id, $userId, $newName,
            self::$sampleRoomData,
            self::$sampleFurnitureData
        );
        $result = $stmt->execute();

        $this->assertTrue($result, 'Upsert on existing design should succeed.');

        // Verify the name was updated
        $checkStmt = self::$conn->prepare(
            'SELECT name FROM designs WHERE id = ?'
        );
        $checkStmt->bind_param('s', $id);
        $checkStmt->execute();
        $row = $checkStmt->get_result()->fetch_assoc();

        $this->assertSame($newName, $row['name'], 'Design name should be updated.');
    }

    // -------------------------------------------------------
    // Load (SELECT by user) tests
    // -------------------------------------------------------

    public function testLoadDesignsReturnRowsForCorrectUser(): void
    {
        $userId = self::$testUserId;
        $stmt   = self::$conn->prepare(
            'SELECT id, name FROM designs WHERE user_id = ?'
        );
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $this->assertGreaterThan(0, $result->num_rows, 'Load should return at least one design.');
    }

    public function testLoadDesignsReturnsZeroRowsForOtherUser(): void
    {
        $otherUserId = 99999; // Non-existent user ID
        $stmt        = self::$conn->prepare(
            'SELECT id FROM designs WHERE user_id = ?'
        );
        $stmt->bind_param('i', $otherUserId);
        $stmt->execute();
        $result = $stmt->get_result();

        $this->assertSame(0, $result->num_rows, 'Should return no designs for a non-existent user.');
    }

    // -------------------------------------------------------
    // Delete tests
    // -------------------------------------------------------

    public function testDeleteDesignRemovesRow(): void
    {
        // Insert a new design to delete
        $id     = 'd_test_delete';
        $userId = self::$testUserId;
        $name   = 'Design To Delete';

        $stmt = self::$conn->prepare(
            'INSERT INTO designs (id, user_id, name, room_data, furniture_data)
             VALUES (?, ?, ?, ?, ?)'
        );
        $stmt->bind_param(
            'sisss',
            $id, $userId, $name,
            self::$sampleRoomData,
            self::$sampleFurnitureData
        );
        $stmt->execute();

        // Now delete it
        $delStmt = self::$conn->prepare('DELETE FROM designs WHERE id = ?');
        $delStmt->bind_param('s', $id);
        $result = $delStmt->execute();

        $this->assertTrue($result, 'Delete query should execute successfully.');
        $this->assertSame(1, self::$conn->affected_rows, 'Exactly one row should be deleted.');
    }

    public function testDeletedDesignNoLongerExists(): void
    {
        $id   = 'd_test_delete';
        $stmt = self::$conn->prepare(
            'SELECT id FROM designs WHERE id = ?'
        );
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $result = $stmt->get_result();

        $this->assertSame(0, $result->num_rows, 'Deleted design should no longer exist.');
    }

    public function testDeleteNonExistentDesignAffectsZeroRows(): void
    {
        $nonExistentId = 'does_not_exist_xyz';
        $stmt          = self::$conn->prepare('DELETE FROM designs WHERE id = ?');
        $stmt->bind_param('s', $nonExistentId);
        $stmt->execute();

        $this->assertSame(0, self::$conn->affected_rows, 'No rows should be affected for a non-existent ID.');
    }
}
