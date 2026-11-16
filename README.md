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

这是一个 DeepSeek Harness（DSH）Web 插件 bundle，两种装法都行。

### 方式一：下载 Release 安装包（推荐）

1. 打开 [Releases](https://github.com/peter9130/dsh-reasoning-slider/releases/latest)，下载 `dsh-reasoning-slider-1.0.0.tgz`。
2. 在 DSH 里把 tgz 的绝对路径交给插件管理器安装：

   ```text
   用 plugin_manager 的 install_bundle，安装 /绝对路径/dsh-reasoning-slider-1.0.0.tgz
   ```

   或者把 tgz 放进任意目录，在 DSH 里说「安装 /path/to/dsh-reasoning-slider-1.0.0.tgz」，由 Agent 调用 `plugin_manager` 完成。

3. 按提示重启 DSH（或到「设置 → 插件」里对 `dsh-reasoning-slider` 禁用再启用）。
   浏览器端（`client.js`）由 client-hmr 热加载，约 10 秒生效；宿主端（`index.js` /
   `cordis.patch.yml`）需要重启或重新启用。

### 方式二：从源码目录安装

```bash
git clone https://github.com/peter9130/dsh-reasoning-slider.git
```

然后在 DSH 里用 `plugin_manager install_bundle` 指向克隆下来的目录（或把目录放进
`~/.dsh/profiles/<profile>/vendor/` 后安装），开发时也可以直接 `link:` 到该目录。

### 方式三：从 GitHub 源码安装

```text
用 plugin_manager 安装 github:peter9130/dsh-reasoning-slider
```

GitHub 源码安装走 pnpm 的 git 拉取，国内网络可能很慢；优先用方式一的 tarball。

## 卸载 / Uninstall

在「设置 → 插件」里禁用并删除该 bundle，或从 profile 的 `package.json`
（`dependencies` 与 `dsh.profile.bundles`）里去掉 `dsh-reasoning-slider` 后重新安装依赖。
