const chalk = require("chalk");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

module.exports.setConfig = (options) => {
  const { global, project, repoName, checkMerge, targetBranchName } = options;

  if (global && project) {
    console.log(chalk.red("You can't set both global and project configs"));
    return;
  }
  if (!global && !project) {
    console.log(chalk.red("You need to set global or project config"));
    return;
  }
  if (global) {
    if (!repoName) {
      console.log(chalk.red("You need to set repoName in global config"));
      console.log(chalk.red("Try: tk config -g -rn hello-world -cm"));
      return;
    }
    console.log({ repoName, checkMerge });
  }
  if (project) {
    if (repoName) {
      console.log(chalk.red("You can't set repoName in project config"));
      console.log(chalk.red("Try: tk config -p -cm -tb master"));
      return;
    }
    console.log({ checkMerge, targetBranchName });
  }
};
