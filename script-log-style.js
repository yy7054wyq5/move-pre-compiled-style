const chalk = require('chalk');

const err = chalk.bold.red;
const success = chalk.bold.green;
const wraning = chalk.bold.yellow;
const bgColor = chalk.bold.bgGreenBright;

function logErr(name, msg) {
  console.log(`${bgColor(name)} ${err('fail: ')}`, msg);
}
function logSuccess(name, msg) {
  console.log(`${bgColor(name)} ${msg} ${success('success!')}`);
}
function logWarn(name, msg) {
  console.log(`${warning('Warn: ')} ${bgColor(name)} ${msg}`);
}

module.exports = {
  err,
  success,
  wraning,
  bgColor,
  logErr,
  logSuccess,
  logWarn
}
