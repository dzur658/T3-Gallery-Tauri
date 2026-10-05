/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    output: "export",
    images: {
        // No image optimization needed since images are fetched from localhost
        unoptimized: true,
    },
};

export default config;
