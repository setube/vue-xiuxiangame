import { readFile } from 'node:fs/promises'
import { Script } from 'node:vm'
import { compileScript, parse } from 'vue/compiler-sfc'
import { transformWithEsbuild } from 'vite'

const root = new URL('../../', import.meta.url)

// Execute the real script setup with replaceable browser/UI boundaries. Vue refs
// and computed values remain real, so tests exercise the component state changes.
export const loadView = async (relativePath, { imports = {}, globals = {} } = {}) => {
  const filename = new URL(relativePath, root)
  const source = await readFile(filename, 'utf8')
  const { descriptor, errors } = parse(source, { filename: filename.pathname })
  if (errors.length) throw errors[0]
  const compiled = compileScript(descriptor, { id: relativePath })
  const modules = new Map()

  for (const statement of compiled.scriptSetupAst) {
    if (statement.type !== 'ImportDeclaration') continue
    const specifier = statement.source.value
    if (specifier === 'vue') {
      modules.set(specifier, { ...await import('vue'), ...imports.vue })
    } else if (Object.hasOwn(imports, specifier)) {
      modules.set(specifier, imports[specifier])
    } else if (specifier.endsWith('.vue')) {
      modules.set(specifier, { default: {} })
    } else if (specifier.startsWith('@/')) {
      const path = specifier.slice(2)
      modules.set(specifier, await import(new URL(`src/${path}${path.endsWith('.js') ? '' : '.js'}`, root)))
    } else {
      modules.set(specifier, await import(specifier))
    }
  }

  const { code } = await transformWithEsbuild(compiled.content, 'view.js', { format: 'cjs', target: 'es2022' })
  const module = { exports: {} }
  new Script(code, { filename: filename.pathname }).runInNewContext({
    module,
    exports: module.exports,
    require: specifier => {
      if (!modules.has(specifier)) throw new Error(`Unexpected import: ${specifier}`)
      return { __esModule: true, ...modules.get(specifier) }
    },
    console,
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    ...globals
  })
  return module.exports.default
}
