import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      /*
       * Server Actions cap request bodies at 1 MB by default, and the pet form
       * posts a photo. Anything larger was rejected before the action ran at
       * all, which surfaced as an unexplained 500 rather than a validation
       * message.
       *
       * 4 MB, not more: Vercel caps a function's request body at 4.5 MB, so a
       * larger value here would be fiction — the platform would reject the
       * upload first. The app's own photo and document limits match this, and
       * both forms check the size in the browser so an oversized file is
       * refused instantly rather than failing on the server.
       */
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
