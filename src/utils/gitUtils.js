const util = require("util");
const chalk = require("chalk");
const execAsync = util.promisify(require("child_process").exec);
const { execSync } = require("child_process");

async function checkIfWorkspaceClean() {
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
function getCurrentBranch() {
  return execSync("git symbolic-ref --short HEAD").toString().trim();
}
function checkIfTargetBranchExists(targetBranch) {
  return (
    checkIfLocalBranchExists(targetBranch) ||
    checkIfRemoteBranchExists(targetBranch)
  );
}
function checkIfLocalBranchExists(branchName) {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`);
    return true;
  } catch {
    return false;
  }
}
function checkIfRemoteBranchExists(branchName) {
  try {
    execSync(`git show-ref --verify --quiet refs/remotes/origin/${branchName}`);
    return true;
  } catch {
    return false;
  }
}
function checkIfMergedTarget(targetBranch) {
  try {
    const currentBranch = getCurrentBranch();
    let targetBranchLatestHash;
    if (checkIfRemoteBranchExists(targetBranch)) {
      targetBranchLatestHash = execSync(`git ls-remote origin ${targetBranch}`)
        .toString()
        .split(" ")[0];
    } else {
      targetBranchLatestHash = execSync(`git rev-parse ${targetBranch}`)
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

module.exports = {
  checkIfWorkspaceClean,
  getCurrentBranch,
  checkIfTargetBranchExists,
  checkIfLocalBranchExists,
  checkIfRemoteBranchExists,
  checkIfMergedTarget,
};
