<?php
/**
 * Integration Tests: Rooms CRUD (Database)
 *
 * Tests the save, load, update, and delete operations for
 * room preset records, directly against the MySQL test database.
 * Mirrors the logic in Design/api/rooms.php.
 *
 * Requires: MySQL test database (hci_design) to be running.
 */

namespace Tests\Integration;

use PHPUnit\Framework\TestCase;
use Tests\TestDatabaseHelper;
use mysqli;

class RoomsIntegrationTest extends TestCase
{
    private static mysqli $conn;

    private static int $testUserId;

    private static string $sampleRoomData;

    public static function setUpBeforeClass(): void
    {
        self::$conn = TestDatabaseHelper::getConnection();
        TestDatabaseHelper::applySchema();

        // Clear tables in dependency order
        TestDatabaseHelper::clearTable('designs');
        TestDatabaseHelper::clearTable('rooms');
        TestDatabaseHelper::clearTable('users');

        // Insert a test user to own the rooms
        $name     = 'Room Tester';
        $email    = 'roomtester@example.com';
        $password = password_hash('RoomPass!', PASSWORD_DEFAULT);

        $stmt = self::$conn->prepare(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)'
        );
        $stmt->bind_param('sss', $name, $email, $password);
        $stmt->execute();
        self::$testUserId = self::$conn->insert_id;

        // Reusable sample data
        self::$sampleRoomData = json_encode([
            'width'  => 6,
            'length' => 5,
            'height' => 3.0,
            'wallColor'  => '#F5F5F5',
            'floorColor' => '#8B6914',
        ]);
    }

    public static function tearDownAfterClass(): void
    {
        TestDatabaseHelper::clearTable('designs');
        TestDatabaseHelper::clearTable('rooms');
        TestDatabaseHelper::clearTable('users');
    }

    // -------------------------------------------------------
    // Save (INSERT) tests
    // -------------------------------------------------------

    public function testSaveRoomTemplateInsertsNewRow(): void
    {
        $id     = 'r_test_001';
        $name   = 'Bedroom Preset';
        $userId = self::$testUserId;

        $stmt = self::$conn->prepare(
            'INSERT INTO rooms (id, user_id, name, room_data)
             VALUES (?, ?, ?, ?)'
        );
        $stmt->bind_param('siss', $id, $userId, $name, self::$sampleRoomData);
        $result = $stmt->execute();

        $this->assertTrue($result, 'Room INSERT should succeed.');
    }

    public function testSavedRoomCanBeRetrievedById(): void
    {
        $id = 'r_test_001';

        $stmt = self::$conn->prepare(
            'SELECT id, name, room_data FROM rooms WHERE id = ?'
        );
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();

        $this->assertNotNull($row, 'Saved room should be retrievable.');
        $this->assertSame($id, $row['id']);
        $this->assertSame('Bedroom Preset', $row['name']);
    }

    public function testRoomDataIsStoredAsValidJson(): void
    {
        $id = 'r_test_001';

        $stmt = self::$conn->prepare('SELECT room_data FROM rooms WHERE id = ?');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $row     = $stmt->get_result()->fetch_assoc();
        $decoded = json_decode($row['room_data'], true);

        $this->assertNotNull($decoded, 'room_data should be valid JSON.');
        $this->assertSame(6, $decoded['width']);
        $this->assertSame(5, $decoded['length']);
        $this->assertEquals(3.0, $decoded['height']);
    }

    // -------------------------------------------------------
    // Upsert (ON DUPLICATE KEY UPDATE) tests
    // -------------------------------------------------------

    public function testSaveRoomWithSameIdUpdatesExistingRow(): void
    {
        $id      = 'r_test_001';  // same ID as above
        $newName = 'Updated Bedroom';
        $userId  = self::$testUserId;

        $stmt = self::$conn->prepare(
            'INSERT INTO rooms (id, user_id, name, room_data)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
             name = VALUES(name),
             room_data = VALUES(room_data)'
        );
        $stmt->bind_param('siss', $id, $userId, $newName, self::$sampleRoomData);
        $result = $stmt->execute();

        $this->assertTrue($result, 'Upsert on existing room should succeed.');

        $checkStmt = self::$conn->prepare('SELECT name FROM rooms WHERE id = ?');
        $checkStmt->bind_param('s', $id);
        $checkStmt->execute();
        $row = $checkStmt->get_result()->fetch_assoc();

        $this->assertSame($newName, $row['name'], 'Room name should be updated after upsert.');
    }

    // -------------------------------------------------------
    // Load (SELECT by user) tests
    // -------------------------------------------------------

    public function testLoadRoomsReturnsRowsForCorrectUser(): void
    {
        $userId = self::$testUserId;
        $stmt   = self::$conn->prepare(
            'SELECT id, name FROM rooms WHERE user_id = ?'
        );
        $stmt->bind_param('i', $userId);
        $stmt->execute();
        $result = $stmt->get_result();

        $this->assertGreaterThan(0, $result->num_rows, 'Load should return at least one room preset.');
    }

    public function testLoadRoomsReturnsZeroForOtherUser(): void
    {
        $otherUserId = 88888;
        $stmt        = self::$conn->prepare(
            'SELECT id FROM rooms WHERE user_id = ?'
        );
        $stmt->bind_param('i', $otherUserId);
        $stmt->execute();
        $result = $stmt->get_result();

        $this->assertSame(0, $result->num_rows, 'Non-existent user should have zero room presets.');
    }

    // -------------------------------------------------------
    // Multiple room presets
    // -------------------------------------------------------

    public function testMultipleRoomPresetsCanBeSavedForSameUser(): void
    {
        $userId = self::$testUserId;
        $rooms  = [
            ['r_test_002', 'Kitchen Preset'],
            ['r_test_003', 'Office Preset'],
        ];

        foreach ($rooms as [$id, $name]) {
            $stmt = self::$conn->prepare(
                'INSERT INTO rooms (id, user_id, name, room_data) VALUES (?, ?, ?, ?)'
            );
            $stmt->bind_param('siss', $id, $userId, $name, self::$sampleRoomData);
            $result = $stmt->execute();
            $this->assertTrue($result, "Insert for room '$name' should succeed.");
        }

        $countStmt = self::$conn->prepare(
            'SELECT COUNT(*) AS total FROM rooms WHERE user_id = ?'
        );
        $countStmt->bind_param('i', $userId);
        $countStmt->execute();
        $row = $countStmt->get_result()->fetch_assoc();

        $this->assertGreaterThanOrEqual(3, (int) $row['total'], 'At least 3 rooms should exist for this user.');
    }

    // -------------------------------------------------------
    // Delete tests
    // -------------------------------------------------------

    public function testDeleteRoomRemovesRow(): void
    {
        $id     = 'r_test_todelete';
        $userId = self::$testUserId;
        $name   = 'Room To Delete';

        $stmt = self::$conn->prepare(
            'INSERT INTO rooms (id, user_id, name, room_data) VALUES (?, ?, ?, ?)'
        );
        $stmt->bind_param('siss', $id, $userId, $name, self::$sampleRoomData);
        $stmt->execute();

        $delStmt = self::$conn->prepare('DELETE FROM rooms WHERE id = ?');
        $delStmt->bind_param('s', $id);
        $result = $delStmt->execute();

        $this->assertTrue($result, 'Delete should execute without errors.');
        $this->assertSame(1, self::$conn->affected_rows, 'One row should be deleted.');
    }

    public function testDeletedRoomNoLongerExists(): void
    {
        $id   = 'r_test_todelete';
        $stmt = self::$conn->prepare('SELECT id FROM rooms WHERE id = ?');
        $stmt->bind_param('s', $id);
        $stmt->execute();
        $result = $stmt->get_result();

        $this->assertSame(0, $result->num_rows, 'Deleted room should not exist in the database.');
    }
}
