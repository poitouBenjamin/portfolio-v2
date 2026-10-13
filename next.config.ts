import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Captures des esquisses : Chromium allégé, chargé depuis ses fichiers compressés
  outputFileTracingIncludes: {
    "/api/brief": ["./node_modules/@sparticuz/chromium/bin/**/*"],
    "/api/esquisses/regenerate": ["./node_modules/@sparticuz/chromium/bin/**/*"],
  },
};

export default createNextIntlPlugin()(nextConfig);
