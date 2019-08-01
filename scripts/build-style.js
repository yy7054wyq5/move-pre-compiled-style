const fs = require('fs');
const less = require('less');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const npmImportPlugin = require('less-plugin-npm-import'); // 支持波浪号导入node_modules中的样式
const argus = require('optimist').argv;
const path = require('path');

let [name] = argus._;

if (!name) {
  name = 'ui';
}

const projectPath = `./projects/${name}/src/lib`;
const distPath = `./packages/${name}/lib`;
const projectMainLessPath = `${projectPath}/${name}.less`;
const styleDistPath = `${distPath}/${name}.css`;
const stylePostedPath = `${projectPath}/${name}.css`;
/**
 * 使用postcss前的css
 *
*/
const styleUnPostPath = `${projectPath}/${name}-un-post.css`;
let lessPaths = [];

// console.log(path.resolve(projectPath));

const lessOptions = {
  paths: [projectPath],
  compress: true,
  javascriptEnabled: true,
  plugins: [new npmImportPlugin({ prefix: '~' })]
}

function fileImportPaths(lessPath, parsePath) {
  // console.log(lessPath, crtPath);
  const lessContent = fs.readFileSync(lessPath, 'utf8');
  if (lessContent.indexOf('@import') > -1) {
    let tmp = lessContent.match(/^@import '([^>]+).less';/gm)[0];
    // console.log(tmp);
    tmp = tmp.split('@import').map(str => str.replace(/\n([^>]+)\n/g, ''));
    // console.log(tmp);

    const paths = tmp.filter(str => str.indexOf('.less') > -1 && str.indexOf('~') < 0).map(str => {
      const _ = str.match(/'([^>]+)'/)[1];
      if (parsePath) {
        const { dir } = parsePath;
        const crtPath = dir.split(path.resolve(projectPath))[1];
        // console.log(projectPath, crtPath, _);
        return path.resolve(projectPath + crtPath, _);
      }
      return path.resolve(projectPath, _);
    });

    lessPaths = [...lessPaths, ...paths];
    // console.log(lessPaths);
    paths.forEach((filePath, idx) => {
      fileImportPaths(filePath, path.parse(filePath));
    });
  }
}

function copyCSS(css) {
  fs.unlink(styleUnPostPath, (err) => {
    if (err) throw err;
    fs.writeFileSync(stylePostedPath, css);
    fs.copyFileSync(stylePostedPath, styleDistPath);
  });
}

function moveStyleFiles(filePaths, targetDir) {
  filePaths.forEach(filePath => {
    const { dir, base } = path.parse(filePath);
    const filePathInLib = dir.split(path.resolve(projectPath))[1];
    // console.log(filePathInLib);
    const targetFilePath = `${targetDir}${filePathInLib}`;
    // console.log(targetFilePath);
    try {
      fs.mkdirSync(targetFilePath);
    } catch (error) {
    }
    // console.log(filePath, `${targetDir}/${filePathInLib}/${base}`);
    fs.copyFileSync(filePath, `${targetDir}/${filePathInLib}/${base}`);
  });
}

let content;
try {
  content = fs.readFileSync(projectMainLessPath, 'utf8');
} catch (error) {
  console.log(`没有${name}.less`);
  return;
}

// 编译
less.render(content,
  lessOptions,
  (e, output) => {
    if (!e) {
      const css = output.css;
      fs.writeFileSync(styleUnPostPath, css);
      postcss([autoprefixer])
        .process(
          css, {
            from: `${projectPath}/tmp.css`,
            to: stylePostedPath
          })
        .then(res => {
          copyCSS(res.css);
          fs.copyFileSync(projectMainLessPath, `${distPath}/${name}.less`);
          fileImportPaths(projectMainLessPath);
          // console.log(lessPaths);
          moveStyleFiles(lessPaths, distPath);
        })
        .catch(err => { console.log(err) });
    } else {
      console.log(e);
    }
  });


