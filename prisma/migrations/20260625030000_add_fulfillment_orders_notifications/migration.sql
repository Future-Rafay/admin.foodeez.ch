-- Fulfillment, pickup/delivery, order rejection, ETA acknowledgment, and notifications.
--
-- Hand-created migration SQL. Do not run Prisma migration commands in this step.
--
-- Notes:
-- - MySQL support for `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` varies by version.
--   To make this script safer to rerun across MySQL/MariaDB versions, each column,
--   index, and foreign key addition is guarded through INFORMATION_SCHEMA checks.
-- - If your SQL client does not allow PREPARE/EXECUTE statements, run each ALTER
--   statement manually only after confirming the column/index/constraint is absent.
-- - `DELIVERY_RANGE_ZIP_CODES` is intentionally preserved for backward compatibility.
-- - `PAYMENT_DONE` remains the payment state column:
--   0 = pending/unpaid, 1 = paid, 2 = refunded, 3 = failed.
-- - `DELIVERY_ET` is reused for both estimated delivery time and estimated pickup time.

CREATE TABLE IF NOT EXISTS business_notification (
  BUSINESS_NOTIFICATION_ID INT NOT NULL AUTO_INCREMENT,
  BUSINESS_ID INT NOT NULL,
  NOTIFICATION_TYPE VARCHAR(30) NOT NULL,
  TITLE VARCHAR(150) NOT NULL,
  MESSAGE TEXT NULL,
  IS_READ TINYINT DEFAULT 0,
  LINK_URL VARCHAR(255) NULL,
  METADATA_JSON LONGTEXT NULL,
  CREATION_DATETIME DATETIME(0) DEFAULT CURRENT_TIMESTAMP,
  EXPIRES_AT DATETIME(0) NOT NULL,
  PRIMARY KEY (BUSINESS_NOTIFICATION_ID),
  INDEX idx_business_notification_business_id (BUSINESS_ID),
  INDEX idx_business_notification_is_read (IS_READ),
  INDEX idx_business_notification_creation_datetime (CREATION_DATETIME),
  INDEX idx_business_notification_expires_at (EXPIRES_AT),
  CONSTRAINT business_notification_business_id_fkey
    FOREIGN KEY (BUSINESS_ID)
    REFERENCES business (BUSINESS_ID)
    ON DELETE CASCADE
);

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_settings'
     AND COLUMN_NAME = 'DELIVERY_ENABLED') = 0,
  'ALTER TABLE business_settings ADD COLUMN DELIVERY_ENABLED TINYINT DEFAULT 1',
  'SELECT ''business_settings.DELIVERY_ENABLED already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_settings'
     AND COLUMN_NAME = 'DELIVERY_ZONES_JSON') = 0,
  'ALTER TABLE business_settings ADD COLUMN DELIVERY_ZONES_JSON LONGTEXT NULL',
  'SELECT ''business_settings.DELIVERY_ZONES_JSON already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_settings'
     AND COLUMN_NAME = 'PICKUP_ENABLED') = 0,
  'ALTER TABLE business_settings ADD COLUMN PICKUP_ENABLED TINYINT DEFAULT 0',
  'SELECT ''business_settings.PICKUP_ENABLED already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_settings'
     AND COLUMN_NAME = 'PICKUP_INSTRUCTIONS') = 0,
  'ALTER TABLE business_settings ADD COLUMN PICKUP_INSTRUCTIONS TEXT NULL',
  'SELECT ''business_settings.PICKUP_INSTRUCTIONS already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_settings'
     AND COLUMN_NAME = 'DEFAULT_PICKUP_PREP_MINUTES') = 0,
  'ALTER TABLE business_settings ADD COLUMN DEFAULT_PICKUP_PREP_MINUTES INT DEFAULT 20',
  'SELECT ''business_settings.DEFAULT_PICKUP_PREP_MINUTES already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_settings'
     AND COLUMN_NAME = 'DEFAULT_DELIVERY_PREP_MINUTES') = 0,
  'ALTER TABLE business_settings ADD COLUMN DEFAULT_DELIVERY_PREP_MINUTES INT DEFAULT 45',
  'SELECT ''business_settings.DEFAULT_DELIVERY_PREP_MINUTES already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_order'
     AND COLUMN_NAME = 'ORDER_TYPE') = 0,
  'ALTER TABLE business_order ADD COLUMN ORDER_TYPE VARCHAR(20) NOT NULL DEFAULT ''delivery''',
  'SELECT ''business_order.ORDER_TYPE already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_order'
     AND COLUMN_NAME = 'ORDER_REJECTION_REASON') = 0,
  'ALTER TABLE business_order ADD COLUMN ORDER_REJECTION_REASON VARCHAR(100) NULL',
  'SELECT ''business_order.ORDER_REJECTION_REASON already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_order'
     AND COLUMN_NAME = 'ORDER_REJECTION_NOTE') = 0,
  'ALTER TABLE business_order ADD COLUMN ORDER_REJECTION_NOTE TEXT NULL',
  'SELECT ''business_order.ORDER_REJECTION_NOTE already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_order'
     AND COLUMN_NAME = 'REJECTED_DATETIME') = 0,
  'ALTER TABLE business_order ADD COLUMN REJECTED_DATETIME DATETIME(0) NULL',
  'SELECT ''business_order.REJECTED_DATETIME already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_order'
     AND COLUMN_NAME = 'ETA_ACKNOWLEDGED_DATETIME') = 0,
  'ALTER TABLE business_order ADD COLUMN ETA_ACKNOWLEDGED_DATETIME DATETIME(0) NULL',
  'SELECT ''business_order.ETA_ACKNOWLEDGED_DATETIME already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_notification'
     AND INDEX_NAME = 'idx_business_notification_business_id') = 0,
  'CREATE INDEX idx_business_notification_business_id ON business_notification (BUSINESS_ID)',
  'SELECT ''business_notification.idx_business_notification_business_id already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_notification'
     AND INDEX_NAME = 'idx_business_notification_is_read') = 0,
  'CREATE INDEX idx_business_notification_is_read ON business_notification (IS_READ)',
  'SELECT ''business_notification.idx_business_notification_is_read already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_notification'
     AND INDEX_NAME = 'idx_business_notification_creation_datetime') = 0,
  'CREATE INDEX idx_business_notification_creation_datetime ON business_notification (CREATION_DATETIME)',
  'SELECT ''business_notification.idx_business_notification_creation_datetime already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_notification'
     AND INDEX_NAME = 'idx_business_notification_expires_at') = 0,
  'CREATE INDEX idx_business_notification_expires_at ON business_notification (EXPIRES_AT)',
  'SELECT ''business_notification.idx_business_notification_expires_at already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = IF(
  (SELECT COUNT(*)
   FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
   WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'business_notification'
     AND CONSTRAINT_NAME = 'business_notification_business_id_fkey') = 0,
  'ALTER TABLE business_notification ADD CONSTRAINT business_notification_business_id_fkey FOREIGN KEY (BUSINESS_ID) REFERENCES business (BUSINESS_ID) ON DELETE CASCADE',
  'SELECT ''business_notification.business_notification_business_id_fkey already exists'' AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
