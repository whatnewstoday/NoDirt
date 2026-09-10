-- GR2 MVP migration: recurring, service profile, check-in/out, contracts

ALTER TABLE bookingservice
  ADD COLUMN bookingType ENUM('one_time', 'trial', 'recurring') NOT NULL DEFAULT 'one_time' AFTER paymentStatus,
  ADD COLUMN recurringPackageId INT NULL AFTER bookingType,
  ADD COLUMN specialInstructions TEXT NULL AFTER recurringPackageId,
  ADD COLUMN checkInTime DATETIME NULL AFTER specialInstructions,
  ADD COLUMN checkOutTime DATETIME NULL AFTER checkInTime,
  ADD COLUMN workDurationMinutes INT NULL AFTER checkOutTime;

-- Access snapshot columns for bookings (captures customer access info at booking time)
ALTER TABLE bookingservice
  ADD COLUMN accessMethodSnapshot VARCHAR(50) DEFAULT 'none' AFTER workDurationMinutes,
  ADD COLUMN lockboxLocationSnapshot VARCHAR(255) NULL AFTER accessMethodSnapshot,
  ADD COLUMN lockboxPinEncSnapshot TEXT NULL AFTER lockboxLocationSnapshot,
  ADD COLUMN condoGuideEncSnapshot TEXT NULL AFTER lockboxPinEncSnapshot,
  ADD COLUMN accessNoteEncSnapshot TEXT NULL AFTER condoGuideEncSnapshot;

-- Update status ENUM to include 'confirmed' (used when employee is assigned)
ALTER TABLE bookingservice
  MODIFY COLUMN status ENUM('booked', 'confirmed', 'processing', 'in progress', 'completed', 'cancelled') DEFAULT 'booked';

CREATE TABLE IF NOT EXISTS customer_service_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idCustomer INT NOT NULL UNIQUE,
  homeSizeSqm INT NULL,
  priorityAreas VARCHAR(255) NULL,
  hasPets TINYINT(1) NOT NULL DEFAULT 0,
  petNotes TEXT NULL,
  defaultAddress VARCHAR(255) NULL,
  defaultTime TIME NULL,
  specialInstructions TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_profile_customer
    FOREIGN KEY (idCustomer) REFERENCES customers(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recurring_packages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idCustomer INT NOT NULL,
  idService INT NOT NULL,
  frequency ENUM('weekly', 'monthly') NOT NULL,
  dayOfWeek TINYINT NULL COMMENT '0=Sunday...6=Saturday',
  dayOfMonth TINYINT NULL COMMENT '1..28/30/31',
  cleaningTime TIME NOT NULL,
  address VARCHAR(255) NOT NULL,
  note TEXT NULL,
  specialInstructions TEXT NULL,
  totalFee DECIMAL(12,2) NOT NULL,
  preferredEmployeeId INT NULL,
  trialBookingId INT NULL,
  status ENUM('active', 'paused', 'cancelled') NOT NULL DEFAULT 'active',
  nextBookingDate DATE NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_package_customer
    FOREIGN KEY (idCustomer) REFERENCES customers(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_package_service
    FOREIGN KEY (idService) REFERENCES service(id),
  CONSTRAINT fk_package_preferred_employee
    FOREIGN KEY (preferredEmployeeId) REFERENCES employees(id),
  CONSTRAINT fk_package_trial_booking
    FOREIGN KEY (trialBookingId) REFERENCES bookingservice(id)
);

CREATE TABLE IF NOT EXISTS service_contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  idCustomer INT NOT NULL,
  recurringPackageId INT NOT NULL,
  contractCode VARCHAR(40) NOT NULL UNIQUE,
  contractTitle VARCHAR(255) NOT NULL,
  contractTerms TEXT NOT NULL,
  filePath VARCHAR(255) NOT NULL,
  fileName VARCHAR(120) NOT NULL,
  status ENUM('draft', 'active', 'signed', 'terminated') NOT NULL DEFAULT 'active',
  signedAt DATETIME NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contract_customer
    FOREIGN KEY (idCustomer) REFERENCES customers(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_contract_package
    FOREIGN KEY (recurringPackageId) REFERENCES recurring_packages(id)
    ON DELETE CASCADE
);

ALTER TABLE bookingservice
  ADD CONSTRAINT fk_booking_recurring_package
    FOREIGN KEY (recurringPackageId) REFERENCES recurring_packages(id)
    ON DELETE SET NULL;

CREATE INDEX idx_bookingservice_booking_type ON bookingservice (bookingType);
CREATE INDEX idx_bookingservice_checkin_checkout ON bookingservice (idEmployee, checkInTime, checkOutTime);
CREATE INDEX idx_recurring_customer_status ON recurring_packages (idCustomer, status);
