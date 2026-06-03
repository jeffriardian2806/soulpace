import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/moderation"],
    },
    sitemap: "https://soulpace.vercel.app/sitemap.xml",
  };
}
