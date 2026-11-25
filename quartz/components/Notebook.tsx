import { QuartzComponent } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
import { toString } from "hast-util-to-string"
import settings from "../../notebook.json"

const categories = settings.categories

const Notebook: QuartzComponent = ({ allFiles, fileData }) => {
  if (fileData.slug !== "index") return null
  const records = allFiles.filter(f => f.slug && f.slug !== "index")
  const notes = records.filter(f => f.frontmatter?.type !== "moc")
  const topics = records.filter(f => f.frontmatter?.type === "moc")
  const dateOf = (f: typeof notes[number]) => String(f.frontmatter?.updated ?? "").slice(0,10)
  notes.sort((a,b) => {
    const byTitle = String(a.frontmatter?.title).localeCompare(String(b.frontmatter?.title), "zh-CN")
    return settings.order === "按标题" ? byTitle : dateOf(b).localeCompare(dateOf(a)) || byTitle
  })
  const categoryOf = (f: typeof notes[number]) => {
    const meta = f.frontmatter
    const group = meta?.category
      ? categories.find(c => c.id === meta.category)
      : categories.find(c => c.types.includes(String(meta?.type)))
    return group?.name ?? "未分类"
  }
  const counts = new Map<string, number>()
  for (const f of notes) {
    const name = categoryOf(f)
    counts.set(name, (counts.get(name) ?? 0) + 1)
  }
  const names = categories.map(c => c.name)
  if (counts.has("未分类")) names.push("未分类")
  const groups = new Map<string, typeof notes>()
  for (const f of notes) {
    const month = settings.order === "按标题" ? "" : dateOf(f).slice(0, 7)
    if (!groups.has(month)) groups.set(month, [])
    groups.get(month)!.push(f)
  }
  function summary(f: typeof notes[number]) {
    if (f.frontmatter?.description) return f.frontmatter.description
    const blocks = (f.htmlAst?.children ?? []).filter(b => b.type === "element")
    for (const [i, block] of blocks.entries()) {
      if (block.type !== "element" || block.tagName !== "p") continue
      const text = toString(block).trim()
      const next = blocks[i + 1]
      if (/[：:]$/.test(text) && next?.type === "element" && next.tagName === "ul") {
        const items = next.children.filter(c => c.type === "element" && c.tagName === "li")
        const examples = items.slice(0, 3).map(c => toString(c).trim())
        if (examples.length && examples.join("").length < 90) {
          return text + examples.join("、") + (items.length > examples.length ? "等。" : "。")
        }
      }
      const first = text.match(/^.{4,220}?[。！？]|^.{4,220}?[.!?](?=\s|$)/u)
      if (first) return first[0]
    }
    return ""
  }
  const visible = names.filter(name => counts.has(name))
  const extra = [...visible.slice(3), ...names.filter(name => !counts.has(name))]
  const categoryButton = (name: string) => <button key={name} type="button" data-filter={name} aria-pressed="false">
    {name} <span>{counts.get(name) ?? 0}</span>
  </button>
  return <section class={records.length ? "notebook-index" : "notebook-index is-empty"}>
    <header class="notebook-heading">
      {!records.length && <div class="book-cover" aria-hidden="true"><span /></div>}
      <h1>{settings.heading}</h1>
      {!!notes.length && <button class="journal-search" type="button">搜索标题、标签或正文</button>}
      {settings.intro && <p class="notebook-intro">{settings.intro}</p>}
      {!notes.length && <p class="empty-message">还没有公开笔记。</p>}
    </header>
    {!!notes.length && <section class="notebook-catalog" aria-label="笔记列表">
      <div class="catalog-sidebar">
      <div class="category-filter" role="group" aria-label="按笔记分类筛选">
        <button type="button" data-filter="全部" aria-pressed="true">全部 <span>{notes.length}</span></button>
        {visible.slice(0,3).map(categoryButton)}
        {!!extra.length && <details class="more-categories"><summary>更多分类</summary><div>{extra.map(categoryButton)}</div></details>}
      </div>
      </div>
      <div class="catalog-main">
      {Array.from(groups, ([month, entries]) => <section class="journal-month" key={month}>
        <h2>{month ? month.slice(0,4) + " 年 " + Number(month.slice(5)) + " 月" : "全部笔记"}</h2>
        <ul>{entries.map(f => {
          const title = String(f.frontmatter?.title)
          const tags = (f.frontmatter?.tags ?? []).filter(t => t.toLowerCase() !== title.toLowerCase())
          const excerpt = summary(f)
          return <li key={f.slug} data-category={categoryOf(f)}>
            <time dateTime={dateOf(f)}>{month ? dateOf(f).slice(5).replace("-", ".") : dateOf(f)}</time>
            <div><small>{categoryOf(f)}</small>
              <h3><a class="internal" href={resolveRelative(fileData.slug!, f.slug!)}>{title}</a></h3>
              {excerpt && <p>{excerpt}</p>}
              {!!tags.length && <div class="note-topics">{tags.map(tag => <a class="internal" key={tag}
                href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}>#{tag}</a>)}</div>}
            </div>
          </li>
        })}</ul>
      </section>)}
      <p class="category-empty" role="status" hidden></p>
      </div>
    </section>}
    {!!topics.length && <nav aria-label="主题索引">
      <div class="notebook-list-heading"><h2>主题索引</h2></div>{topics.map(f =>
      <a key={f.slug} class="internal" href={resolveRelative(fileData.slug!, f.slug!)}>{f.frontmatter?.title}</a>)}
    </nav>}
  </section>
}
Notebook.afterDOMLoaded = `
document.addEventListener("click", (event) => {
  if (event.target.closest?.(".journal-search")) document.querySelector(".sidebar.left .search-button")?.click()
  const button = event.target.closest?.(".category-filter button")
  if (!button) return
  const section = button.closest("section")
  const selected = button.dataset.filter
  for (const option of section.querySelectorAll(".category-filter button")) {
    option.setAttribute("aria-pressed", String(option === button))
  }
  let count = 0
  for (const row of section.querySelectorAll("li[data-category]")) {
    row.hidden = selected !== "全部" && row.dataset.category !== selected
    if (!row.hidden) count++
  }
  for (const month of section.querySelectorAll(".journal-month")) month.hidden = !month.querySelector("li:not([hidden])")
  const empty = section.querySelector(".category-empty")
  empty.textContent = count ? "" : "「" + selected + "」还没有公开笔记。"
  empty.hidden = count !== 0
})
`
Notebook.css = `article { font-size: ${settings.size === "大字" ? "1.18rem" : "1rem"}; }`
export default Notebook
