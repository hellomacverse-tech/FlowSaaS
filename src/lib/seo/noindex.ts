const TRACKING = /^(utm_[a-z]+|gclid|fbclid|msclkid|ref|_ga|mc_[a-z]+)$/i;
const FILTERABLE = /^\/(workflows|categories\/[a-z0-9-]+|integrations|case-studies)$/;

/** True when the URL is a filter/sort/search/page variant of an otherwise-indexable listing. */
export function shouldNoindex(pathname: string, params: URLSearchParams): boolean {
  if (!FILTERABLE.test(pathname)) return false;
  for (const key of params.keys()) if (!TRACKING.test(key)) return true;
  return false;
}
