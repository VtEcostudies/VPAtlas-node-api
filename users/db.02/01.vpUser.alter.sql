--NOTE: DON'T USE BACKSLASH COMMENTS IN THESE SCRIPTS. IT CAUSES ERRORS.

--unique email. unique first, last?, first, last, email?
ALTER TABLE vpuser ADD CONSTRAINT unique_email UNIQUE(email);

ALTER TABLE vpuser ADD COLUMN "middleName" TEXT;
ALTER TABLE vpuser ADD CONSTRAINT "vpuser_id_unique_key" UNIQUE("id");

INSERT INTO vpuser (id, username, hash, firstname, lastname, email, userrole) 
VALUES (0,'Unknown','12345678','Unknown','Unknown','Unknown@unknown.org','Guest');
