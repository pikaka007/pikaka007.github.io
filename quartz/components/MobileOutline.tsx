import { QuartzComponent } from "./types"

const MobileOutline: QuartzComponent = ({fileData}) => fileData.toc?.length ? (
  <details class="journal-mobile-toc">
    <summary>本文目录</summary>
    <div>{fileData.toc.map(h => <a key={h.slug} href={`#${h.slug}`}>{h.text}</a>)}</div>
  </details>
) : null

export default MobileOutline
