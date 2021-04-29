/*
The process to create VPAtlas from existing tables of data began by mapping columns
directly from columns/values used by the original VPMap and VPVisit projects. Since
these data were not normalized, we initially imported all data as-is without attempting
to create and enforce foreign keys for eg. 'mappedByUser' and 'visitUser'. We did,
however, create and enforce constraints on mappedPoolId, visitId, etc.

There was not the concept of a VPReview in the original projects. Instead, the review of
pools for validity was a necessary process appended to both the VPMap and VPVisit projects.
We invented VPReview to formalize that process and encapsulate the functions and data that
apply to it. A VPReview is a set of admin Q&A inputs that determine the ultimate status of
a pool, recorded in the table vpreview and referencing a mappedPoolId and a visitId. There
can be multiple Reviews of each Visit.

Once we had all the data in the tables vpmapped and vpvisit with mappedPoolIds, visitIds,
etc. and released the product, subsequent development attempted to normalize data. A
problem, again with eg. users, is the UX does not enforce the selection of valid VPAtlas
users since this was undesirable.

Further, with the addition of VPMon which identifies 'Observers' by name, we introduced more
non-normalized user data, among other isseus like equipment types and statuses, etc.

We invented an ad-hoc solution to this problem: for each non-normal data element, create 2
columns: the raw value, and its foreign Key. The FK references a foreign table but is not
required. We attempt to force a Unique value on the raw value (eg. email address for
observers) but we do not use that raw value as the foreign key (so that eg. users can
change email addresses over time). Then we create DB Triggers to match raw values against
foreign table data, on Insert and Update, to find foreign key values and insert them when
they're found. Over time, this will 'heal' the database towards normalized data.

Upgrade scripts are postgres executable files with leading numbers corresponding to a
database version number found in db_upgrade.
*/
