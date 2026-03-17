# User Profile Feature Documentation

## Overview
The User Profile feature allows authenticated users to view and edit their account details including name, email, and password. All changes are persisted to the database.

## Files Created/Modified

### New Files
1. **Design/profile.html** - User profile page with view/edit modes
2. **Design/api/profile.php** - Backend API for profile operations
3. **Design/js/profile.js** - Frontend logic for profile management

### Modified Files
1. **Design/components/header.php** - Added profile link
2. **Design/designs.html** - Added profile link in navbar
3. **Design/editor.html** - Added profile link in navbar

## Features

### User Profile Page (profile.html)
- **View Mode**: Display user's current profile information
  - Full Name
  - Email Address
  - Password (masked)
  
- **Edit Mode**: Allows users to modify their profile
  - Edit Name
  - Edit Email
  - Change Password (optional)
  - Password visibility toggle

- **User Actions**:
  - Edit Profile button
  - Save Changes button
  - Cancel button (discards changes)
  - Logout button

### API Endpoints (api/profile.php)

#### 1. Get User Profile
**Endpoint**: `api/profile.php?action=get`
**Method**: GET
**Authentication**: Required (session-based)
**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "2026-03-01 18:49:54"
  }
}
```

#### 2. Update User Profile
**Endpoint**: `api/profile.php`
**Method**: POST
**Authentication**: Required (session-based)
**Parameters**:
- `action` (required): "update"
- `name` (required): User's full name
- `email` (required): User's email address
- `password` (optional): New password (if empty, keeps current password)

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### 3. Check Email Availability
**Endpoint**: `api/profile.php?action=check-email&email=test@example.com`
**Method**: GET
**Authentication**: Required (session-based)
**Response**:
```json
{
  "available": true
}
```

## Frontend Guide

### Profile Manager Class
The `ProfileManager` class (in js/profile.js) handles all profile-related functionality:

**Key Methods**:
- `loadProfile()` - Fetches user data from the API
- `enterEditMode()` - Enables edit fields
- `exitEditMode()` - Disables edit fields and restores original values
- `handleSubmit()` - Validates and submits profile changes
- `togglePasswordVisibility()` - Show/hide password field
- `showSuccess()` - Display success message
- `showError()` - Display error message

### Validation
The frontend validates:
- Name is not empty
- Email is not empty and valid format
- Password is at least 6 characters (if changing password)

### User Flow
1. User clicks "Profile" link from main pages
2. Profile page loads and fetches user data
3. User sees their current information in view mode
4. User clicks "Edit Profile" button
5. Form fields become editable
6. User makes changes and clicks "Save Changes"
7. Frontend validates the data
8. API updates profile in database
9. Session variables updated
10. User is returned to view mode with success message

## Database Schema
The feature uses the existing `users` table:
```sql
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

## Security Features

1. **Authentication Check**: All API endpoints require valid PHP session
2. **Password Hashing**: Passwords are hashed using `PASSWORD_DEFAULT` (bcrypt)
3. **Email Uniqueness**: Email must be unique across the system
4. **Input Validation**: Server-side validation for all inputs
5. **Session Management**: User session variables are updated on successful profile edit

## Error Handling

The system handles various error scenarios:
- Unauthorized access (no valid session)
- Invalid email format
- Email already in use
- Database connection errors
- Missing required fields

## Accessing the Profile Page

Users can access their profile from three main pages:
1. **Editor (editor.html)** - Profile link in navbar: `👤 Profile`
2. **My Designs (designs.html)** - Profile link in navbar: `👤 Profile`
3. **Back to Home link** - Direct link from profile page back to index.html

## Testing

### Test Cases
1. **View Profile**: Navigate to profile page and verify user data loads
2. **Edit Name**: Change user name and save
3. **Edit Email**: Change email and verify uniqueness check
4. **Change Password**: Update password and verify new password works on login
5. **Password Visibility**: Test show/hide password toggle
6. **Cancel Edit**: Start editing and cancel, verify original values restored
7. **Session Checking**: Verify profile page redirects to login if session is invalid

### Demo Credentials
- Email: `dulaj.dulsith@gmail.com`
- Password: `1234` (default hashed password in database)

## Styling
The profile page uses a clean, modern design with:
- Form-focused layout
- Modal-like card design
- Color-coded buttons (green for save, red for logout, gray for cancel)
- Success/error alerts with auto-dismiss
- Responsive design (works on mobile)
- Loading indicator during data fetch

## Notes
- Password field is optional on update - leave blank to keep current password
- Session variables are kept in sync with database
- All timestamps use database server timezone
- Email addresses are case-insensitive but unique
