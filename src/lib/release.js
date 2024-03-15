const inquirer = require("inquirer");
const chalk = require("chalk");
const path = require("path");
const util = require("util");
const { execSync } = require("child_process");
const execAsync = util.promisify(require("child_process").exec);
const { getFieldFromRC, setFieldToRC } = require("../utils/ioUtils");
const {
  checkIfWorkspaceClean,
  getCurrentBranch,
  checkIfRemoteRepoExists,
  checkIfTargetBranchExists,
  checkIfMergedTarget,
  checkIfRemoteBranchExists,
} = require("../utils/gitUtils");
const {
  getCurrentRepoVersion,
  checkIsVersionValid,
  getNextRepoVersionOptions,
} = require("../utils/versionUtils");

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
      let isTargetBranchExists = checkIfTargetBranchExists(config.targetBranch);
      while (!isTargetBranchExists) {
        const answer2 = await inquirer.prompt(question2(1));
        Object.assign(config, answer2);
        isTargetBranchExists = checkIfTargetBranchExists(config.targetBranch);
      }
      targetBranch = answer2.targetBranch;
      setFieldToRC("targetBranch", answer2.targetBranch);
    }
    const isTargetBranchExists = checkIfTargetBranchExists(targetBranch);
    if (!isTargetBranchExists) {
      console.log(
        chalk.red(`目标分支(${targetBranch})不存在，请先创建目标分支再执行发布`)
      );
      return;
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
    curRepoVersion,
    config.targetBranch
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

async function updateVersion() {
  console.log(chalk.green("🎡 Start to release..."));
  try {
    await execAsync(
      `npm version ${config.nextRepoVersion} -m "${config.releaseMessage}"`
    );
  } catch (error) {
    console.log(error);
  }
  const currentBranch = getCurrentBranch();
  const isRemoteRepoExists = checkIfRemoteRepoExists();
  const isRemoteBranchExists = checkIfRemoteBranchExists(currentBranch);
  if (!isRemoteRepoExists) {
    console.log(
      chalk.yellow(`请注意：当前仓库未推送到远程，请及时设置 origin`)
    );
  }
  if (isRemoteRepoExists && !isRemoteBranchExists) {
    console.log(
      chalk.yellow(
        `请注意：当前分支(${currentBranch})未推送到远程，请及时设置 upstream`
      )
    );
  }
  if (isRemoteRepoExists && isRemoteBranchExists) {
    execSync(`git push`);
    execSync(`git push --tags`);
  }
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
