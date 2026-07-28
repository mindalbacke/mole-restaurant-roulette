/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  async redirects() {
    return [
      {
        source: "/",
        destination: "/index.html",
        permanent: false
      }
    ];
  }
};

export default nextConfig;
