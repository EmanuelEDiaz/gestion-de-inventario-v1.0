CREATE TABLE audit_log_archive (LIKE audit_log INCLUDING ALL);
CREATE INDEX idx_audit_log_archive_created_at ON audit_log_archive(created_at);
CREATE INDEX idx_audit_log_archive_entity ON audit_log_archive(entity_type, entity_id);
