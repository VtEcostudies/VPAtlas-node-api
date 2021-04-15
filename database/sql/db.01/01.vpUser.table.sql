CREATE TABLE public.vpuser
(
	"id" serial,
	"username" text NOT NULL,
	"hash" text NOT NULL,
	"firstname" text NOT NULL,
	"middlename" text,
	"lastname" text NOT NULL,
	"email" text NOT NULL,
	"userrole" text NOT NULL,
	"createdat" timestamp default now(),
	"updatedat" timestamp default now(),
	CONSTRAINT vpuser_pkey PRIMARY KEY ("username")
);

ALTER TABLE public.vpuser
	OWNER to vpatlas;