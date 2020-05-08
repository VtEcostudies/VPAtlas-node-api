CREATE TYPE status_type AS ENUM ('registration', 'reset', 'new_email', 'confirmed', 'invalid');
ALTER TABLE vpuser DROP COLUMN IF EXISTS status;
ALTER TABLE vpuser ADD COLUMN status status_type default 'registration';
UPDATE vpuser SET status='confirmed';

ALTER TABLE vpuser alter column status type varchar;
ALTER TABLE vpuser alter column status drop default;
DROP TYPE status_type;

CREATE TYPE status_type AS ENUM ('registration', 'reset', 'new_email', 'confirmed', 'invalid');
ALTER TABLE vpuser alter column status type status_type USING status::status_type;
ALTER TABLE vpuser alter column status set default 'registration';
