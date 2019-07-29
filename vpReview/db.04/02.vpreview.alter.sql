ALTER TABLE vpreview ADD COLUMN "reviewPoolStatus" poolstatus;

--vpreview QA Code values:

--'PROB-OTHER'
--'NOT FOUND'
--'CONF'
--'PROB-VPMP'
--'NOT POOL'
--'LANDOWNER'
--'ERROR'
--'DUPLICATE'

--ENUM TYPE poolstatus values:

--('Potential', 'Probable', 'Confirmed', 'Eliminated', 'Duplicate');

--QA Codes with clear poolstatus translation:
UPDATE vpreview SET "reviewPoolStatus" = 'Confirmed' WHERE "reviewQACode"='CONF'; --685
UPDATE vpreview SET "reviewPoolStatus" = 'Probable' WHERE "reviewQACode"='PROB-OTHER'; --510
UPDATE vpreview SET "reviewPoolStatus" = 'Probable' WHERE "reviewQACode"='PROB-VPMP'; --8
UPDATE vpreview SET "reviewPoolStatus" = 'Eliminated' WHERE "reviewQACode"='NOT POOL'; --238
UPDATE vpreview SET "reviewPoolStatus" = 'Duplicate' WHERE "reviewQACode"='DUPLICATE'; --67

--QA Codes with unclear poolstatus translation:

--NOT FOUND (Pool not found at location)
-- The pool was not located at the location anticipated. This typically resulted from a remote
-- mapping error such as tree shadow, ledge, or other confusing photo signature.
-- Result is to Eliminate this "pool".
UPDATE vpreview SET "reviewPoolStatus" = 'Eliminated' WHERE "reviewQACode"='NOT FOUND'; --88

--LANDOWNER (Landowner restrictions on data distribution).
-- Assigned when a landowner specifically requested that information on a pool on their property
-- NOT be made public. For the purposes of data distribution, these pools are not considered
-- Confirmed. Keep as Potential.
-- NOTES:
--We need a different flag (not poolstatus) to flag non-permission/hidden pools, because pool
--status is distinct from landowner permission, especially over time.
UPDATE vpreview SET "reviewPoolStatus" = 'Potential' WHERE "reviewQACode"='LANDOWNER'; --69

--ERROR (Data entry error).
-- Assigned when QA review is unable to determine the appropriate code from the list above.
-- Typically used with incomplete or very inconsistent entries without sufficient explanation.
-- Keep as Potential.
UPDATE vpreview SET "reviewPoolStatus" = 'Potential' WHERE "reviewQACode"='ERROR'; --10

--TODO: set reviewVisitId to vpvisit.visitId using reviewVisitIdLegacy, then add a foreign
-- constraint on vpreview.reviewVisitId.
