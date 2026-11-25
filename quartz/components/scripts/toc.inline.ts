function toggleToc(this: HTMLElement) {
  this.classList.toggle("collapsed")
  this.setAttribute(
    "aria-expanded",
    this.getAttribute("aria-expanded") === "true" ? "false" : "true",
  )
  const content = this.nextElementSibling as HTMLElement | undefined
  if (!content) return
  content.classList.toggle("collapsed")
}

function setupToc() {
  for (const toc of document.getElementsByClassName("toc")) {
    const button = toc.querySelector(".toc-header")
    const content = toc.querySelector(".toc-content")
    if (!button || !content) return
    button.addEventListener("click", toggleToc)
    window.addCleanup(() => button.removeEventListener("click", toggleToc))
  }
}

document.addEventListener("nav", () => {
  setupToc()

  const links = Array.from(document.querySelectorAll<HTMLAnchorElement>(".toc a[data-for]"))
  const entries = links.map(link => ({link, heading: document.getElementById(link.dataset.for!)}))
    .filter(entry => entry.heading)
  if (!entries.length) return
  let frame = 0
  function update() {
    frame = 0
    let active = entries[0]
    for (const entry of entries) {
      if (entry.heading!.getBoundingClientRect().top > innerHeight * .23) break
      active = entry
    }
    // Keep the active section's subsections visible in long manuals.
    const majorLevel = entries.some(e => e.heading!.tagName === "H2") ? 2 : 1
    let parent = ""
    const branch = new Map<HTMLAnchorElement, string>()
    for (const {link, heading} of entries) {
      if (Number(heading!.tagName.slice(1)) <= majorLevel) parent = heading!.id
      branch.set(link, parent)
    }
    for (const entry of entries) {
      const li = entry.link.closest("li")
      if (li) li.hidden = entries.length > 10 && Number(entry.heading!.tagName.slice(1)) > majorLevel
        && branch.get(entry.link) !== branch.get(active.link)
      if (entry === active) entry.link.setAttribute("aria-current", "location")
      else entry.link.removeAttribute("aria-current")
    }
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
  update()
  document.addEventListener("scroll", schedule, {passive:true})
  window.addCleanup(() => { document.removeEventListener("scroll", schedule); cancelAnimationFrame(frame) })
})
