import type { APIRoute } from "astro";
import { getPublicCatalog } from "../../../lib/catalog";
import { comparisonSpecs } from "../../../lib/comparison-specs";
import { LOCALES } from "../../../lib/locales";

export async function getStaticPaths() {
  const catalog = await getPublicCatalog();
  return LOCALES.flatMap(lang => catalog.tractors.map(tractor => ({
    params: {lang, id: tractor.tractor_id},
    props: {lang, tractor},
  })));
}

export const GET: APIRoute = ({props}) =>
  Response.json(comparisonSpecs(props.tractor, props.lang));
