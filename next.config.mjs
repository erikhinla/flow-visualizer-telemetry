const basePath = process.env.PROOF_BASE_PATH ?? '';
if (basePath !== '' && basePath !== '/proof/screen') {
  throw new Error('PROOF_BASE_PATH must be empty or /proof/screen');
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath,
  env: { NEXT_PUBLIC_PROOF_BASE_PATH: basePath },
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
