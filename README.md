# mweb-to-obsidian

将 mweb 迁移为 obsidian

----------

## 功能特性：
- 自动读取文件夹数据库，生成对应的文件夹层级
- 自动读取文件夹/文件顺序，基于 [obsidian-bartender](https://github.com/nothingislost/obsidian-bartender) 配置文件
- 自动导出媒体内容
- 基于用户配置
  - 自动根据文档内容的 H1 标题 `重命名` 文件名
  - 自动去除文档顶部的 H1 标题

### 插件配合

安装以下 obsidian 插件配合本脚本，食用更佳：
- [Bartender](https://github.com/nothingislost/obsidian-bartender)，此插件能保证文件顺序
  - 此插件需要先安装 [BRAT](https://github.com/TfTHacker/obsidian42-brat)，然后再从 BRAT 中安装插件
- [Front Matter Title](https://github.com/snezhig/obsidian-front-matter-title)，此插件能保证在文件列表中自动显示文件内容的 H1 为文件名
  - 安装了这个插件，脚本里面的 `renameFile` 和 `removeTitle` 就都可以设置为 `false` 了
- [Hidden Folder](https://github.com/ptrsvltns/hidden-folder-obsidian)
  - 这个可以把 `media` 文件夹隐藏

## 如何使用

必要环境：[Node.js](https://nodejs.org)

### 安装项目依赖
进入到此项目根目录下，运行：

```bash
npm install
```

### 修改项目配置
在 [index.js](index.js) 中找到 `用户配置区域` 进行对应的 `路径` 和 `开关` 配置即可

```js
// 指定 Mweb 文档库地址
const mwebPath = path.join(os.homedir(), 'Library/Containers/com.coderforart.MWeb3/Data/Library/Application Support/MWebLibrary');

// 指定 obsidian 文档库路径，我这里放在我项目下面，避免出现自动覆盖写入，导致之前的文档库资料覆盖
const ObsidianPath = path.join(__dirname, 'backup');

// 指定 obsidian-bartender 插件地址
const bartenderPluginData = path.join(ObsidianPath, '.obsidian/plugins/obsidian-bartender/data.json');

// 是否重命名文件，如果配置为 true，将会读取文件的 h1 作为文件名
const renameFile = false;
// 是否去除标题，如果配置为 true，那么就会自动去掉文档库的 H1 标题
const removeTitle = false;
```

### 运行

使用以下命令，就可以在配置的目录下，看到对应的文件生成：
```bash
node ./index.js
```

