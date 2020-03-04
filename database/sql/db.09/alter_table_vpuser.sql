CREATE TYPE status_type AS ENUM ('registration', 'reset', 'confirmed', 'invalid');
ALTER TABLE vpuser DROP COLUMN IF EXISTS status;
ALTER TABLE vpuser ADD COLUMN status status_type default 'registration';
UPDATE vpuser SET status='registration';

select * from vpuser where username='Unknown' and token is null;