/**
 * A layout's `{% set %}` cannot reach the page content: Eleventy renders the
 * content first and only then wraps it in the layout. Anything the body
 * partials need — the translation bundle, the URLs of the current page and of
 * its counterpart in the other language — has to be computed data instead.
 */
const path = (locale, slug) => `/${locale}/${slug ? slug + "/" : ""}`;

export default {
  t: (data) => (data.i18n && data.locale ? data.i18n[data.locale] : undefined),
  homeUrl: (data) => (data.locale ? path(data.locale) : "/"),
  altEn: (data) => (data.cat ? path("en", data.cat.en.slug) : "/en/"),
  altFr: (data) => (data.cat ? path("fr", data.cat.fr.slug) : "/fr/"),
  selfUrl: (data) => {
    if (!data.locale) return "/";
    return data.cat ? path(data.locale, data.cat[data.locale].slug) : path(data.locale);
  },
};
