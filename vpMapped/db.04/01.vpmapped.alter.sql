--don't use INNER JOIN on inner select. doesn't work.
--this sets all non-joined rows' mappedPoolStatus to null.
UPDATE vpmapped SET "mappedPoolStatus" = 
	(SELECT review."reviewPoolStatus" FROM 
		(SELECT * FROM vpreview 
		 WHERE vpmapped."mappedPoolId"=vpreview."reviewPoolId" limit 1) AS review
	);

--assuming all nulls were already Potential, this works.
--probably not, so use the previous method - KWN* pools are 'Probable'?
UPDATE vpmapped SET "mappedPoolStatus"='Potential' WHERE "mappedPoolStatus" IS NULL; --3572
