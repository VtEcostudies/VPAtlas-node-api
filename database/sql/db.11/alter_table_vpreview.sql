alter table vpreview alter column "reviewVisitIdLegacy" drop not null;
alter table vpreview alter column "reviewVisitId" set not null;
update vpreview set "updatedAt"=now(); --this necessary to make review to-do lists work.