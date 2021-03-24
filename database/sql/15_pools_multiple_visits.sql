SELECT visits.*, mapped.* FROM vpmapped mapped INNER JOIN (
	SELECT vc.visit_count, v.* FROM vpvisit v INNER JOIN (
		SELECT
			"visitPoolId" as vcvpid, count("visitPoolId") as visit_count
		FROM
			vpvisit
		GROUP BY
			"visitPoolId"
		ORDER BY
			visit_count desc
		) as vc
	ON v."visitPoolId"=vcvpid
	WHERE vc.visit_count > 1
	ORDER BY vc.visit_count desc, v."visitPoolId"
) AS visits
ON mapped."mappedPoolId"=visits."visitPoolId"
