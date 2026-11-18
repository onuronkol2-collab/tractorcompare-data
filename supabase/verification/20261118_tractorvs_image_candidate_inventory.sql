-- READ ONLY: public and draft tractor photo research backlog.
SELECT
  t.status AS tractor_status,
  count(*) AS tractors,
  count(*) FILTER(WHERE EXISTS(
    SELECT 1 FROM public.tractorvs_image_candidates i
    WHERE i.tractor_id=t.id AND i.status='approved'
  )) AS with_approved_photo,
  count(*) FILTER(WHERE EXISTS(
    SELECT 1 FROM public.tractorvs_image_candidates i
    WHERE i.tractor_id=t.id AND i.status='research_needed'
  )) AS awaiting_research
FROM public.tractors t
GROUP BY t.status
ORDER BY t.status;

SELECT b.name AS brand,t.model_name,t.variant,t.market,t.status,
  count(i.id) FILTER(WHERE i.status='approved') AS approved_images,
  count(i.id) FILTER(WHERE i.status NOT IN ('approved','rejected')) AS pending_images
FROM public.tractors t
JOIN public.brands b ON b.id=t.brand_id
LEFT JOIN public.tractorvs_image_candidates i ON i.tractor_id=t.id
WHERE t.status IN ('published','draft')
GROUP BY b.name,t.id
ORDER BY CASE t.status WHEN 'published' THEN 0 ELSE 1 END,b.name,t.model_name;
