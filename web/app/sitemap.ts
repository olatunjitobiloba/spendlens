import type { MetadataRoute } from "next";

import { siteConfig } from "@/configs/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: siteConfig.url, changeFrequency: "weekly", priority: 1 }];
}
