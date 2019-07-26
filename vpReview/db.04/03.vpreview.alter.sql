--KWN500	ERROR_Eliminate	Eliminate
--MLS103	ERROR_LocAcc	Potential
--MLS1794	ERROR_LocAcc	Potential
--MLS1926	ERROR_LocAcc	Potential
--NEW171	ERROR_LocAcc	Potential
--NEW291	ERROR_Eliminate	Eliminate
--NEW344	ERROR_Eliminate	Eliminate
--NEW350	ERROR_Eliminate	Eliminate
--NEW39		ERROR_Eliminate	Eliminate
--SDF329	ERROR_LocAcc	Potential

UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='KWN500';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='MLS103';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='MLS1794';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='MLS1926';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='NEW171';
UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='NEW291';
UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='NEW344';
UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='NEW350';
UPDATE vpreview SET "reviewQACode"='ERROR_Eliminate' WHERE "reviewPoolId"='NEW39';
UPDATE vpreview SET "reviewQACode"='ERROR_LocAcc' WHERE "reviewPoolId"='SDF329';

UPDATE vpmapped SET "mappedPoolStatus"='Potential' WHERE "mappedPoolId" IN (
'MLS103',
'MLS1794',
'MLS1926',
'NEW171',
'SDF329'
);
UPDATE vpmapped SET "mappedPoolStatus"='Eliminated' WHERE "mappedPoolId" IN (
'KWN500',
'NEW291',
'NEW344',
'NEW350',
'NEW39'
);
