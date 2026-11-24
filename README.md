# Personal Tech Lab

面向中文阅读的静态技术知识库。编辑 content 下的 Markdown，通过文件清单检查后构建。仓库仅承载公开候选资料。首次推送前由所有者审核全部内容。

需要 Node 24、npm 11、Python 3.12 或更新版本及 Git。在此目录执行：

```sh
npm ci
python -m pip install -r requirements.txt
npm run build
npm run preview
```

浏览器打开 http://127.0.0.1:8080 。修改内容后重新运行 build。构建只读取本仓库；数学使用 MathJax SVG，图表使用本站的 Mermaid 包。初始化本地提交检查用 `git config core.hooksPath .githooks`。

使用 Quartz 4.5.2，保留上游 MIT 许可证。仓库设置 Pages → Source 选择 GitHub Actions。经所有者批准首次公开后，设置 Actions 变量 ENABLE_PAGES 为 true。后续 main 推送会在验证成功后部署。
