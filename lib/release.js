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
  targetBranchName: "",
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
  type: "confirm",
  name: "isNeedCheckMerge",
  message: "是否需要检测目标分支已被合并？",
  default: true,
};
const question2 = {
  type: "input",
  name: "targetBranchName",
  message: `请输入需要被检测合并的目标分支`,
  default: "refs/remotes/origin/master",
};
const question3 = () => ({
  type: "list",
  name: "nextRepoVersion",
  message: `请选择下一个版本号 (当前版本为: ${config.currentRepoVersion})`,
  choices: Object.keys(config.nextRepoVersionOptions).map((name) => ({
    name: `${name} => ${config.nextRepoVersionOptions[name]}`,
    value: config.nextRepoVersionOptions[name],
  })),
});
const question4 = () => ({
  type: "input",
  name: "releaseMessage",
  message: `请输入本次发布的描述信息`,
  default: `feat: 🎸 release ${config.nextRepoVersion}`,
});

module.exports.release = async () => {
  const isClean = await checkIsWorkspaceClean();
  if (!isClean) return;
  const isNeedCheckMerge = getFieldFromRC("isNeedCheckMerge");
  if (isNeedCheckMerge === undefined) {
    const answer1 = await inquirer.prompt(question1);
    Object.assign(config, answer1);
    setFieldToRC("isNeedCheckMerge", answer1.isNeedCheckMerge);

    if (answer1.isNeedCheckMerge) {
      const targetBranchName = getFieldFromRC("targetBranchName");
      if (!targetBranchName) {
        const answer2 = await inquirer.prompt(question2);
        Object.assign(config, answer2);
        let isTargetBranchExist = await checkIsTargetBranchExist();
        while (!isTargetBranchExist) {
          const answer2 = await inquirer.prompt(question2);
          Object.assign(config, answer2);
          isTargetBranchExist = await checkIsTargetBranchExist();
        }
        setFieldToRC("targetBranchName", answer2.targetBranchName);
        const isMergedTarget = await checkIsMergedTarget();
        if (!isMergedTarget) return;
      }
    }
  } else if (isNeedCheckMerge) {
    const targetBranchName = getFieldFromRC("targetBranchName");
    if (!targetBranchName) {
      const answer2 = await inquirer.prompt(question2);
      Object.assign(config, answer2);
      let isTargetBranchExist = await checkIsTargetBranchExist();
      while (!isTargetBranchExist) {
        const answer2 = await inquirer.prompt(question2);
        Object.assign(config, answer2);
        isTargetBranchExist = await checkIsTargetBranchExist();
      }
      setFieldToRC("targetBranchName", answer2.targetBranchName);
      const isMergedTarget = await checkIsMergedTarget();
      if (!isMergedTarget) return;
    }
  }

  const curRepoVersion = getCurrentRepoVersion();
  if (!curRepoVersion) return;
  const isValid = checkIsVersionValid(curRepoVersion);
  if (!isValid) return;
  config.currentRepoVersion = curRepoVersion;
  config.nextRepoVersionOptions = getNextRepoVersionOptions(curRepoVersion);
  const answer3 = await inquirer.prompt(question3());
  Object.assign(config, answer3);
  const answer4 = await inquirer.prompt(question4());
  Object.assign(config, answer4);
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
function getFieldFromRC(fieldName) {
  let fieldValue;
  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    Array.isArray(rcConfigData) &&
      rcConfigData.forEach((item) => {
        if (item.repoName === curRepoName && item[fieldName] !== undefined) {
          fieldValue = item[fieldName];
        }
      });
  }
  return fieldValue;
}
function setFieldToRC(fieldName, fieldValue) {
  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    if (
      Array.isArray(rcConfigData) &&
      rcConfigData.some((item) => item.repoName === curRepoName)
    ) {
      rcConfigData.forEach((item) => {
        if (item.repoName === curRepoName) {
          item[fieldName] = fieldValue;
        }
      });
    } else {
      rcConfigData.push({
        repoName: curRepoName,
        [fieldName]: fieldValue,
      });
    }
    fs.writeFileSync(rcConfigPath, JSON.stringify(rcConfigData, null, 2));
  } else {
    fs.writeFileSync(
      rcConfigPath,
      JSON.stringify(
        [
          {
            repoName: curRepoName,
            [fieldName]: fieldValue,
          },
        ],
        null,
        2
      )
    );
  }
}
async function checkIsTargetBranchExist() {
  return (
    isLocalBranchExists(config.targetBranchName) &&
    isRemoteBranchExists(config.targetBranchName)
  );
}
function isLocalBranchExists(branchName) {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`);
    return true;
  } catch (error) {
    return false;
  }
}
function isRemoteBranchExists(branchName) {
  try {
    execSync(`git show-ref --verify --quiet refs/remotes/origin/${branchName}`);
    return true;
  } catch (error) {
    return false;
  }
}
async function checkIsMergedTarget() {
  try {
    const targetLatestCommitHash = execSync(
      `git rev-parse ${config.targetBranchName}`,
      {
        encoding: "utf-8",
      }
    ).trim();
    execSync(
      `git merge-base --is-ancestor ${targetLatestCommitHash} ${targetBranch}`
    );
    return true;
  } catch (error) {
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
  console.log(chalk.green("🎡 Start to release..."));
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
