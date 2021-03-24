ALTER TABLE vpvisit DROP COLUMN "visitTownName";
ALTER TABLE vpvisit DROP COLUMN "visitIdLegacy";

SELECT "visitId",
"visitLocationComments",
"visitDirections",
"visitHabitatComment",
"visitSpeciesOther1",
"visitSpeciesOther2",
"visitSpeciesComments",
"visitSpsNotes",
"visitJesaNotes",
"visitBssaNotes",
"visitFairyShrimpNotes",
"visitFingerNailClamsNotes",
"visitSpeciesOtherNotes"
from vpvisit where
"visitLocationComments" like '%"%' OR
"visitDirections" like '%"%' OR
"visitHabitatComment" like '%"%' OR
"visitSpeciesOther1" like '%"%' OR
"visitSpeciesOther2" like '%"%' OR
"visitSpeciesComments" like '%"%' OR
"visitSpsNotes" like '%"%' OR
"visitJesaNotes" like '%"%' OR
"visitBssaNotes" like '%"%' OR
"visitFairyShrimpNotes" like '%"%' OR
"visitFingerNailClamsNotes" like '%"%' OR
"visitSpeciesOtherNotes" like '%"%' OR
"visitWoodFrogNotes" like '%"%';

UPDATE vpvisit SET
"visitLocationComments" = replace("visitLocationComments", '"',''),
"visitDirections" = replace("visitDirections", '"',''),
"visitHabitatComment" = replace("visitHabitatComment", '"',''),
"visitSpeciesOther1" = replace("visitSpeciesOther1", '"',''),
"visitSpeciesOther2" = replace("visitSpeciesOther2", '"',''),
"visitSpeciesComments" = replace("visitSpeciesComments", '"',''),
"visitSpsNotes" = replace("visitSpsNotes", '"',''),
"visitJesaNotes" = replace("visitJesaNotes", '"',''),
"visitBssaNotes" = replace("visitBssaNotes", '"',''),
"visitFairyShrimpNotes" = replace("visitFairyShrimpNotes", '"',''),
"visitFingerNailClamsNotes" = replace("visitFingerNailClamsNotes", '"',''),
"visitSpeciesOtherNotes" = replace("visitSpeciesOtherNotes", '"',''),
"visitWoodFrogNotes" = replace("visitWoodFrogNotes", '"','');
