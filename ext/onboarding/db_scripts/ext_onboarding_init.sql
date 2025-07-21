CREATE DATABASE IF NOT EXISTS onboarding_db;
USE onboarding_db;

CREATE TABLE IF NOT EXISTS pending_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password VARCHAR(255) NOT NULL,
  kyc_status ENUM('pending', 'completed', 'under_review', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pending_users_kyc_data (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(255),
  identity_document VARCHAR(100),
  full_address TEXT,
  bank_information TEXT,
  country VARCHAR(100),
  iban VARCHAR(50),
  intermediary_bank VARCHAR(255),
  profile_photo VARCHAR(255),
  phone VARCHAR(20),
  emergency_phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES pending_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS pending_users_contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  nda_contract VARCHAR(255),
  service_agreement_contract VARCHAR(255),
  contracts_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES pending_users(id) ON DELETE CASCADE
);
