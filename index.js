const fs = require('fs');
const os = require('os');
const path = require('path');
const { mkdirp } = require('mkdirp');

const mwebPath = path.join(os.homedir(), 'Library/Containers/com.coderforart.MWeb3/Data/Library/Application Support/MWebLibrary');
const dbFile = path.join(mwebPath, 'mainlib.db');
const knex = require('knex')({
  client: 'sqlite3',
  connection: {
    filename: dbFile,
  },
});

async function makeDir(id, dir, dirMap = {}) {
  const dirList = await knex.raw(`SELECT * FROM cat WHERE pid = ${id}`);
  for (let row of dirList) {
    const dirName = path.join(dir, row.name);
    const newDir = path.join(__dirname, 'backup', dirName);
    dirMap[row.uuid] = newDir;
    console.log('创建文件夹：', newDir);
    mkdirp.sync(newDir);
    await makeDir(row.uuid, dirName, dirMap);
  }
  return dirMap;
}

async function main() {
  const dirMap = await makeDir(0, '');
  const dirIdList = Object.keys(dirMap);
  for (let rid of dirIdList) {
    const articleList = await knex.raw(`SELECT * FROM cat_article WHERE rid = ${rid}`);
    for (let article of articleList) {
      const mdFile = path.join(mwebPath, 'docs', `${article.aid}.md`);
      if (fs.existsSync(mdFile)) {
        const text = fs.readFileSync(mdFile).toString().trim();
        let fileName = text.replace(/^\s*#+\s*/ig, '').trim().match(/^\s*(\S+).*/ig);
        if (!fileName) continue;
        if (/\/|\\|\:/i.test(fileName)) {
          console.log(fileName);
          fileName = article.a
        }
        // const newFilePath = path.join(dirMap[rid], `${fileName}.md`);
        // console.log('拷贝 Markdown：', mdFile, '-->', newFilePath);
        // fs.copyFileSync(mdFile, newFilePath);
      }
    }
  }
}

main();