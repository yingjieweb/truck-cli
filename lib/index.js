const inquirer = require("inquirer");
const semver = require("semver");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const curRepoName = path.basename(root);
const rcConfigPath = path.join(process.env.HOME, ".truckclirc");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const config = {
  currentRepoMasterBranchName: "",
  currentRepoVersion: "1.0.0",
  nextRepoVersionOptions: {
    major: "2.0.0",
    minor: "1.1.0",
    patch: "1.0.1",
  },
  nextRepoVersion: "2.0.0",
  releaseMessage: "",
};
const question1 = {
  type: "input",
  name: "currentRepoMasterBranchName",
  message: `请输入该仓库主分支`,
  default: "origin/master",
};
const question2 = () => ({
  type: "list",
  name: "nextRepoVersion",
  message: `请选择下一个版本号 (当前版本为: ${config.currentRepoVersion})`,
  choices: Object.keys(config.nextRepoVersionOptions).map((name) => ({
    name: `${name} => ${config.nextRepoVersionOptions[name]}`,
    value: config.nextRepoVersionOptions[name],
  })),
});
const question3 = () => ({
  type: "input",
  name: "releaseMessage",
  message: `请输入本次发布的描述信息`,
  default: `feat: 🎸 release ${config.nextRepoVersion}`,
});

module.exports.release = async () => {
  console.log(chalk.green("🎡 开始发布..."));
  const isClean = await checkIsWorkspaceClean();
  if (!isClean) return;
  const curRepoMasterBranchName = getMasterBranchName();
  if (!curRepoMasterBranchName) {
    const answer1 = await inquirer.prompt(question1);
    Object.assign(config, answer1);
    setMasterBranchName(config.currentRepoMasterBranchName);
  } else {
    Object.assign(config, {
      currentRepoMasterBranchName: curRepoMasterBranchName,
    });
  }
  const isMergedMaster = await checkIsMergedMaster();
  if (!isMergedMaster) return;
  const curRepoVersion = getCurrentRepoVersion();
  if (!curRepoVersion) return;
  const isValid = checkIsVersionValid(curRepoVersion);
  if (!isValid) return;
  config.currentRepoVersion = curRepoVersion;
  config.nextRepoVersionOptions = getNextRepoVersionOptions(curRepoVersion);
  const answer2 = await inquirer.prompt(question2());
  Object.assign(config, answer2);
  const answer3 = await inquirer.prompt(question3());
  Object.assign(config, answer3);
  updateVersion();
};

async function checkIsWorkspaceClean() {
  try {
    const { stdout, stderr } = await exec("git status --porcelain");
    if (stderr) {
      console.log(chalk.red(`执行工作区状态检查异常': ${stderr}`));
      return false;
    }
    if (stdout) {
      console.log(stdout);
      console.log(chalk.red("🚨 工作区有未提交的修改, 请提交修改后再发布!"));
      return false;
    }
    return true;
  } catch (error) {
    console.log(chalk.red(`执行工作区状态检查异常': ${error}`));
    return false;
  }
}
function getMasterBranchName() {
  let masterBranchName = null;
  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    Object.keys(rcConfigData).forEach((key) => {
      if (key === curRepoName) {
        masterBranchName = rcConfigData[key];
      }
    });
  }
  return masterBranchName;
}
function setMasterBranchName(masterBranchName) {
  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    if (Object.keys(rcConfigData).includes(curRepoName)) {
      Object.keys(rcConfigData).forEach((key) => {
        if (key === curRepoName) {
          rcConfigData[key] = masterBranchName;
        }
      });
    } else {
      rcConfigData[curRepoName] = masterBranchName;
    }
    fs.writeFileSync(rcConfigPath, JSON.stringify(rcConfigData));
  } else {
    fs.writeFileSync(
      rcConfigPath,
      JSON.stringify({ [curRepoName]: masterBranchName })
    );
  }
}
async function checkIsMergedMaster() {
  try {
    const { stdout } = await exec(
      `git log --oneline --left-right ${config.currentRepoMasterBranchName}...HEAD`
    );
    if (stdout.includes("<")) {
      console.log(
        chalk.red(`🚨 请先合并 ${config.currentRepoMasterBranchName} 分支`)
      );
      return false;
    }
    return true;
  } catch (error) {
    console.log(chalk.red(`执行主分支是否合并检查异常: ${error.message}`));
    return false;
  }
}
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
function checkIsVersionValid(version) {
  const isValid = semver.valid(version);
  if (!isValid) {
    console.log(
      chalk.red(`🚨 当前版本号 ${version} 非法，请检查 package.json`)
    );
  }
  return isValid;
}
function getNextRepoVersionOptions(currentRepoVersion) {
  return {
    major: semver.inc(currentRepoVersion, "major"),
    minor: semver.inc(currentRepoVersion, "minor"),
    patch: semver.inc(currentRepoVersion, "patch"),
    premajor: semver.inc(currentRepoVersion, "premajor"),
    preminor: semver.inc(currentRepoVersion, "preminor"),
    prepatch: semver.inc(currentRepoVersion, "prepatch"),
    prerelease_alpha: semver.inc(currentRepoVersion, "prerelease", "alpha"),
    prerelease_beta: semver.inc(currentRepoVersion, "prerelease", "beta"),
    prerelease_rc: semver.inc(currentRepoVersion, "prerelease", "rc"),
  };
}
async function updateVersion() {
  try {
    await exec(
      `npm version ${config.nextRepoVersion} -m "${config.releaseMessage}"`
    );
  } catch (error) {
    console.log(error);
  }
  exec(`git push`);
  exec(`git push --tags`);
  console.log(chalk.green("Version updated successfully! 🎉"));
  console.log(chalk.green(`New version: ${config.nextRepoVersion}`));
}
