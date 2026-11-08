/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    // Optional free-tier integrations. When absent the site stays 100% static.
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_ENROLL_WEBHOOK: process.env.NEXT_PUBLIC_ENROLL_WEBHOOK || '',
    NEXT_PUBLIC_VERIFY_HMAC_KEY: process.env.NEXT_PUBLIC_VERIFY_HMAC_KEY || 'oryx-institute-2026-stateless-verify'
  }
};

export default nextConfig;
