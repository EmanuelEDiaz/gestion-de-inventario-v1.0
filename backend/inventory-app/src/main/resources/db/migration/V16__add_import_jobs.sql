CREATE TABLE import_jobs (
    id UUID PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    original_filename VARCHAR(255) NOT NULL,
    mapping_json TEXT,
    result_json TEXT,
    error_message TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_import_jobs_created_by ON import_jobs(created_by);
CREATE INDEX idx_import_jobs_status ON import_jobs(status);
