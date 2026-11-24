import { QuartzComponent } from "./types"
import { FullSlug, resolveRelative } from "../util/path"
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
  return <section class={records.length ? "notebook-index" : "notebook-index is-empty"}>
    <header class="notebook-heading">
      {!records.length && <div class="book-cover" aria-hidden="true"><span /></div>}
      <h1>{settings.heading}</h1>
      {settings.intro && <p class="notebook-intro">{settings.intro}</p>}
      {!notes.length && <p class="empty-message">还没有公开笔记。</p>}
    </header>
    {!!notes.length && <section class="notebook-catalog" aria-label="笔记列表">
      <div class="catalog-sidebar"><h2>分类目录</h2>
      <div class="category-filter" role="group" aria-label="按笔记分类筛选">
        <button type="button" data-filter="全部" aria-pressed="true">全部 <span>{notes.length}</span></button>
        {names.map(name => <button key={name} type="button" data-filter={name} aria-pressed="false">
          {name} <span>{counts.get(name) ?? 0}</span>
        </button>)}
      </div>
      </div>
      <div class="catalog-main">
      <div class="notebook-list-heading">
        <h2>{settings.order === "按标题" ? "全部笔记" : "近期更新"}</h2>
      </div>
      <ul>{notes.map(f => {
        const category = categoryOf(f)
        return <li key={f.slug} data-category={category}>
        <a class="internal" href={resolveRelative(fileData.slug!, f.slug!)}>{f.frontmatter?.title}</a>
        <time dateTime={dateOf(f)}>{dateOf(f)}</time>
        {!!f.frontmatter?.tags?.length && <div class="note-topics" aria-label="文章标签">
          {f.frontmatter.tags.map(tag => <a class="internal" key={tag} href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}><span aria-hidden="true">#</span>{tag}</a>)}
        </div>}
      </li>})}</ul>
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
  const empty = section.querySelector(".category-empty")
  empty.textContent = count ? "" : "「" + selected + "」还没有公开笔记。"
  empty.hidden = count !== 0
})
`
Notebook.css = `article { font-size: ${settings.size === "大字" ? "1.18rem" : "1rem"}; }`
export default Notebook
