const inquirer = require("inquirer");
const semver = require("semver");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const root = path.dirname(__dirname);
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const config = {
  currentRepoVersion: "1.0.0",
  nextRepoVersionOptions: {
    major: "2.0.0",
    minor: "1.1.0",
    patch: "1.0.1",
  },
  nextRepoVersion: "2.0.0",
};
const question = () => ({
  type: "list",
  name: "nextRepoVersion",
  message: `请选择下一个版本号 (当前版本为: ${config.currentRepoVersion})`,
  choices: Object.keys(config.nextRepoVersionOptions).map((name) => ({
    name: `${name} => ${config.nextRepoVersionOptions[name]}`,
    value: config.nextRepoVersionOptions[name],
  })),
});

module.exports.release = async () => {
  const isClean = await checkIsWorkspaceClean();
  if (!isClean) return;
  config.currentRepoVersion = getCurrentRepoVersion();
  config.nextRepoVersionOptions = getNextRepoVersionOptions(
    config.currentRepoVersion
  );
  const answer = await inquirer.prompt(question());
  Object.assign(config, answer);
  updateVersion();
};

async function checkIsWorkspaceClean() {
  const { stdout } = await exec("git status --porcelain");
  if (stdout) {
    console.log(stdout);
    console.log(chalk.red("🚨 工作区有未提交的修改, 请提交修改后再发布!"));
    return false;
  }
  return true;
}
function getCurrentRepoVersion() {
  const packagePath = path.resolve(root, "package.json");
  const packageData = fs.readFileSync(packagePath, "utf8");
  return JSON.parse(packageData).version;
}
function getNextRepoVersionOptions(currentRepoVersion) {
  return {
    major: semver.inc(currentRepoVersion, "major"),
    minor: semver.inc(currentRepoVersion, "minor"),
    patch: semver.inc(currentRepoVersion, "patch"),
    premajor: semver.inc(currentRepoVersion, "premajor"),
    preminor: semver.inc(currentRepoVersion, "preminor"),
    prepatch: semver.inc(currentRepoVersion, "prepatch"),
    prerelease: semver.inc(currentRepoVersion, "prerelease"),
  };
}
async function updateVersion() {
  exec(
    `npm version ${config.nextRepoVersion} -m "release ${config.nextRepoVersion}"`
  );
  console.log(chalk.green("Bump repo version successfully! 🎉"));
}
