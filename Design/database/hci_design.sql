-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Mar 15, 2026
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hci_design`
--
CREATE DATABASE IF NOT EXISTS `hci_design`;
USE `hci_design`;

-- --------------------------------------------------------
-- CLEAN UP OLD TABLES (optional but helpful for dev)
-- --------------------------------------------------------
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `designs`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `furniture_catalog`;
SET FOREIGN_KEY_CHECKS=1;

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seeding users
INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`) VALUES
(1, 'Dulaj Dulsith', 'dulaj.dulsith@gmail.com', '$2y$10$FaSJkIawlbDwARFqk4rnyOkdQMfnz21mpoJIekRd8AOOT0pW9FNNy', '2026-03-01 18:49:54');

-- --------------------------------------------------------
-- Table structure for table `furniture_catalog`
-- --------------------------------------------------------
CREATE TABLE `furniture_catalog` (
  `id` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` varchar(50) NOT NULL,
  `icon` varchar(10) NOT NULL DEFAULT '🪑',
  `default_color` varchar(10) NOT NULL DEFAULT '#888888',
  `width` decimal(5,2) NOT NULL,
  `depth` decimal(5,2) NOT NULL,
  `height` decimal(5,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seeding furniture_catalog
INSERT INTO `furniture_catalog` (`id`, `name`, `category`, `icon`, `default_color`, `width`, `depth`, `height`) VALUES
('sofa_3seat',   'Living Room Sofa',      'Sofa',         '🛋️', '#6B8E23', 2.20, 0.90, 0.85),
('sofa_2seat',   'Two-Seat Sofa',         'Sofa',         '🛋️', '#8B6914', 1.60, 0.85, 0.80),
('ottoman',      'Round Ottoman',         'Sofa',         '🧶', '#B06A3B', 0.60, 0.60, 0.45),
('bed_queen',    'Queen Bed',             'Bed',          '🛏️', '#8B7355', 1.60, 2.10, 0.60),
('bed_single',   'Single Bed',            'Bed',          '🛏️', '#A0856C', 1.00, 2.00, 0.55),
('dining_table', 'Dining Table',          'Table',        '🪵', '#8B4513', 1.80, 0.90, 0.76),
('side_table',   'Side Table',            'Table',        '🪵', '#C4975A', 0.50, 0.50, 0.60),
('coffee_table', 'Coffee Table',          'Table',        '🪵', '#6B4226', 1.20, 0.60, 0.45),
('bar_table',    'High Bar Table',        'Table',        '🪜', '#333333', 0.70, 0.70, 1.05),
('dining_chair', 'Dining Chair',          'Chair',        '🪑', '#4A5568', 0.50, 0.50, 0.90),
('office_chair', 'Office Chair',          'Chair',        '🪑', '#2D3748', 0.60, 0.60, 1.00),
('armchair',     'Deep Armchair',         'Chair',        '🛋️', '#B06A3B', 0.90, 0.85, 0.85),
('bench',        'Hallway Bench',         'Chair',        '🪑', '#6B4226', 1.20, 0.40, 0.45),
('wardrobe',     'Wardrobe',              'Cabinet',      '🗄️', '#7B5C3E', 2.00, 0.60, 2.00),
('storage_cab',  'Storage Cabinet',       'Cabinet',      '🗄️', '#5B4636', 1.00, 0.50, 1.80),
('tv_unit',      'TV Unit',               'Cabinet',      '📺', '#3C3C3C', 1.80, 0.45, 0.55),
('bookshelf',    'Bookshelf',             'Cabinet',      '📚', '#8B7355', 1.00, 0.35, 2.00),
('credenza',     'Modern Credenza',       'Cabinet',      '🗄️', '#A0856C', 1.50, 0.40, 0.75),
('desk',         'Work Desk',             'Desk',         '🖥️', '#C0A882', 1.40, 0.70, 0.76),
('plant_large',  'Large Floor Plant',     'Decor',        '🪴', '#2D6A4F', 0.40, 0.40, 1.20),
('plant_small',  'Small Table Plant',     'Decor',        '🌵', '#40916C', 0.20, 0.20, 0.30),
('lamp_floor',   'Floor Lamp',            'Decor',        '💡', '#F0D060', 0.30, 0.30, 1.50),
('rug',          'Area Rug',              'Decor',        '🟫', '#C4956A', 2.00, 1.50, 0.02),
('vase_floor',   'Large Decorative Vase', 'Decor',        '🏺', '#D4A373', 0.30, 0.30, 0.80),
('mirror_floor', 'Leaner Floor Mirror',   'Decor',        '🪞', '#E9ECEF', 0.80, 0.10, 1.80),
('window_single','Window',               'Window & Door','🪟', '#AED6F1', 1.00, 0.10, 1.20),
('door_single',  'Single Door',           'Window & Door','🚪', '#A0785A', 0.90, 0.10, 2.10),
('curtain_panel','Curtain Panel',         'Window & Door','🎭', '#C9ADE7', 1.40, 0.08, 2.40),
('dresser',      'Dresser',               'Bedroom',      '🗃️', '#C8A97E', 1.00, 0.50, 1.10),
('nightstand',   'Nightstand',            'Bedroom',      '🛋️', '#B89467', 0.50, 0.40, 0.60),
('vanity_table', 'Vanity Table',          'Bedroom',      '🪞', '#E8D5B7', 1.00, 0.45, 0.75),
('wall_sconce',      'Wall Sconce',       'Lighting',     '💡', '#FFD580', 0.20, 0.15, 0.35),
('wall_panel_light', 'Wall Panel Light',  'Lighting',     '🔦', '#FFF3C4', 0.60, 0.08, 0.12),
('floor_uplighter',  'Floor Uplighter',   'Lighting',     '🕯️', '#FFE599', 0.20, 0.20, 0.60);

-- --------------------------------------------------------
-- Table structure for table `designs`
-- --------------------------------------------------------
CREATE TABLE `designs` (
  `id` varchar(50) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `room_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `furniture_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- --------------------------------------------------------
-- CONSTRAINTS
-- --------------------------------------------------------
SET FOREIGN_KEY_CHECKS=0;
ALTER TABLE `designs` ADD CONSTRAINT `designs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
SET FOREIGN_KEY_CHECKS=1;

COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
