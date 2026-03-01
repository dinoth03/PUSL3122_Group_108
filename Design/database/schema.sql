-- Database: `hci_design`

-- Use the database
-- USE `hci_design`;

-- Table for users (if registration/login is needed)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for design records
CREATE TABLE IF NOT EXISTS `designs` (
  `id` VARCHAR(50) PRIMARY KEY,
  `user_id` INT,
  `name` VARCHAR(100) NOT NULL,
  `room_data` JSON NOT NULL, -- To store room dimensions, colors, windows etc
  `furniture_data` JSON NOT NULL, -- To store placed furniture list
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Table for room presets
CREATE TABLE IF NOT EXISTS `rooms` (
  `id` VARCHAR(50) PRIMARY KEY,
  `user_id` INT,
  `name` VARCHAR(100) NOT NULL,
  `room_data` JSON NOT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
);

-- Insert dummy users (matching existing demo logic in auth.js)
-- password '1234' -> hash $2y$10$7/O8Vd7gR8S.W.W.W.W.W (not strictly necessary but good practice)
-- INSERT INTO `users` (name, email, password) VALUES ('Alex Designer', 'group108@gmail.com', '1234');
-- INSERT INTO `users` (name, email, password) VALUES ('Sam Admin', 'admin@designcompiler.com', 'Admin123!');
