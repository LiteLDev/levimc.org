import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Served as plain files from GitHub Pages: every route is prerendered at
  // build time and there is no server to rewrite or resize anything.
  output: "export",
  // `/packages/<tooth>/index.html` rather than `/packages/<tooth>.html`, since
  // a tooth may contain dots that would read as a file extension.
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
