# 推理等级滑杆（Reasoning level slider）

在 Web 输入框的「模型」菜单里加一条推理等级滑杆：拖动滑块（或聚焦后按 ←/→）即可切换当前模型的推理等级。拖动过程只在松手时提交一次，不会每移动一格就发一次请求。

- **入口**：输入框工具行的模型按钮 → 菜单里「模型」「推理等级」两行下方的滑杆面板。
- **与 model-folders 的关系**：模型菜单是一个单槽。若安装了 `dsh-model-folders`（文件夹优先的模型选择器），它接管整个菜单，并且不渲染本插件所用的会话选项扩展槽，因此本插件的滑杆在那套菜单里不会出现；为此同一套滑杆 UI 已内嵌进 `dsh-model-folders` 的根菜单（见该插件 README）。禁用 model-folders 时，本插件的扩展槽条目会以内置菜单为准显示。
- **数据来源**：宿主模型目录（`ctx.modelDirectories` 共享的同一条会话目录）。等级取模型声明的 `reasoning.efforts`（DeepSeek 模型为 Off / Low / High / Max），不写死任何客户端词表。
- **生效范围**：与内置选择器共用一次 `selectModel`，所以触发按钮上的等级文字、菜单里的「推理等级」行和 `/model` 弹窗会同时更新；选择随会话持久化。
- **显示规则**：模型没有可调等级（例如仅 Off）时不显示；服务商未给默认等级时，滑杆最左是多出来的「默认」一档，提交时会省略 `reasoningEffort`。
- **失败与加载**：目录仍在加载或加载失败时，面板位置显示一行提示和「重试」；切换被拒时优先走菜单自带的浮动提示（`reportFailure`），没有时退回滑杆下方的错误文字。
- **反馈**：拖动/聚焦时标题行显示当前档位名，切换过程中显示「正在切换到 …」；切换成功通过 `aria-live` 播报，方向键每次按键提交一档。
- **主题**：面板、轨道、描边与焦点环使用 `--dsw-alias-*` 主题 token（`color-mix` 带 rgba 回退），亮/暗色跟随宿主；白色滑块圆钮与星光属于固定高光装饰。控件与样式全部自带，不导入 Harness Client 包。

## 安装与限制

- 插件是普通 bundle：插件管理里「添加插件」选目录，或由 Harness 的 `plugin_manager` 安装；改动 `client.js` 后由 client-hmr 热应用（约 10 秒），宿主 `index.js` 改动需重启或禁用再启用。
- 本插件只加一条菜单条目，不接管 `conversation.input.model` 槽位，因此内置选择器、搜索、徽标以及别的插件追加的会话选项都不受影响。
- 滑杆只在已打开模型的会话里出现；被寻址的子代理会话沿用内置选择器「不可选模型」的行为。

## 安装 / Installation

> npm 首发正在等待 registry 的安全冷却期结束；若 `npm view dsh-reasoning-level-slider` 还查不到，请直接用下面的 Release 安装包。

这是一个 DeepSeek Harness（DSH）Web 插件 bundle，三种装法任选。

### 方式一：npm 安装（推荐）

在 DSH 里直接让插件管理器按包名安装：

```text
用 plugin_manager 安装 dsh-reasoning-level-slider@1.0.1
```

国内网络访问 npm 源通常比 GitHub 快；也可以先 `npm view dsh-reasoning-level-slider version` 确认版本。

### 方式二：下载 Release 安装包（离线）

1. 打开 [Releases](https://github.com/peter9130/dsh-reasoning-level-slider/releases/latest)，下载 `dsh-reasoning-level-slider-1.0.1.tgz`。
2. 把它交给 DSH 的插件管理器：

   ```text
   用 plugin_manager 的 install_bundle 安装 /绝对路径/dsh-reasoning-level-slider-1.0.1.tgz
   ```

### 方式三：从源码目录安装（开发）

```bash
git clone https://github.com/peter9130/dsh-reasoning-level-slider.git
```

然后在 DSH 里用 `plugin_manager install_bundle` 指向该目录，或把目录放进
`~/.dsh/profiles/<profile>/vendor/` 后安装；开发时也可以直接 `link:` 到该目录。

## 升级 / Upgrade

```text
用 plugin_manager 把 dsh-reasoning-level-slider 升级到最新版本
```

或重新执行一次安装并指定新版本号（如 `dsh-reasoning-level-slider@1.0.2`）。

## 卸载 / Uninstall

在「设置 → 插件」里禁用并删除该 bundle，或从 profile 的 `package.json`
（`dependencies` 与 `dsh.profile.bundles`）里去掉 `dsh-reasoning-level-slider` 后重新安装依赖。

宿主端（`index.js` / `cordis.patch.yml`）改动需要重启或禁用再启用；浏览器端
（`client.js`）由 client-hmr 热加载，约 10 秒生效。
