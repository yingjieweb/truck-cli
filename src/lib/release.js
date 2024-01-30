const inquirer = require("inquirer");
const semver = require("semver");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const rcConfigPath = path.join(process.env.HOME, ".truckclirc");
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const { execSync } = require("child_process");

const config = {
  targetBranch: "",
  isLocalBranchExists: false,
  isRemoteBranchExists: false,
  currentRepoVersion: "1.0.0",
  nextRepoVersionOptions: {
    custom: "custom",
    major: "2.0.0",
    minor: "1.1.0",
    patch: "1.0.1",
  },
  nextRepoVersion: "2.0.0",
  releaseMessage: "",
  // notifyHook: "", // TODO
};
const question1 = {
  type: "confirm",
  name: "isNeedCheckMerge",
  message: "是否需要进行分支合并检测？",
  default: true,
};
const question2 = (messageType) => ({
  type: "input",
  name: "targetBranch",
  message: [`请输入需要检测合并的目标分支名`, `输入的分支不存在，请重新输入`][
    messageType
  ],
  default: "master",
});
const question3 = () => ({
  type: "list",
  name: "nextRepoVersion",
  message: `请选择下一个版本号(当前版本为: ${config.currentRepoVersion})`,
  choices: Object.keys(config.nextRepoVersionOptions).map((name) => ({
    name: `${name} => ${config.nextRepoVersionOptions[name]}`,
    value: config.nextRepoVersionOptions[name],
  })),
});
const question4 = () => ({
  type: "input",
  name: "nextRepoVersion",
  message: `请输入下一个版本号(当前版本为: ${config.currentRepoVersion})`,
});
const question5 = () => ({
  type: "input",
  name: "releaseMessage",
  message: `请输入本次发布的描述信息`,
  default: `feat: 🎸 release ${config.nextRepoVersion}`,
});

module.exports.release = async () => {
  const isClean = await checkIsWorkspaceClean();
  if (!isClean) return;
  let isNeedCheckMerge = getFieldFromRC("isNeedCheckMerge");
  if (isNeedCheckMerge === undefined) {
    const answer1 = await inquirer.prompt(question1);
    Object.assign(config, answer1);
    setFieldToRC("isNeedCheckMerge", answer1.isNeedCheckMerge);
    isNeedCheckMerge = answer1.isNeedCheckMerge;
  }
  if (isNeedCheckMerge) {
    let targetBranch = getFieldFromRC("targetBranch");
    if (!targetBranch) {
      const answer2 = await inquirer.prompt(question2(0));
      Object.assign(config, answer2);
      let isTargetBranchExist = await checkIsTargetBranchExist();
      while (!isTargetBranchExist) {
        const answer2 = await inquirer.prompt(question2(1));
        Object.assign(config, answer2);
        isTargetBranchExist = await checkIsTargetBranchExist();
      }
      targetBranch = answer2.targetBranch;
      setFieldToRC("targetBranch", answer2.targetBranch);
    }
    Object.assign(config, { targetBranch });
    const isMergedTarget = await checkIsMergedTarget();
    if (!isMergedTarget) {
      console.log(
        chalk.red(
          `当前分支未合并目标分支(${config.targetBranch})，请先合并后再执行发布`
        )
      );
      return;
    }
  }

  const curRepoVersion = getCurrentRepoVersion();
  if (!curRepoVersion) return;
  const isValid = checkIsVersionValid(curRepoVersion);
  if (!isValid) return;
  config.currentRepoVersion = curRepoVersion;
  config.nextRepoVersionOptions = await getNextRepoVersionOptions(
    curRepoVersion
  );
  const answer3 = await inquirer.prompt(question3());
  if (answer3.nextRepoVersion !== "自定义本次发布版本号") {
    Object.assign(config, answer3);
  } else {
    let answer4 = await inquirer.prompt(question4());
    while (!checkIsVersionValid(answer4.nextRepoVersion, 2)) {
      answer4 = await inquirer.prompt(question4());
    }
    Object.assign(config, answer4);
  }
  const answer5 = await inquirer.prompt(question5());
  Object.assign(config, answer5);
  updateVersion();
};

async function checkIsWorkspaceClean() {
  try {
    const { stdout, stderr } = await execAsync("git status --porcelain");
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
function getFieldFromRC(fieldName) {
  let fieldValue;
  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    if (rcConfigData[fieldName]) {
      fieldValue = rcConfigData[fieldName];
    }
  }
  return fieldValue;
}
function setFieldToRC(fieldName, fieldValue) {
  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    rcConfigData[fieldName] = fieldValue;
    fs.writeFileSync(rcConfigPath, JSON.stringify(rcConfigData, null, 2));
  } else {
    fs.writeFileSync(
      rcConfigPath,
      JSON.stringify(
        {
          [fieldName]: fieldValue,
        },
        null,
        2
      )
    );
  }
}
async function checkIsTargetBranchExist() {
  return (
    isLocalBranchExists(config.targetBranch) ||
    isRemoteBranchExists(config.targetBranch)
  );
}
function isLocalBranchExists(branchName) {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`);
    Object.assign(config, { isLocalBranchExists: true });
    return true;
  } catch (error) {
    return false;
  }
}
function isRemoteBranchExists(branchName) {
  try {
    execSync(`git show-ref --verify --quiet refs/remotes/origin/${branchName}`);
    Object.assign(config, { isRemoteBranchExists: true });
    return true;
  } catch (error) {
    return false;
  }
}
async function checkIsMergedTarget() {
  try {
    const currentBranch = execSync("git symbolic-ref --short HEAD")
      .toString()
      .trim();
    let targetBranchLatestHash;
    if (config.isRemoteBranchExists) {
      targetBranchLatestHash = execSync(
        `git ls-remote origin ${config.targetBranch}`
      )
        .toString()
        .split(" ")[0];
    } else {
      targetBranchLatestHash = execSync(`git rev-parse ${config.targetBranch}`)
        .toString()
        .split(" ")[0];
    }
    return execSync(`git branch --contains ${targetBranchLatestHash}`)
      .toString()
      .includes(currentBranch);
  } catch (error) {
    console.log(chalk.red(`检测分支合并情况出错: ${error.message}`));
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
async function getNextRepoVersionOptions(currentRepoVersion) {
  let cpatchVer;
  let lastBumpVerTime;
  try {
    lastBumpVerTime = await execAsync(
      `git log -1 --pretty=format:%ci ${
        config.isRemoteBranchExists ? "origin/" : ""
      }${config.targetBranch} package.json`
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
async function updateVersion() {
  console.log(chalk.green("🎡 Start to release..."));
  try {
    await execAsync(
      `npm version ${config.nextRepoVersion} -m "${config.releaseMessage}"`
    );
  } catch (error) {
    console.log(error);
  }
  execSync(`git push`);
  execSync(`git push --tags`);
  console.log(chalk.green("Version updated successfully! 🎉"));
  console.log(chalk.green(`New version: ${config.nextRepoVersion}`));
  try {
    const cliPath = path.resolve(
      __dirname,
      "../../node_modules/.bin/conventional-changelog"
    );
    execSync(`${cliPath} -p angular -i CHANGELOG.md -s -r 0`);
    console.log(chalk.green("Changelog generated successfully! 🎉"));
  } catch (error) {
    console.error("Error generating changelog:", error);
  }
}
