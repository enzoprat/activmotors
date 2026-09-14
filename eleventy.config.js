/**
 * Defaults describe production — the real domain, served from its root — so a
 * build with no environment set is correct by default. The GitHub Pages
 * workflow overrides them, because a project site lives under a sub-path.
 * Every internal link goes through the `url` filter so the prefix applies.
 */
import Image from "@11ty/eleventy-img";
import path from "node:path";

const PATH_PREFIX = process.env.PATH_PREFIX || "/";
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://www.activamotors.com").replace(/\/$/, "");
// The Pages copy is the same content at another address; letting it be indexed
// would put it in competition with the real domain.
const NOINDEX = process.env.NOINDEX === "true";

export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/_redirects": "_redirects" });

  // The CMS admin is copied as-is; it must not be parsed as a Nunjucks template.
  eleventyConfig.ignores.add("src/admin/**");

  // Builds a tel: href from whatever the client typed, so there is only ever
  // one phone number to edit in the CMS.
  eleventyConfig.addFilter("telLink", (phone) => "tel:" + String(phone).replace(/[^\d+]/g, ""));

  // Absolute URL for canonical, hreflang, Open Graph and the sitemap, which
  // all require one. Takes a site-root path and applies the path prefix.
  eleventyConfig.addFilter("absUrl", (path) => {
    const prefixed = ("/" + PATH_PREFIX + "/" + String(path)).replace(/\/{2,}/g, "/");
    return SITE_ORIGIN + prefixed;
  });

  eleventyConfig.addFilter("jsonld", (value) => JSON.stringify(value, null, 0).replace(/</g, "\\u003c"));

  // Turns the plain q/a pairs in categories.js into schema.org FAQPage entities.
  eleventyConfig.addFilter("faqSchema", (faq) => (faq || []).map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })));

  /**
   * Responsive <picture> for the client's photographs. They arrive at 1206px
   * but are shown at roughly 280px in the home cards and 490px on a category
   * page, so serving the original is most of the page weight for nothing.
   * `sizes` must describe the real slot or the browser picks too large a file.
   */
  eleventyConfig.addAsyncShortcode("picture", async function (src, alt, sizes, opts = {}) {
    const file = path.join("src", src.replace(/^\//, ""));
    // A transparent source needs a PNG fallback: JPEG has no alpha channel and
    // would fill the cut-out with solid black.
    const transparent = /\.png$/i.test(file);
    const metadata = await Image(file, {
      widths: [320, 640, 960, 1206],
      formats: ["avif", "webp", transparent ? "png" : "jpeg"],
      outputDir: "_site/assets/img/optimised/",
      urlPath: PATH_PREFIX.replace(/\/$/, "") + "/assets/img/optimised/",
      sharpJpegOptions: { quality: 78, progressive: true },
    });
    return Image.generateHTML(metadata, {
      alt,
      sizes,
      loading: opts.eager ? "eager" : "lazy",
      decoding: "async",
      ...(opts.eager ? { fetchpriority: "high" } : {}),
    });
  });

  // A raw ISO date on a legal page reads as unfinished.
  eleventyConfig.addFilter("localDate", (iso, locale) =>
    new Date(iso + "T00:00:00Z").toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
      day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
    })
  );

  // The wordmark picks out one letter in gold. Keeping the letter in data
  // rather than hardcoding an index means a future rename does not break it.
  eleventyConfig.addFilter("accentLetter", (name, letter) => {
    const s = String(name);
    if (!letter) return s;
    const i = s.indexOf(letter);
    if (i < 0) return s;
    return s.slice(0, i) + '<i class=\"logo__accent\">' + s[i] + '</i>' + s.slice(i + 1);
  });

  eleventyConfig.addGlobalData("origin", SITE_ORIGIN);
  eleventyConfig.addGlobalData("noindex", NOINDEX);
  eleventyConfig.addGlobalData("buildDate", () => new Date().toISOString().slice(0, 10));

  return {
    pathPrefix: PATH_PREFIX,
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
