<?php
/**
 * Unit Tests: Application File Structure
 *
 * Verifies that all required application files and directories
 * are present in the repository. This is a lightweight structural
 * test that does not require a running server or database.
 */

namespace Tests\Unit;

use PHPUnit\Framework\TestCase;

class FileStructureTest extends TestCase
{
    /**
     * Absolute path to the project root directory.
     */
    private string $root;

    protected function setUp(): void
    {
        // Two levels up from tests/Unit/
        $this->root = dirname(__DIR__, 2);
    }

    // -------------------------------------------------------
    // PHP API files
    // -------------------------------------------------------

    public function testAuthPhpExists(): void
    {
        $this->assertFileExists($this->root . '/Design/api/auth.php');
    }

    public function testDesignsPhpExists(): void
    {
        $this->assertFileExists($this->root . '/Design/api/designs.php');
    }

    public function testRoomsPhpExists(): void
    {
        $this->assertFileExists($this->root . '/Design/api/rooms.php');
    }

    public function testHelpersPhpExists(): void
    {
        $this->assertFileExists($this->root . '/Design/utils/helpers.php');
    }

    public function testDbConnectPhpExists(): void
    {
        $this->assertFileExists($this->root . '/Design/database/db_connect.php');
    }

    // -------------------------------------------------------
    // SQL schema file
    // -------------------------------------------------------

    public function testSchemaSqlExists(): void
    {
        $this->assertFileExists($this->root . '/Design/database/schema.sql');
    }

    public function testSchemaSqlIsNotEmpty(): void
    {
        $content = file_get_contents($this->root . '/Design/database/schema.sql');
        $this->assertNotEmpty($content);
    }

    public function testSchemaSqlContainsUsersTable(): void
    {
        $content = file_get_contents($this->root . '/Design/database/schema.sql');
        $this->assertStringContainsString('CREATE TABLE', $content);
        $this->assertStringContainsString('users', $content);
    }

    public function testSchemaSqlContainsDesignsTable(): void
    {
        $content = file_get_contents($this->root . '/Design/database/schema.sql');
        $this->assertStringContainsString('designs', $content);
    }

    public function testSchemaSqlContainsRoomsTable(): void
    {
        $content = file_get_contents($this->root . '/Design/database/schema.sql');
        $this->assertStringContainsString('rooms', $content);
    }

    // -------------------------------------------------------
    // HTML front-end files
    // -------------------------------------------------------

    public function testIndexHtmlExists(): void
    {
        $this->assertFileExists($this->root . '/Design/index.html');
    }

    public function testEditorHtmlExists(): void
    {
        $this->assertFileExists($this->root . '/Design/editor.html');
    }

    public function testSignupHtmlExists(): void
    {
        $this->assertFileExists($this->root . '/Design/signup.html');
    }

    public function testRoomsHtmlExists(): void
    {
        $this->assertFileExists($this->root . '/Design/rooms.html');
    }

    public function testDesignsHtmlExists(): void
    {
        $this->assertFileExists($this->root . '/Design/designs.html');
    }

    // -------------------------------------------------------
    // JavaScript files
    // -------------------------------------------------------

    public function testAuthJsExists(): void
    {
        $this->assertFileExists($this->root . '/Design/js/auth.js');
    }

    public function testEditorJsExists(): void
    {
        $this->assertFileExists($this->root . '/Design/js/editor.js');
    }

    public function testCanvas2dJsExists(): void
    {
        $this->assertFileExists($this->root . '/Design/js/canvas2d.js');
    }

    public function testCanvas3dJsExists(): void
    {
        $this->assertFileExists($this->root . '/Design/js/canvas3d.js');
    }

    // -------------------------------------------------------
    // PHP API file content checks
    // -------------------------------------------------------

    public function testAuthPhpContainsLoginCase(): void
    {
        $content = file_get_contents($this->root . '/Design/api/auth.php');
        $this->assertStringContainsString("case 'login':", $content);
    }

    public function testAuthPhpContainsRegisterCase(): void
    {
        $content = file_get_contents($this->root . '/Design/api/auth.php');
        $this->assertStringContainsString("case 'register':", $content);
    }

    public function testAuthPhpContainsLogoutCase(): void
    {
        $content = file_get_contents($this->root . '/Design/api/auth.php');
        $this->assertStringContainsString("case 'logout':", $content);
    }

    public function testDesignsPhpContainsSaveCase(): void
    {
        $content = file_get_contents($this->root . '/Design/api/designs.php');
        $this->assertStringContainsString("case 'save':", $content);
    }

    public function testDesignsPhpContainsLoadCase(): void
    {
        $content = file_get_contents($this->root . '/Design/api/designs.php');
        $this->assertStringContainsString("case 'load':", $content);
    }

    public function testDesignsPhpContainsDeleteCase(): void
    {
        $content = file_get_contents($this->root . '/Design/api/designs.php');
        $this->assertStringContainsString("case 'delete':", $content);
    }

    public function testRoomsPhpContainsSaveCase(): void
    {
        $content = file_get_contents($this->root . '/Design/api/rooms.php');
        $this->assertStringContainsString("case 'save':", $content);
    }

    public function testRoomsPhpContainsLoadCase(): void
    {
        $content = file_get_contents($this->root . '/Design/api/rooms.php');
        $this->assertStringContainsString("case 'load':", $content);
    }

    public function testAuthPhpUsesPreparedStatements(): void
    {
        $content = file_get_contents($this->root . '/Design/api/auth.php');
        $this->assertStringContainsString('prepare(', $content);
        $this->assertStringContainsString('bind_param(', $content);
    }

    public function testDesignsPhpUsesPreparedStatements(): void
    {
        $content = file_get_contents($this->root . '/Design/api/designs.php');
        $this->assertStringContainsString('prepare(', $content);
        $this->assertStringContainsString('bind_param(', $content);
    }

    public function testAuthPhpUsesPasswordHash(): void
    {
        $content = file_get_contents($this->root . '/Design/api/auth.php');
        $this->assertStringContainsString('password_hash(', $content);
        $this->assertStringContainsString('password_verify(', $content);
    }
}
