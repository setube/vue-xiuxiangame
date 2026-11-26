import { fileURLToPath } from 'node:url'
import { parse } from 'vue/compiler-sfc'
import { invariant } from '../src/utils/assert'

const root = new URL('../', import.meta.url)

export async function assertProjectFiles(): Promise<number> {
  const config: unknown = await Bun.file(new URL('tsconfig.json', root)).json()
  invariant(typeof config === 'object' && config !== null && 'compilerOptions' in config, 'TypeScript config is required')
  const options = config.compilerOptions
  invariant(typeof options === 'object' && options !== null && 'strict' in options && options.strict === true, 'Strict TypeScript checks must stay enabled')

  const manifest: unknown = await Bun.file(new URL('package.json', root)).json()
  invariant(typeof manifest === 'object' && manifest !== null && 'packageManager' in manifest && typeof manifest.packageManager === 'string' && manifest.packageManager.startsWith('bun@'), 'The package manager must be Bun')
  invariant(await Bun.file(new URL('bun.lock', root)).exists(), 'A committed Bun lockfile is required')
  for (const stale of ['package-lock.json', 'yarn.lock', 'pnpm-lock.yaml']) {
    invariant(!await Bun.file(new URL(stale, root)).exists(), `Remove the obsolete lockfile: ${stale}`)
  }

  let checked = 0
  const glob = new Bun.Glob('{src,tests,scripts}/**/*.{ts,js,vue}')
  for await (const path of glob.scan({ cwd: fileURLToPath(root), onlyFiles: true })) {
    invariant(!path.endsWith('.js'), `Project source must be TypeScript: ${path}`)
    const source = await Bun.file(new URL(path.replaceAll('\\', '/'), root)).text()
    if (!path.endsWith('.d.ts')) {
      invariant(!new RegExp('@' + 'ts-(?:nocheck|ignore)').test(source), `Do not bypass type checks: ${path}`)
    }
    if (path.endsWith('.vue')) {
      const { descriptor, errors } = parse(source, { filename: path })
      invariant(errors.length === 0, `Invalid Vue source: ${path}`)
      for (const script of [descriptor.script, descriptor.scriptSetup]) {
        invariant(!script || script.lang === 'ts', `Vue scripts must use lang="ts": ${path}`)
      }
    }
    checked++
  }
  invariant(checked > 0, 'The source assertion scan must include project files')
  invariant(!await Bun.file(new URL('vite.config.js', root)).exists(), 'Vite config must be TypeScript')
  return checked
}

if (import.meta.main) console.log(`Verified ${await assertProjectFiles()} TypeScript project files.`)
