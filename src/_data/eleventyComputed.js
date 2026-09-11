/**
 * A layout's `{% set %}` cannot reach the page content: Eleventy renders the
 * content first and only then wraps it in the layout. Anything the body
 * partials need — the translation bundle, the URLs of the current page and of
 * its counterpart in the other language — has to be computed data instead.
 *
 * Pages that are neither the home page nor a category (the legal pages) declare
 * their own pair of URLs through `altOverride` in their front matter.
 */
const path = (locale, slug) => `/${locale}/${slug ? slug + "/" : ""}`;

const alt = (data, locale) => {
  if (data.altOverride) return data.altOverride[locale];
  if (data.cat) return path(locale, data.cat[locale].slug);
  return path(locale);
};

export default {
  t: (data) => (data.i18n && data.locale ? data.i18n[data.locale] : undefined),
  homeUrl: (data) => (data.locale ? path(data.locale) : "/"),
  altEn: (data) => alt(data, "en"),
  altFr: (data) => alt(data, "fr"),
  selfUrl: (data) => (data.locale ? alt(data, data.locale) : "/"),
};
