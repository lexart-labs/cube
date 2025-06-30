ALTER TABLE evaluations
ADD COLUMN priority ENUM('low', 'acceptable', 'strong', 'na') DEFAULT 'na' AFTER active;

UPDATE evaluations SET priority = 'na' WHERE priority IS NULL;
CREATE INDEX idx_evaluations_priority ON evaluations(priority);

COMMIT;
