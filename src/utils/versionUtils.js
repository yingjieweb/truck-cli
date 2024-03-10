const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const semver = require("semver");
const util = require("util");
const root = process.cwd();
const execAsync = util.promisify(require("child_process").exec);
const { checkIfRemoteBranchExists } = require("./gitUtils");

function getCurrentRepoVersion() {
  try {
    const packagePath = path.resolve(root, "package.json");
    const packageData = fs.readFileSync(packagePath, "utf8");
    const packageJson = JSON.parse(packageData);

    if (packageJson && packageJson.version) {
      return packageJson.version;
    } else {
      throw new Error("无法找到版本号");
    }
  } catch (error) {
    console.log(
      chalk.red(`获取版本号出错: ${error.message}，请检查 package.json`)
    );
    return null;
  }
}
function checkIsVersionValid(version, from = 1) {
  // from 1:package.json 2.command line
  const isValid = semver.valid(version);
  if (!isValid) {
    console.log(
      chalk.red(
        `🚨 当前版本号(${version})不合法，${
          from === 1 ? "请检查 package.json" : "请重试"
        }`
      )
    );
  }
  return isValid;
}
async function getNextRepoVersionOptions(currentRepoVersion, targetBranch) {
  let cpatchVer;
  let lastBumpVerTime;
  try {
    lastBumpVerTime = await execAsync(
      `git log -1 --pretty=format:%ci ${
        checkIfRemoteBranchExists(targetBranch) ? "origin/" : ""
      }${targetBranch} package.json`
    );
  } catch (error) {
    console.log(chalk.red(`获取历史版本提交日期异常': ${error}`));
    return {};
  }
  const oneDay = 1000 * 60 * 60 * 24;
  const difference = Math.abs(new Date() - new Date(lastBumpVerTime.stdout));
  const goneDays = Math.ceil(difference / oneDay);
  cpatchVer = incrementVersionLastDigit(
    semver.inc(currentRepoVersion, "patch"),
    goneDays * 10
  );
  return {
    major: semver.inc(currentRepoVersion, "major"),
    minor: semver.inc(currentRepoVersion, "minor"),
    patch: semver.inc(currentRepoVersion, "patch"),
    mbpatch: cpatchVer,
    premajor: semver.inc(currentRepoVersion, "premajor"),
    preminor: semver.inc(currentRepoVersion, "preminor"),
    prepatch: semver.inc(currentRepoVersion, "prepatch"),
    prerelease_alpha: semver.inc(currentRepoVersion, "prerelease", "alpha"),
    prerelease_beta: semver.inc(currentRepoVersion, "prerelease", "beta"),
    prerelease_rc: semver.inc(currentRepoVersion, "prerelease", "rc"),
    custom: "自定义本次发布版本号",
  };
}
function incrementVersionLastDigit(version, increment) {
  const versionArr = version.split(".");
  const lastDigit = versionArr[versionArr.length - 1];
  const lastDigitInt = parseInt(lastDigit);
  const newLastDigit = lastDigitInt + increment;
  const newLastDigitStr = newLastDigit.toString();
  versionArr[versionArr.length - 1] = newLastDigitStr;
  const newVersion = versionArr.join(".");
  return newVersion;
}

module.exports = {
  getCurrentRepoVersion,
  checkIsVersionValid,
  getNextRepoVersionOptions,
};
