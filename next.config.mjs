/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    // Baseline: block embedding + object/plugin content. A full script-src
    // policy needs nonce plumbing through Next — deferred deliberately.
    value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
  },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // motion isn't in Next's default optimize list; lucide-react already is.
    optimizePackageImports: ["motion"],
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
