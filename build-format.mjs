import { readFile, writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import ejs from 'ejs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const build = async () => {
  const templatePath = path.join(__dirname, 'template.ejs')
  const mainPath = path.join(__dirname, 'apps', 'campfire', 'dist', 'main.js')
  const [template, script] = await Promise.all([
    readFile(templatePath, 'utf8'),
    readFile(mainPath, 'utf8')
  ])

  const pkgPath = path.join(__dirname, 'package.json')
  let pkg
  try {
    pkg = JSON.parse(await readFile(pkgPath, 'utf8'))
  } catch (error) {
    throw new Error(
      `Failed to parse package.json at ${pkgPath}: ${error.message}`
    )
  }

  const html = ejs.render(template, { script })
  const outPath = path.join(__dirname, 'dist', 'format.js')

  await mkdir(path.dirname(outPath), { recursive: true })

  const formatData = {
    name: pkg.name,
    description: pkg.description,
    author: pkg.author,
    version: pkg.version,
    source: html
  }

  const output = `window.storyFormat(${JSON.stringify(formatData)})`
  await writeFile(outPath, output)
}

build().catch(error => {
  console.error('Error during build process:', error)
})
