import type { NextConfig } from "next";

const devDomain = process.env.REPLIT_DEV_DOMAIN ?? "";
const replitDomains = (process.env.REPLIT_DOMAINS ?? "").split(",").map((d) => d.trim()).filter(Boolean);

const extraOrigins = [
  devDomain,
  ...replitDomains,
].filter(Boolean);

const nextConfig: NextConfig = {
  reactCompiler: true,
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: [
    "*.riker.replit.dev",
    "*.replit.dev",
    "*.worf.replit.dev",
    ...extraOrigins,
  ],
};

export default nextConfig;
