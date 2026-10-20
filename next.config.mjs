const basePath = process.env.PROOF_BASE_PATH ?? '';
if (!['', '/proof/screen', '/proof/screen-preview'].includes(basePath)) {
  throw new Error('PROOF_BASE_PATH must be empty, /proof/screen or /proof/screen-preview');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  env: {
    NEXT_PUBLIC_PROOF_BASE_PATH: basePath,
    NEXT_PUBLIC_PROOF_BOOKING_URL: process.env.PROOF_BOOKING_URL ?? '',
    NEXT_PUBLIC_PROOF_NOINDEX: basePath === '/proof/screen-preview' ? '1' : '',
  },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
