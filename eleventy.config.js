/**
 * The site is served from a sub-path on GitHub Pages (/uaesourcing/) but from
 * the root on any real domain. Every internal link therefore goes through the
 * `url` filter, and PATH_PREFIX is set by the deploy workflow.
 */
import Image from "@11ty/eleventy-img";
import path from "node:path";

const PATH_PREFIX = process.env.PATH_PREFIX || "/uaesourcing/";
const SITE_ORIGIN = (process.env.SITE_ORIGIN || "https://enzoprat.github.io").replace(/\/$/, "");

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
    const metadata = await Image(file, {
      widths: [320, 640, 960, 1206],
      formats: ["avif", "webp", "jpeg"],
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

  eleventyConfig.addGlobalData("origin", SITE_ORIGIN);
  eleventyConfig.addGlobalData("buildDate", () => new Date().toISOString().slice(0, 10));

  return {
    pathPrefix: PATH_PREFIX,
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
