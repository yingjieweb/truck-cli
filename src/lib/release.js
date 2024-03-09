const inquirer = require("inquirer");
const semver = require("semver");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const root = process.cwd();
const util = require("util");
const execAsync = util.promisify(require("child_process").exec);
const { execSync } = require("child_process");
const { getFieldFromRC, setFieldToRC } = require("../utils/ioUtils");
const {
  checkIfWorkspaceClean,
  checkIfTargetBranchExists,
  checkIfMergedTarget
} = require("../utils/gitUtils");

const config = {
  targetBranch: "",
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
  const isClean = await checkIfWorkspaceClean();
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
      let isTargetBranchExists = checkIfTargetBranchExists(config.targetBranch)
      while (!isTargetBranchExists) {
        const answer2 = await inquirer.prompt(question2(1));
        Object.assign(config, answer2);
        isTargetBranchExists = checkIfTargetBranchExists(config.targetBranch)
      }
      targetBranch = answer2.targetBranch;
      setFieldToRC("targetBranch", answer2.targetBranch);
    }
    const isTargetBranchExists = checkIfTargetBranchExists(targetBranch)
    if (!isTargetBranchExists) {
      console.log(
        chalk.red(
          `目标分支(${targetBranch})不存在，请先创建目标分支再执行发布`
        )
      )
      return 
    }
    Object.assign(config, { targetBranch });
    const isMergedTarget = await checkIfMergedTarget(targetBranch);
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
