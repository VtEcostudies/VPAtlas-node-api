SELECT "reviewPoolId",
"reviewId",
"reviewQADate",
"reviewQANotes"
from vpreview where
"reviewQANotes" like '%"%';

UPDATE vpreview SET
"reviewQANotes" = replace("reviewQANotes", '"','''');
