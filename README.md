# 🏠 Nebula Interiors - Design Compiler

> A modern, browser-based **2D/3D interior room design application** with real-time furniture placement and design management.

<div align="center">

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PHP](https://img.shields.io/badge/PHP-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-000000?style=for-the-badge&logo=three.js&logoColor=white)
![Composer](https://img.shields.io/badge/Composer-885630?style=for-the-badge&logo=composer&logoColor=white)
![PHPUnit](https://img.shields.io/badge/PHPUnit-366488?style=for-the-badge&logo=php&logoColor=white)
![Git](https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white)
![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)
![GitHub Actions](https://img.shields.io/badge/GitHub%20Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)
![Apache](https://img.shields.io/badge/Apache-D09A29?style=for-the-badge&logo=apache&logoColor=white)
![Font Awesome](https://img.shields.io/badge/Font%20Awesome-228AE6?style=for-the-badge&logo=font-awesome&logoColor=white)
![Google Fonts](https://img.shields.io/badge/Google%20Fonts-4285F4?style=for-the-badge&logo=google-fonts&logoColor=white)

**[View Demo](#-getting-started) • [Documentation](./TESTING_PLAN.md) • [License](./LICENSE)**

</div>

---

## 📋 Table of Contents

- [About](#-about-the-project)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Testing](#-testing)
- [API Endpoints](#-api-endpoints)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 About the Project

**Nebula Interiors - Design Compiler** is a sophisticated web application that empowers users to design and visualize interior spaces in both 2D and 3D. Users can register, authenticate, create custom room layouts, place furniture items from a curated library, and save their designs for future reference.

The application features:
- 🎨 **Beautiful Futuristic UI** with animated particle effects
- 🔐 **Secure Authentication** with session management
- 🏠 **2D Canvas Editor** for floor plan design
- 🎭 **3D Visualization** powered by Three.js for immersive viewing
- 💾 **Design Persistence** with local and server-side storage
- 📱 **Responsive Design** that works across devices
- ✅ **Commercial-grade Testing** with 80%+ code coverage

---

## ✨ Features

### User Management
- ✅ User registration with validation
- ✅ Secure login/logout functionality
- ✅ User profile management
- ✅ Session-based authentication
- ✅ Password reset capabilities

### Design Tools
- ✅ **2D Design Editor** - Create room layouts with walls and grids
- ✅ **3D Visualization** - View designs in immersive 3D space
- ✅ **Furniture Library** - Extensive collection of pre-made furniture items
- ✅ **Smart Placement** - Snap-to-grid and collision detection
- ✅ **Design Management** - Save, load, update, and delete designs
- ✅ **Real-time Preview** - Instant 2D to 3D conversion

### Technical Features
- ✅ RESTful API architecture
- ✅ Client-side state management
- ✅ Real-time UI updates with notifications
- ✅ Comprehensive error handling
- ✅ Database constraint validation
- ✅ Automated CI/CD pipeline

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose | Version/Link |
|-----------|---------|------------|
| **HTML5** | Markup & Structure | [MDN Docs](https://developer.mozilla.org/en-US/docs/Learn/HTML) |
| **CSS3** | Styling & Animations | [MDN Docs](https://developer.mozilla.org/en-US/docs/Web/CSS) |
| **JavaScript** | Client-side Logic | [ES6+](https://www.javascript.com/) |
| **Three.js** | 3D Graphics Engine | [r128](https://threejs.org/) |
| **Font Awesome** | Icon Library | [v6.0+](https://fontawesome.com/) |
| **Google Fonts** | Typography | [fonts.google.com](https://fonts.google.com/) |

### Backend
| Technology | Purpose | Version |
|-----------|---------|---------|
| **PHP** | Server-side Logic | 8.1+ |
| **MySQL** | Database Management | 8.0+ |
| **Apache** | Web Server | (XAMPP/cPanel) |
| **Composer** | PHP Package Manager | Latest |

### Testing & Quality Assurance
| Technology | Purpose | Version |
|-----------|---------|---------|
| **PHPUnit** | Unit Testing Framework | 11.0+ |
| **GitHub Actions** | CI/CD Pipeline | Latest |
| **Git** | Version Control | Latest |

---

## 🚀 Installation

### Prerequisites
- PHP 8.1 or higher
- MySQL 8.0 or higher
- Apache web server (XAMPP recommended)
- Composer installed globally
- Node.js/npm (optional, for development)
- Git for version control

### Step-by-Step Setup

#### 1. Clone the Repository
```bash
git clone https://github.com/dinoth03/PUSL3122_Group_108.git
cd PUSL3122_Group_108
```

#### 2. Install Dependencies
```bash
composer install
```

#### 3. Database Setup
```bash
# Import the database schema
mysql -u root -p < Design/database/hci_design.sql
```

#### 4. Configure Database Connection
Edit `Design/database/db_connect.php` and update:
```php
$host = 'localhost';
$user = 'root';
$password = 'your_password';
$database = 'hci_design';
```

#### 5. Start Apache & MySQL (if using XAMPP)
```bash
# Windows (XAMPP Control Panel)
- Start Apache
- Start MySQL

# Linux/Mac
sudo /Applications/XAMPP/xamppfiles/bin/xampp start
```

#### 6. Access the Application
Open your browser and navigate to:
```
http://localhost/PUSL3122_Group_108/Design/
```

---

## 💻 Usage

### 1. Getting Started
- Navigate to the home page (`index.html`)
- Click **"Sign Up"** to create a new account
- Fill in your details and verify your email
- Log in with your credentials

### 2. Creating a Design
- After login, click **"Start New Design"**
- Choose a room preset or create a custom room
- Use the **2D Editor** to:
  - Place walls and define room boundaries
  - Add furniture items from the library
  - Adjust positions and dimensions

### 3. 3D Visualization
- Switch to the **3D View** tab
- Rotate and zoom to inspect your design
- Toggle furniture items on/off
- Export or save your design

### 4. Managing Designs
- View all your designs on the dashboard
- Click a design to edit it
- Share design previews (if enabled)
- Download design files

---

---

## 🧪 Testing

The project includes comprehensive automated tests with **80%+ code coverage**.

### Run All Tests
```bash
composer test
```

### Run Tests with Coverage Report
```bash
composer test-coverage
```

### Test Types
- **Unit Tests** - Individual function validation
- **Integration Tests** - API and database interaction
- **Security Tests** - SQL injection and XSS prevention
- **Frontend Validation** - HTML/JS syntax checking

### Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation accordingly
- Ensure all tests pass before submitting

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 👥 Contributors

**PUSL3122 Group 108**

---

<div align="center">

✨ **Made with ❤️ by PUSL3122 Group 108** ✨

⭐️ Star us on GitHub if you find this project helpful!

</div>