# Testing Plan
## PUSL3122 Group 108 — Design Compiler Application
**Document Version:** 1.0
**Date:** March 2026
**Prepared by:** Group 108

---

## 1. Introduction

### 1.1 Purpose
This document defines the complete testing plan for the Design Compiler web application developed by PUSL3122 Group 108. The plan describes the testing strategy, tools, test types, test cases, acceptance criteria, and automation pipeline used to ensure the application meets commercial-quality standards.

### 1.2 Application Overview
The Design Compiler is a browser-based 2D/3D interior room design tool. Users can register, log in, design rooms by placing furniture items, save their designs, and manage room presets.

| Component        | Technology              |
|------------------|-------------------------|
| Frontend         | HTML5, Vanilla JavaScript, CSS3 |
| Backend API      | PHP 8.2 (procedural, REST-style) |
| Database         | MySQL 8.0               |
| Web Server       | Apache (XAMPP / cPanel) |
| Version Control  | Git / GitHub            |
| CI/CD            | GitHub Actions          |

### 1.3 Scope
This plan covers:
- Unit testing of PHP utility functions and JavaScript logic
- Integration testing of the PHP API against a live MySQL database
- Security testing for injection vulnerabilities and authentication bypass
- Frontend structural and syntax validation
- CI/CD pipeline automation for all the above

---

## 2. Testing Objectives

1. Verify that all individual functions and modules behave correctly in isolation (unit tests).
2. Verify that the PHP API and MySQL database interact correctly end-to-end (integration tests).
3. Verify that the application is safe from common web vulnerabilities (security tests).
4. Verify that all frontend HTML and JavaScript files are syntactically valid (frontend validation).
5. Ensure all tests run automatically on every code push via the CI/CD pipeline.
6. Achieve a minimum of 80% code coverage on the PHP backend API files.

---

## 3. Testing Strategy

### 3.1 Types of Testing

| Test Type             | Tool / Method                  | Automated | Environment       |
|-----------------------|--------------------------------|-----------|-------------------|
| Unit Testing          | PHPUnit 11                     | Yes       | GitHub Actions    |
| Integration Testing   | PHPUnit 11 + MySQL 8.0 service | Yes       | GitHub Actions    |
| Security Testing      | Custom bash scripts (CI/CD)    | Yes       | GitHub Actions    |
| Frontend Validation   | Node.js syntax check, html-validate | Yes  | GitHub Actions    |
| Manual Exploratory    | Browser-based manual testing   | No        | Local (XAMPP)     |
| Code Coverage         | Xdebug + PHPUnit               | Yes       | GitHub Actions    |

### 3.2 Test Environment

**Automated (CI/CD):**
- OS: Ubuntu Latest (GitHub Actions runner)
- PHP: 8.2 with Xdebug extension
- MySQL: 8.0 (Docker service container)
- Database: `hci_design` (isolated test database in CI)
- Node.js: 20.x

**Local (Manual):**
- OS: Windows
- Server: XAMPP (Apache + PHP 8.2 + MySQL)
- Browser: Google Chrome (latest), Mozilla Firefox (latest)
- Database: `hci_design` (local development database)

### 3.3 Entry and Exit Criteria

**Entry Criteria (before testing begins):**
- All source code is committed to the repository.
- The database schema (`schema.sql`) is up to date.
- The CI/CD pipeline is configured and active.

**Exit Criteria (testing is complete when):**
- All automated tests pass with zero failures.
- Code coverage is at or above 80% for backend PHP files.
- All manual test cases have been executed and signed off.
- No critical or high-severity security issues remain open.

---

## 4. Test Structure

### 4.1 Directory Layout
```
tests/
  bootstrap.php                    -- PHPUnit environment setup
  TestDatabaseHelper.php           -- Shared DB connection utility
  Unit/
    HelpersTest.php                -- Unit tests: helper functions, password, session, JSON
    FileStructureTest.php          -- Unit tests: file existence and content checks
  Integration/
    AuthIntegrationTest.php        -- Integration tests: user registration and login (DB)
    DesignsIntegrationTest.php     -- Integration tests: design CRUD (DB)
    RoomsIntegrationTest.php       -- Integration tests: room preset CRUD (DB)
```

### 4.2 Test Count Summary

| Suite            | Test Class               | Test Count |
|------------------|--------------------------|------------|
| Unit             | HelpersTest              | 18         |
| Unit             | FileStructureTest        | 30         |
| Integration      | AuthIntegrationTest      | 8          |
| Integration      | DesignsIntegrationTest   | 10         |
| Integration      | RoomsIntegrationTest     | 9          |
| **Total**        |                          | **75**     |

---

## 5. Unit Test Cases

### 5.1 HelpersTest — Helper Functions and Core Logic

| # | Test Case | Input | Expected Output | Status |
|---|-----------|-------|-----------------|--------|
| U01 | JSON encode produces correct success structure | `['success' => true, 'id' => 'd_001']` | Decoded array has `success = true`, `id = 'd_001'` | Pass |
| U02 | JSON encode produces correct error structure | `['error' => 'Invalid action']` | Decoded array has `error = 'Invalid action'` | Pass |
| U03 | JSON encode handles empty array | `[]` | Returns empty array | Pass |
| U04 | JSON encode handles nested user structure | `['success'=>true,'user'=>['email'=>...,'name'=>...]]` | Nested keys accessible correctly | Pass |
| U05 | Password hash and verify succeeds | Plain: `SecurePass123!` | `password_verify()` returns `true` | Pass |
| U06 | Password verify fails with wrong password | Wrong: `WrongPassword` | `password_verify()` returns `false` | Pass |
| U07 | Password hash is never plain text | Plain: `1234` | Hash starts with `$2y$` | Pass |
| U08 | Session contains user ID after login | `$_SESSION['user_id'] = 1` | `$_SESSION['user_id']` equals `1` | Pass |
| U09 | Session is empty after logout | Session cleared | `user_id` key not present | Pass |
| U10 | Auth logic returns false when not logged in | Empty `$_SESSION` | `isset($_SESSION['user_id'])` = false | Pass |
| U11 | Auth logic returns true when logged in | `$_SESSION['user_id'] = 3` | `isset($_SESSION['user_id'])` = true | Pass |
| U12 | Empty email fails validation | `''` | `empty()` returns true | Pass |
| U13 | Valid email passes filter | `group108@gmail.com` | `FILTER_VALIDATE_EMAIL` passes | Pass |
| U14 | Invalid email fails filter | `not-an-email` | `FILTER_VALIDATE_EMAIL` returns false | Pass |
| U15 | Password minimum length validation | `123` vs `SecurePass!` | Short < 6 chars, valid >= 6 chars | Pass |
| U16 | Valid room data JSON parses correctly | JSON string with width/length | Decoded `width = 5`, `length = 4` | Pass |
| U17 | Valid furniture data JSON parses correctly | JSON array with sofa/table | Decoded count = 2, first id = `sofa_01` | Pass |
| U18 | Invalid JSON returns null | `{invalid json}` | `json_decode()` returns `null` | Pass |

### 5.2 FileStructureTest — File and Content Verification

| # | Test Case | Expected Result | Status |
|---|-----------|-----------------|--------|
| U19 | `Design/api/auth.php` exists | File found | Pass |
| U20 | `Design/api/designs.php` exists | File found | Pass |
| U21 | `Design/api/rooms.php` exists | File found | Pass |
| U22 | `Design/utils/helpers.php` exists | File found | Pass |
| U23 | `Design/database/db_connect.php` exists | File found | Pass |
| U24 | `Design/database/schema.sql` exists | File found | Pass |
| U25 | `schema.sql` is not empty | Non-empty content | Pass |
| U26 | `schema.sql` contains users table | Contains `CREATE TABLE` + `users` | Pass |
| U27 | `schema.sql` contains designs table | Contains `designs` | Pass |
| U28 | `schema.sql` contains rooms table | Contains `rooms` | Pass |
| U29 | `Design/index.html` exists | File found | Pass |
| U30 | `Design/editor.html` exists | File found | Pass |
| U31 | `Design/signup.html` exists | File found | Pass |
| U32 | `Design/rooms.html` exists | File found | Pass |
| U33 | `Design/designs.html` exists | File found | Pass |
| U34 | `Design/js/auth.js` exists | File found | Pass |
| U35 | `Design/js/editor.js` exists | File found | Pass |
| U36 | `Design/js/canvas2d.js` exists | File found | Pass |
| U37 | `Design/js/canvas3d.js` exists | File found | Pass |
| U38 | `auth.php` contains login case | `case 'login':` found | Pass |
| U39 | `auth.php` contains register case | `case 'register':` found | Pass |
| U40 | `auth.php` contains logout case | `case 'logout':` found | Pass |
| U41 | `designs.php` contains save case | `case 'save':` found | Pass |
| U42 | `designs.php` contains load case | `case 'load':` found | Pass |
| U43 | `designs.php` contains delete case | `case 'delete':` found | Pass |
| U44 | `rooms.php` contains save case | `case 'save':` found | Pass |
| U45 | `rooms.php` contains load case | `case 'load':` found | Pass |
| U46 | `auth.php` uses prepared statements | `prepare(` and `bind_param(` found | Pass |
| U47 | `designs.php` uses prepared statements | `prepare(` and `bind_param(` found | Pass |
| U48 | `auth.php` uses password hashing | `password_hash(` and `password_verify(` found | Pass |

---

## 6. Integration Test Cases

### 6.1 AuthIntegrationTest — User Authentication (Database)

| # | Test Case | Input | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| I01 | Register new user inserts DB row | name, email, hashed password | INSERT succeeds, `insert_id > 0` | Pass |
| I02 | Duplicate email is rejected | Same email as I01 | MySQL UNIQUE constraint blocks INSERT | Pass |
| I03 | Registered user found by email | `testuser@example.com` | Row returned, name matches | Pass |
| I04 | Correct password verifies successfully | Correct plain password vs stored hash | `password_verify()` = true | Pass |
| I05 | Incorrect password fails verification | Wrong password vs stored hash | `password_verify()` = false | Pass |
| I06 | Second user registration succeeds | Different email | INSERT succeeds | Pass |
| I07 | Total user count is correct | After 2 registrations | COUNT = 2 | Pass |
| I08 | Non-existent email returns no rows | Unknown email | `num_rows = 0` | Pass |

### 6.2 DesignsIntegrationTest — Design CRUD (Database)

| # | Test Case | Input | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| I09  | Save design inserts new row | id, user_id, name, JSON data | INSERT succeeds | Pass |
| I10  | Saved design retrieved by ID | `d_test_001` | Row returned with correct name | Pass |
| I11  | Room data stored as valid JSON | JSON with width/length | Decoded correctly | Pass |
| I12  | Furniture data stored as valid JSON | JSON array of items | Item count and id match | Pass |
| I13  | Save with same ID updates existing row | Same ID, new name | Upsert executes, name updated | Pass |
| I14  | Load designs returns rows for correct user | User ID from test | `num_rows > 0` | Pass |
| I15  | Load designs returns zero for other user | Non-existent user ID | `num_rows = 0` | Pass |
| I16  | Delete design removes row | `d_test_delete` | `affected_rows = 1` | Pass |
| I17  | Deleted design no longer exists | `d_test_delete` | `num_rows = 0` | Pass |
| I18  | Delete non-existent design affects zero rows | Unknown ID | `affected_rows = 0` | Pass |

### 6.3 RoomsIntegrationTest — Room Preset CRUD (Database)

| # | Test Case | Input | Expected Result | Status |
|---|-----------|-------|-----------------|--------|
| I19 | Save room template inserts new row | id, user_id, name, JSON data | INSERT succeeds | Pass |
| I20 | Saved room retrieved by ID | `r_test_001` | Row returned with correct name | Pass |
| I21 | Room data is stored as valid JSON | JSON with width/length/height | Decoded correctly | Pass |
| I22 | Save with same ID updates existing row | Same ID, new name | Upsert executes, name updated | Pass |
| I23 | Load rooms returns rows for correct user | Test user ID | `num_rows > 0` | Pass |
| I24 | Load rooms returns zero for other user | Non-existent user ID | `num_rows = 0` | Pass |
| I25 | Multiple room presets saved for same user | 3 rooms for same user | COUNT >= 3 | Pass |
| I26 | Delete room removes row | `r_test_todelete` | `affected_rows = 1` | Pass |
| I27 | Deleted room no longer exists | `r_test_todelete` | `num_rows = 0` | Pass |

---

## 7. Security Test Cases

The following security checks run automatically in the CI/CD pipeline (Job 3: Security Vulnerability Scan).

| # | Test Case | What is Checked | Expected Result |
|---|-----------|-----------------|-----------------|
| S01 | Hardcoded credentials scan | Source files checked for plain-text passwords | No credentials found in tracked files |
| S02 | SQL injection pattern check | Checks for raw `mysqli_query` with `$_POST/$_GET` | All queries use prepared statements |
| S03 | Wildcard CORS header check | `Access-Control-Allow-Origin: *` in API files | No wildcard CORS headers present |
| S04 | Error output exposure check | `display_errors = 1` or `error_reporting = E_ALL` | No error display in production config |
| S05 | Password storage verification (manual) | `password_hash()` with `PASSWORD_DEFAULT` | Passwords are bcrypt-hashed in `auth.php` |
| S06 | Session fixation resistance (manual) | New session ID generated on login | `session_regenerate_id()` should be called |
| S07 | XSS prevention (manual) | User input echoed back to HTML | Output should be sanitized with `htmlspecialchars()` |

---

## 8. Manual Test Cases

The following tests are performed manually in the browser during development.

### 8.1 Authentication

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| M01 | Login with valid credentials | Open `index.html`, enter `group108@gmail.com` / `1234`, click Login | Redirected to editor or designs page |
| M02 | Login with invalid credentials | Enter wrong email or password | Error message is displayed, no redirect |
| M03 | Register with new email | Open `signup.html`, fill all fields, submit | Account created, user is redirected |
| M04 | Register with existing email | Use `group108@gmail.com` in signup form | Error: "Email already registered" |
| M05 | Access editor without login | Navigate directly to `editor.html` | Redirected to `index.html` |
| M06 | Logout | Click logout button | Session cleared, redirected to `index.html` |

### 8.2 Design Editor

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| M07 | Add furniture to canvas | Open editor, drag a sofa from the panel to the canvas | Sofa appears on the 2D canvas |
| M08 | Switch between 2D and 3D view | Click the 3D view toggle | Canvas switches to 3D perspective |
| M09 | Change room dimensions | Adjust width/length sliders | Canvas redraws with new room size |
| M10 | Change wall colour | Select a colour from the wall colour picker | Wall colour updates on the canvas |
| M11 | Save a design | Click Save Design, enter a name | Success message, design stored in DB |
| M12 | Load an existing design | Click Load Designs, select a saved design | Editor loads the saved room and furniture |
| M13 | Delete a design | Open designs list, click delete on a design | Design removed from the list and DB |

### 8.3 Room Presets

| # | Test Case | Steps | Expected Result |
|---|-----------|-------|-----------------|
| M14 | Save room preset | Configure room dimensions, click Save Preset | Room preset saved in DB |
| M15 | Load room preset | Open rooms page, select a saved preset | Room dimensions applied to editor |
| M16 | Delete room preset | Click delete on a room preset | Preset removed from list and DB |

---

## 9. Code Coverage

Code coverage is measured automatically by Xdebug during each CI/CD run.

**Target coverage: 80% or above for all PHP API files.**

| File | Type | Coverage Target |
|------|------|-----------------|
| `Design/api/auth.php` | Integration | >= 80% |
| `Design/api/designs.php` | Integration | >= 80% |
| `Design/api/rooms.php` | Integration | >= 80% |
| `Design/utils/helpers.php` | Unit | >= 90% |

Coverage reports are generated in two formats:
- **Text summary**: Printed to the CI/CD console output.
- **Clover XML**: Uploaded as a GitHub Actions artifact (`coverage.xml`), downloadable from the Actions run page.

---

## 10. CI/CD Pipeline Overview

All automated tests are executed by the GitHub Actions CI/CD pipeline defined in `.github/workflows/ci-cd.yml`.

### 10.1 Pipeline Jobs

| Job | Name | Depends On | Purpose |
|-----|------|------------|---------|
| 1 | Code Quality and Linting | None | PHP lint, JS syntax check |
| 2 | PHP Unit and Integration Tests | Job 1 | PHPUnit with MySQL service |
| 3 | Security Vulnerability Scan | Job 1 | Bash-based security checks |
| 4 | Frontend HTML and JS Validation | Job 1 | File existence, JS syntax |
| 5 | Pipeline Summary | All | Print final pass/fail summary |

### 10.2 Triggers

The pipeline runs automatically on:
- Every `push` to the `main` or `develop` branch.
- Every `pull_request` targeting the `main` or `develop` branch.

### 10.3 Artifacts Produced

After each pipeline run, the following files are available to download from the GitHub Actions run page:

| Artifact | Contents |
|----------|----------|
| `test-results.xml` | JUnit-format test results (all 75 tests) |
| `coverage.xml` | Clover-format code coverage report |

---

## 11. Test Execution Instructions

### 11.1 Running Tests Locally (Windows / XAMPP)

**Prerequisites:** Composer installed, MySQL running with `hci_design` database, schema applied.

```bash
# From the project root directory
composer install
vendor/bin/phpunit
```

**Run with coverage:**
```bash
vendor/bin/phpunit --coverage-text --coverage-clover coverage.xml
```

**Run only unit tests:**
```bash
vendor/bin/phpunit --testsuite "Unit Tests"
```

**Run only integration tests:**
```bash
vendor/bin/phpunit --testsuite "Integration Tests"
```

### 11.2 Viewing CI/CD Results on GitHub

1. Navigate to the repository on GitHub.
2. Click the **Actions** tab.
3. Click the most recent workflow run.
4. Each job can be expanded to view detailed step output.
5. Scroll to the **Artifacts** section to download `test-results.xml` and `coverage.xml`.

---

## 12. Defect Management

Any test failure identified during automated or manual testing is recorded with the following information:

| Field | Description |
|-------|-------------|
| Defect ID | Sequential identifier (e.g., DEF-001) |
| Test Case | The test case that revealed the defect |
| Severity | Critical / High / Medium / Low |
| Description | What went wrong |
| Steps to Reproduce | How to trigger the issue |
| Expected Result | What should happen |
| Actual Result | What actually happened |
| Status | Open / In Progress / Resolved |

**Severity definitions:**
- **Critical**: Application crashes or data is permanently lost.
- **High**: A core feature does not work (login, save, load).
- **Medium**: A feature works but produces incorrect output.
- **Low**: Minor visual or non-functional issue.

---

## 13. Acceptance Criteria

The application passes the testing phase and is accepted for release when all of the following conditions are met:

1. All 75 automated PHPUnit tests pass with zero failures and zero errors.
2. PHP and JavaScript syntax checks pass with zero errors.
3. No critical or high-severity security issues are detected by the automated scan.
4. All 16 manual test cases pass without defects.
5. Code coverage for backend PHP API files is at or above 80%.
6. All five CI/CD pipeline jobs complete successfully on the `main` branch.
7. Test artefacts (`test-results.xml`, `coverage.xml`) are available for download from the GitHub Actions run.

---

*End of Testing Plan — PUSL3122 Group 108*
