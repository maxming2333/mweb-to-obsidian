const os = require('os');
const path = require('path');
const fs = require('fs-extra');
const { mkdirp } = require('mkdirp');
const { glob } = require('glob');
const filenamify = require('filenamify');
const _ = require('lodash');

/* ==================== 用户配置区域 ==================== */
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

/* ==================== 自动配置区域 ==================== */
const docsPath = path.join(mwebPath, 'docs');
const dbFile = path.join(mwebPath, 'mainlib.db');


const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbFile,
  },
  useNullAsDefault: true,
});


const infoMap = {
  dir: {},
  order: {},
};

function getName(name) {
  return filenamify(name, { replacement: '_' });
}

async function makeInfo(id, dir) {
  const dirList = await knex.raw(`SELECT * FROM cat WHERE pid = ${id}`);
  for (let row of dirList) {
    const dirName = path.join(dir, getName(row.name));
    const fileDir = path.join(ObsidianPath, dirName);
    infoMap.dir[row.uuid] = fileDir;
    infoMap.order[dir] = infoMap.order[dir] || [];
    infoMap.order[dir][row.sort] = dirName;
    await makeInfo(row.uuid, dirName);
  }
  if (infoMap.order[dir]) {
    infoMap.order[dir] = infoMap.order[dir].filter(n => n);
  }
}

function copyFile(fileId, baseDir) {
  const sourceFile = path.join(docsPath, `${fileId}.md`);
  if (!fs.existsSync(sourceFile)) return;
  const fileInfo = convertFile(sourceFile);
  const name = renameFile ? fileInfo.newName : fileInfo.name;
  const content = removeTitle ? fileInfo.newContent : fileInfo.content;
  const newFilePath = path.join(baseDir, `${name}.md`);
  mkdirp.sync(baseDir);
  fs.writeFileSync(newFilePath, content);
  console.log('[COPY]:', sourceFile, '-->', newFilePath);
  return {
    from: sourceFile,
    to: newFilePath
  };
}

function copyMedia() {
  const sourceMedia = path.join(docsPath, 'media');
  const newMedia = path.join(ObsidianPath, 'media');
  mkdirp.sync(newMedia);
  fs.copySync(sourceMedia, newMedia);
}

function convertFile(file) {
  const baseName = path.basename(file, '.md');
  const text = fs.readFileSync(file).toString().trim();
  // 去除一些空的 #
  const content = text.replace(/^\s*#+\s*/ig, '').trim();
  const result = /^(.*)\s*([\s\S]*)/ig.exec(content);
  const fileName = !result || result.length < 2 ? baseName : getName(result[1]);
  return {
    name: baseName,
    newName: fileName.replace(/^#*(.*)$/ig, '$1').trim(),
    content: text,
    newContent: result[2],
  }
}

function setOrder(orderData) {
  let data = {};
  try {
    if (fs.existsSync(bartenderPluginData)) {
      const text = fs.readFileSync(bartenderPluginData).toString().trim();
      data = JSON.parse(text);
    }
  } catch (error) {}
  const newData = _.mergeWith(data, { fileExplorerOrder: orderData }, function (objValue, srcValue) {
    if (_.isArray(objValue)) {
      return objValue.concat(srcValue);
    }
  });
  mkdirp.sync(path.dirname(bartenderPluginData));
  fs.writeFileSync(bartenderPluginData, JSON.stringify(newData, null, 2));
  console.log('[SET_ORDER]:', bartenderPluginData);
}

async function main() {
  const docFiles = await glob(`${docsPath}/**.md`);
  const mwebFiles = new Set(docFiles);

  await makeInfo(0, '');

  setOrder(infoMap.order);

  const dirIdList = Object.keys(infoMap.dir);
  for (let rid of dirIdList) {
    const articleList = await knex.raw(`SELECT * FROM cat_article WHERE rid = ${rid}`);
    for (let article of articleList) {
      const { from } = copyFile(article.aid, infoMap.dir[rid]);
      // 去除有数据映射关系的文件
      mwebFiles.delete(from);
    }
  }

  // 如果发现还有一些文件，没有数据库映射，那么就放入 “未分类”
  for (let doc of mwebFiles) {
    const fileId = path.basename(doc, '.md');
    const newDir = path.join(ObsidianPath, '未分类');
    copyFile(fileId, newDir);
  }

  copyMedia();

  knex.destroy();
}

main();

