import { spawnSync } from "node:child_process"
import { copyFileSync, existsSync, readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
process.chdir(fileURLToPath(new URL("../", import.meta.url)))
function run(program, args) {
  const result = spawnSync(program, args, {stdio: "inherit"})
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status ?? 1)
}
run("python", ["scripts/repository.py", "--working"])
run("python", ["scripts/check.py"])
if (process.argv.includes("--dry-run")) process.exit(0)
run(process.execPath, ["quartz/bootstrap-cli.mjs", "build"])
copyFileSync("node_modules/mermaid/dist/mermaid.min.js", "public/static/mermaid.min.js")
for (const path of ["index.html", "404.html", "index.xml", "sitemap.xml", "tags/index.html", "static/contentIndex.json"]) {
  if (!existsSync("public/" + path)) throw Error("Missing " + path)
}
const index = JSON.parse(readFileSync("public/static/contentIndex.json", "utf8"))
const manifest = JSON.parse(readFileSync("content.lock.json", "utf8"))
for (const name of Object.keys(manifest).filter(name => name.endsWith(".md"))) {
  if (!index[name.slice(0,-3)]) throw Error("Missing search entry " + name)
}
console.log("Verified site, feeds, and search entries.")
run("python", ["scripts/output.py"])

