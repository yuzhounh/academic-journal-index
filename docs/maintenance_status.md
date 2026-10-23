# 当前日常版本

2026-10-23，日常 **6.2.5 / b04204a9c88f0da76867638d754c488b24922f20** 已构建并发布至当前允许平台；账户端到端验收单列待核验。本项目只有网页，桌面和手机使用同一站点，无独立 EXE/APK。公开 GitHub Release 保持 v6.2.4。

- 复用 AJI Editions 的 ISSN 分桶、内容哈希和服务端 LRU 实现：256 桶、最多缓存 8 桶，中文/英文共用已读取桶。保留本项目未知/继承属性 ID 和非法语言的防护；不新增模型请求、数据源或数据库迁移。
- 检索和分类/收藏导出复用已验证的 Blob CSV 下载器，避免 data URL 中的 # 截断和大字符串 URI 编码副本，保留字段、行内容和文件名；UTF-8 BOM 改善 Excel 的中文识别。
- Vercel 对比本分支上一次成功部署的 SHA，仅文档/回执/测试/README 变化时跳过应用构建；多提交推送仍覆盖全部未部署源码变化，未知基线或 Git 失败则正常构建。GitHub CI 不跳过测试。这样交付回执不会再触发相同应用的重复生产构建。
- 数据逐字段比较：23561 条双语文本和相关期刊均与原 gzip 相同。原整库解压 93890331 字节，最大单桶解压 465803 字节；压缩输入 23027113 字节，最大单桶 130710 字节。回执 `../results/summary-shards-verification.json`；这些是数据字节数，不是生产内存/耗电测量。主表和原 gzip 保持。
- 已通过：9 项简介/共享规则测试及新增 CSV 完整性测试，包含真实 Server Action 无网络/无模型密钥取双语简介、相关期刊映射、未知输入、桶共享/淘汰/读失败重试、收藏 ID/网关兼容，以及 CSV 的中文/#/引号/换行和文件名保持。打包按输入指纹和产物 SHA 复用，不因 pretest/prebuild 重复解压/压缩整库。
- 本地初始全目录 typecheck 已完成；随后 lint 长时间等待，已仅停止本任务拥有的 lint 进程，未把中断当成功。tsconfig 收窄到全部实际源码、脚本、测试、functions/src、Next 类型和必要根配置，重新检查退出码 0、耗时 102 秒；这不是受控的前后速度基准。随后 CSV 调整的最终完整 typecheck/lint/build 以 CI 结果为准。构建/测试工作槽限制为 2。
- 构建/发布：最终 Application checks `39888159967`（10项检查、typecheck/lint/Next构建）和 Pages `39888159981` 成功。Vercel `dpl_FoeuJq6bDpuigM3uB9kgTSgHGgKh` READY；Cloudflare网关 `9b195cb7`、Firebase `academic-journal-index` 302入口已更新。Vercel/Cloudflare各4项首页/JS/CSS/图标、Pages源码清单/CI入口字节和Firebase查询参数保持通过；只存在根应用页面，未虚构分享路由验收。完整回执 `../results/performance-release-20261023.json`。
- 网页验收：Nature检索76条、中文/英文按需简介、相关期刊映射、返回列表和CSV实际下载76行通过。390px手机视口下，实际文档客户宽/滚动宽均375px（含竖向滚动条），菜单、详情和简介正常，无横向溢出；匿名IAB无console warning/error。证据 `../results/mobile-summary-6.2.5.png`。临时页关闭、视口恢复、浏览器运行时重置。
- 账户待核验：日常Chrome显示未登录，Google回调窗口自动关闭后未观察到已登录状态，未把它当网站故障或账户数据丢失。原认证/Firestore规则与配置/收藏ID及原数据文件相对本轮基线不变。Windows Computer Use随后因无法可靠识别浏览器地址被自动安全审核停止，未继续点击/输入；控制运行时已重置，不等于确认辅助服务进程退出。未完成的账户读取/收藏验收保留在管理台账，不因公开页面通过而标为通过。
- 唯一平台延期：Netlify全团队暂停至2026-10-29 11:14（北京时间），到期后仍需新授权；本轮未调用部署/API/重试。原results/netlify历史输出保持，最新源已加入管理中心延期队列。
