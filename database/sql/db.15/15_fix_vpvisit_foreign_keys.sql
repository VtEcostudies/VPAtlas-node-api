alter table vpvisit drop constraint fk_pool_id;
alter table vpvisit drop constraint fk_user_id;
alter table vpvisit add constraint fk_vpvisit_vptown_id foreign key ("visitTownId") references vptown("townId");
alter table vpvisit drop constraint fk_town_id;
