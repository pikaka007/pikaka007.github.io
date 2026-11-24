import { QuartzComponent } from "./types"
import { resolveRelative } from "../util/path"
import settings from "../../notebook.json"

const categories = [
  { name: "知识学习", types: ["knowledge"] },
  { name: "故障排查", types: ["troubleshooting"] },
  { name: "工程项目", types: ["project"] },
  { name: "研究与实验", types: ["paper", "experiment", "idea"] },
  { name: "工具手册", types: ["tool"] },
  { name: "学习记录", types: ["log", "reflection"] },
]

const Notebook: QuartzComponent = ({ allFiles, fileData }) => {
  if (fileData.slug !== "index") return null
  const records = allFiles.filter(f => f.slug && f.slug !== "index")
  const notes = records.filter(f => f.frontmatter?.type !== "moc")
  const topics = records.filter(f => f.frontmatter?.type === "moc")
  const hasTags = records.some(f => f.frontmatter?.tags?.length)
  const dateOf = (f: typeof notes[number]) => String(f.frontmatter?.updated ?? "").slice(0,10)
  notes.sort((a,b) => {
    const byTitle = String(a.frontmatter?.title).localeCompare(String(b.frontmatter?.title), "zh-CN")
    return settings.order === "按标题" ? byTitle : dateOf(b).localeCompare(dateOf(a)) || byTitle
  })
  return <section class={records.length ? "notebook-index" : "notebook-index is-empty"}>
    <header class="notebook-heading">
      {!records.length && <div class="book-cover" aria-hidden="true"><span /></div>}
      <h1>{settings.heading}</h1>
      {settings.intro && <p class="notebook-intro">{settings.intro}</p>}
      {!notes.length && <p class="empty-message">还没有公开笔记。</p>}
    </header>
    {!!notes.length && <section aria-label="笔记列表">
      <div class="category-filter" role="group" aria-label="按笔记分类筛选">
        <button type="button" data-filter="全部" aria-pressed="true">全部 <span>{notes.length}</span></button>
        {categories.map(({ name, types }) => <button key={name} type="button" data-filter={name} aria-pressed="false">
          {name} <span>{notes.filter(f => types.includes(String(f.frontmatter?.type))).length}</span>
        </button>)}
      </div>
      <h2>{settings.order === "按标题" ? "全部笔记" : "近期更新"}</h2>
      <ul>{notes.map(f => {
        const category = categories.find(c => c.types.includes(String(f.frontmatter?.type)))?.name
        return <li key={f.slug} data-category={category}>
        <a class="internal" href={resolveRelative(fileData.slug!, f.slug!)}>{f.frontmatter?.title}</a>
        <small>{category}</small><time>{dateOf(f)}</time>
      </li>})}</ul>
      <p class="category-empty" role="status" hidden></p>
    </section>}
    {(!!topics.length || hasTags) && <nav aria-label="主题索引"><h2>按主题浏览</h2>{topics.map(f =>
      <a key={f.slug} class="internal" href={resolveRelative(fileData.slug!, f.slug!)}>{f.frontmatter?.title}</a>)}
      {hasTags && <a href="/tags/">全部标签</a>}
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
