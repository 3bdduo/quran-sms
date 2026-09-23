import type { NextConfig } from "next";

const isGithubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  ...(isGithubPages
    ? {
        output: "export",
        basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/quran-sms",
        trailingSlash: true,
        images: { unoptimized: true },
      }
    : {
        images: {
          remotePatterns: [{ protocol: "https", hostname: "**" }],
        },
      }),
};

export default nextConfig;
