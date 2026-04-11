-- Add policy_id column to documents table for policy-level document uploads
ALTER TABLE documents ADD COLUMN policy_id INT NULL;
ALTER TABLE documents ADD CONSTRAINT fk_documents_policy FOREIGN KEY (policy_id) REFERENCES policies(id) ON DELETE CASCADE;
