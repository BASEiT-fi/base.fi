const pluginRss = require("@11ty/eleventy-plugin-rss"); // needed for absoluteUrl feature
const eleventyNavigationPlugin = require("@11ty/eleventy-navigation");
const i18n = require("eleventy-plugin-i18n");
const translations = require("./src/_data/i18n");
const sass = require("sass");
const postcss = require("postcss");
const autoprefixer = require("autoprefixer");
const fs = require("fs-extra");

module.exports = function (eleventyConfig) {
  // Site title
  // TODO: implement when available in v.1.0.0
  // eleventyConfig.addGlobalData("siteTitle", "Plain Bootstrap5");

  // Add plugins
  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addPlugin(eleventyNavigationPlugin);
  eleventyConfig.addPlugin(i18n, {
    translations,
    fallbackLocales: {
      "*": "en-GB",
    },
  });

  // SASS (dart-sass) and postcss auto vendor prefixing
  // thanks to https://www.d-hagemeier.com/de/sass-compile-11ty/
  // auto prefixing is needed, see: https://getbootstrap.com/docs/5.0/getting-started/download/#source-files
  eleventyConfig.on("beforeBuild", () => {
    const isProd = process.env.ELEVENTY_ENV === "production";

    // Compile Sass
    // TODO: don't use compressed for dev?
    let result = sass.renderSync({
      file: "src/assets/styles/main.scss",
      sourceMap: true,
      outputStyle: "compressed",
    });

    // Optimize and write file with PostCSS
    let css = result.css.toString();
    postcss([autoprefixer])
      .process(css, {
        from: "assets/styles/main.css",
        to: "asset/styles/main.css",
      })
      .then((result) => {
        fs.outputFile("_site/assets/styles/main.css", result.css, (err) => {
          if (err) throw err;
        });
      });
  });

  // copy bootstrap js files
  // See: https://getbootstrap.com/docs/5.0/getting-started/contents/#js-files
  eleventyConfig.addPassthroughCopy({
    "node_modules/bootstrap/dist/js/": "/assets/scripts/bootstrap/",
  });

  // Pass-through files (copy them into to _site/ to make them available)
  // TODO: add them as well
  eleventyConfig.addPassthroughCopy("src/robots.txt");
  eleventyConfig.addPassthroughCopy("src/site.webmanifest");
  eleventyConfig.addPassthroughCopy("src/assets/favicons");
  eleventyConfig.addPassthroughCopy("src/assets/images");
  eleventyConfig.addPassthroughCopy("src/assets/fonts");
  eleventyConfig.addPassthroughCopy("src/assets/scripts/");
  eleventyConfig.addPassthroughCopy("src/assets/svgs");
  eleventyConfig.addPassthroughCopy("src/assets/docs");
  eleventyConfig.addPassthroughCopy("src/assets/videos");
  eleventyConfig.addPassthroughCopy({
    "node_modules/headroom.js/dist/headroom.min.js": "/assets/scripts/vendor.headroom.min.js",
    "node_modules/aos/dist/aos.js": "/assets/scripts/vendor.aos.js",
    "node_modules/tiny-slider/dist/min/tiny-slider.js": "/assets/scripts/vendor.tiny-slider.js",
    "node_modules/plyr/dist/plyr.polyfilled.min.js": "/assets/scripts/vendor.plyr.polyfilled.min.js",
    "node_modules/flexsearch/dist/flexsearch.bundle.js": "/assets/scripts/vendor.flexsearch.bundle.js",
  });

  // Watch target for local dev
  eleventyConfig.addWatchTarget("./src/assets");

  // RandomId function for IDs used by labelled-by
  // Thanks https://github.com/mozilla/nunjucks/issues/724#issuecomment-207581540
  // TODO: replace with addNunjucksGlobal? https://github.com/11ty/eleventy/issues/1498
  eleventyConfig.addFilter("generateRandomIdString", function (prefix) {
    return prefix + "-" + Math.floor(Math.random() * 1000000);
  });

  // TEMP demo of what could be an i18n-aware plural package?
  eleventyConfig.addFilter("pluralize", function (term, count = 1) {
    // Poorman's pluralize for now...
    return count === 1 ? term : `${term}s`;
  });

  // Check if pathPrefix is set via env
  // subpath needed for github pages e.g. user.github.com/<PATH-PREFIX>/index.html
  // if you need subdirectory for deployment,
  // add it via env var (see github pipeline)
  let customPathPrefix = "";
  if (process.env.hasOwnProperty("ELEVENTY_PATH_PREFIX")) {
    customPathPrefix = process.env.ELEVENTY_PATH_PREFIX;
  }

  // Browsersync
  // Redirect from root to default language root during --serve
  // Can also be handled by netlify.toml?
  eleventyConfig.setBrowserSyncConfig({
    callbacks: {
      ready: function (err, bs) {
        bs.addMiddleware("*", (req, res) => {
          if (req.url === "/") {
            res.writeHead(302, {
              location: "/en-gb/",
            });
            res.end();
          }
        });
      },
    },
  });

  // Base Config
  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes", // this path is releative to input-path (src/)
      layouts: "_layouts", // this path is releative to input-path (src/)
      data: "_data", // this path is releative to input-path (src/)
    },
    templateFormats: [
      "njk",
      // "md"
    ],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",

    pathPrefix: customPathPrefix,
  };
};
