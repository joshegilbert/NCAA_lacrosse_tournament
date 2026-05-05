/**
 * Downloads NCAA team logos from ESPN CDN into client/public/logos/{slug}.png
 * Source map: server/data/team-logo-sources.json (slug -> espnNcaaId)
 *
 * Usage (from repo root): cd server && node scripts/download-team-logos.mjs
 * Overwrite existing: node scripts/download-team-logos.mjs --force
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const force = process.argv.includes('--force')
const repoRoot = path.join(__dirname, '../..')
const sourcesPath = path.join(__dirname, '../data/team-logo-sources.json')
const outDir = path.join(repoRoot, 'client/public/logos')
const BASE = 'https://a.espncdn.com/i/teamlogos/ncaa/500'

async function main() {
  const raw = fs.readFileSync(sourcesPath, 'utf8')
  const sources = JSON.parse(raw)
  if (typeof sources !== 'object' || sources === null) {
    throw new Error('team-logo-sources.json must be a JSON object of slug -> id')
  }

  fs.mkdirSync(outDir, { recursive: true })

  let ok = 0
  let skipped = 0
  let failed = 0

  for (const [slug, espnId] of Object.entries(sources)) {
    const id = Number(espnId)
    if (!Number.isFinite(id)) {
      console.error(`FAIL ${slug}: invalid id ${espnId}`)
      failed += 1
      continue
    }

    const dest = path.join(outDir, `${slug}.png`)
    if (!force && fs.existsSync(dest)) {
      console.log(`skip ${slug} (exists, use --force)`)
      skipped += 1
      continue
    }

    const url = `${BASE}/${id}.png`
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`FAIL ${slug} id=${id} HTTP ${res.status}`)
      failed += 1
      continue
    }

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 500) {
      console.error(`FAIL ${slug}: response too small (${buf.length} bytes), likely not a PNG`)
      failed += 1
      continue
    }

    fs.writeFileSync(dest, buf)
    console.log(`ok   ${slug} <- ${id} (${buf.length} bytes)`)
    ok += 1
  }

  console.log(`\nDone: ${ok} downloaded, ${skipped} skipped, ${failed} failed`)
  if (failed) process.exitCode = 1
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
