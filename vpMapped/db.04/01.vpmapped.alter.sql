
SELECT 
	vpreview."reviewId",
	vpreview."reviewPoolId",
	vpreview."reviewPoolStatus" ,
	vpmapped."mappedPoolId",
	vpmapped."mappedPoolStatus"
FROM vpreview 
	 INNER JOIN vpmapped ON vpmapped."mappedPoolId"=vpreview."reviewPoolId";

--don't use INNER JOIN on update with inner select. doesn't work.
--this sets all non-joined rows' mappedPoolStatus to null.

--UPDATE vpmapped SET "mappedPoolStatus" = 
	(SELECT review."reviewPoolStatus" FROM 
		(SELECT * FROM vpreview 
		 WHERE vpmapped."mappedPoolId"=vpreview."reviewPoolId" limit 1) AS review
	);
	 
SELECT "mappedPoolId","mappedPoolStatus",* FROM vpmapped WHERE "mappedPoolStatus" IS NULL;
--UPDATE vpmapped SET "mappedPoolStatus"='Potential' WHERE "mappedPoolStatus" IS NULL; --3572

SELECT * FROM vpmapped WHERE "mappedPoolId" LIKE '%KWN%' AND "mappedPoolStatus"='Potential';
--UPDATE vpmapped SET "mappedPoolStatus"='Probable' WHERE
 "mappedPoolId" LIKE '%KWN%' AND "mappedPoolStatus" = 'Potential'; --389
