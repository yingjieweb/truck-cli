const inquirer = require("inquirer");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
const rcConfigPath = path.join(process.env.HOME, ".truckclirc");
const { execSync } = require("child_process");

const question1 = (messageType) => ({
  type: "input",
  name: "targetBranch",
  message: [
    "Please specify the target branch you wish to check for merging before release.",
    "The branch you entered does not exist. Please enter a valid branch name and try again.",
  ][messageType],
  default: "master",
});
const question2 = {
  type: "confirm",
  name: "isConfirmNotCheckMerge",
  message:
    "Skipping the check merge before release is not recommended. Do you still want to proceed?",
  default: false,
};
const question3 = {
  type: "confirm",
  name: "isConfirmCheckMerge",
  message:
    "Do you want to check if the target branch has been merged before release? We recommend that you do this.",
  default: true,
};

module.exports.setConfig = async (options) => {
  const { checkMerge, notCheckMerge, targetBranch } = options;
  if (!checkMerge && !notCheckMerge && !targetBranch) {
    console.log(
      chalk.red("Please ensure to provide at least one configuration option.")
    );
    return;
  }
  if (checkMerge && notCheckMerge) {
    console.log(
      chalk.red(
        "You cannot configure both checkMerge and notCheckMerge at the same time."
      )
    );
    return;
  }
  if (checkMerge === true) {
    setFieldToRC("isNeedCheckMerge", true);
    console.log(
      chalk.green(
        "The feature of checking merge before release has been enabled."
      )
    );
    const targetBranchFromRc = getFieldFromRC("targetBranch");
    if (!targetBranch && !targetBranchFromRc) {
      let answer1 = await inquirer.prompt(question1(0));
      let isTargetBranchExist = await checkIsTargetBranchExist(
        answer1.targetBranch
      );
      while (!isTargetBranchExist) {
        answer1 = await inquirer.prompt(question1(1));
        isTargetBranchExist = await checkIsTargetBranchExist(
          answer1.targetBranch
        );
      }
      setFieldToRC("targetBranch", answer1.targetBranch);
      console.log(
        chalk.green(
          `The target branch(${answer1.targetBranch}) has been set successfully.`
        )
      );
      return;
    }
  }
  if (notCheckMerge === true) {
    const answer2 = await inquirer.prompt(question2);
    if (answer2.isConfirmNotCheckMerge) {
      setFieldToRC("isNeedCheckMerge", false);
    }
    return;
  }
  if (targetBranch) {
    let isTargetBranchExist = await checkIsTargetBranchExist(targetBranch);
    let answer1;
    while (!isTargetBranchExist) {
      answer1 = await inquirer.prompt(question1(1));
      isTargetBranchExist = await checkIsTargetBranchExist(
        answer1.targetBranch
      );
    }
    setFieldToRC("targetBranch", answer1.targetBranch);
    console.log(
      chalk.green(
        `The target branch(${answer1.targetBranch}) has been set successfully.`
      )
    );
    if (!getFieldFromRC("isNeedCheckMerge")) {
      const answer3 = await inquirer.prompt(question3);
      if (answer3.isConfirmCheckMerge) {
        setFieldToRC("isNeedCheckMerge", true);
        console.log(
          chalk.green(
            "The feature of checking merge before release has been enabled."
          )
        );
      }
    }
    return;
  }
};

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
async function checkIsTargetBranchExist(targetBranch) {
  return (
    isLocalBranchExists(targetBranch) || isRemoteBranchExists(targetBranch)
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
