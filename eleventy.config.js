export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });

  // The CMS admin is copied as-is; it must not be parsed as a Nunjucks template.
  eleventyConfig.ignores.add("src/admin/**");

  // Builds a tel: href from whatever the client typed, so there is only ever
  // one phone number to edit in the CMS.
  eleventyConfig.addFilter("telLink", (phone) => "tel:" + String(phone).replace(/[^\d+]/g, ""));

  // The CMS stores media as "/assets/...", but the site may be served from a
  // sub-path (GitHub Pages project sites). The single page lives at the root,
  // so a relative path resolves correctly under any base URL.
  eleventyConfig.addFilter("asset", (path) => String(path).replace(/^\//, ""));

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
}
