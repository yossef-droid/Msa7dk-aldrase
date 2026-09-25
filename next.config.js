/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // The application validates the same 50MB maximum in app/actions/files.js.
      bodySizeLimit: "50mb",
    },
  },
};

module.exports = nextConfig;
