import { readFile } from 'node:fs/promises'

async function assert(condition, message) {
  if (!condition) {
    throw new Error(message)
  }
}

async function main() {
  const appPage = await readFile('app/page.tsx', 'utf8')
  await assert(
    !appPage.includes("export const runtime = 'edge'") && !appPage.includes('export const runtime = "edge"'),
    "app/page.tsx must not export runtime='edge' because it can break OpenNext Workers runtime and cause landing-page 500s.",
  )

  const packageJson = JSON.parse(await readFile('package.json', 'utf8'))
  const previewScript = packageJson.scripts?.['preview:cloudflare'] ?? ''
  await assert(
    previewScript.includes('wrangler dev .open-next/worker.js'),
    'package.json preview:cloudflare must run wrangler dev .open-next/worker.js for Workers-runtime parity.',
  )

  const nextConfig = await readFile('next.config.ts', 'utf8')
  await assert(
    nextConfig.includes('grindroom.nishantborse-2008.workers.dev'),
    'next.config.ts serverActions.allowedOrigins must include grindroom.nishantborse-2008.workers.dev.',
  )

  console.log('[workers-guard] app/page.tsx runtime config OK')
  console.log('[workers-guard] preview:cloudflare script OK')
  console.log('[workers-guard] allowedOrigins workers host OK')
}

main().catch((error) => {
  console.error('[workers-guard] FAILED')
  console.error(error.message)
  process.exitCode = 1
})
