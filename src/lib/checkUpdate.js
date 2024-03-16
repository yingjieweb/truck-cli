const axios = require("axios");
const inquirer = require("inquirer");
const chalk = require("chalk");
const { execSync } = require("child_process");
const ora = require("ora");
const spinner = ora();

const question = {
  type: "confirm",
  name: "isUpdateNow",
  message: "Would you like to update now?",
  default: true,
};

module.exports.checkUpdate = async (localVersion) => {
  spinner.start("Loading...");
  let latestVersion = null;
  try {
    const response = await axios.get(`https://registry.npmjs.org/truck-cli`);
    spinner.succeed("Load successfully");
    latestVersion = response.data["dist-tags"].latest;
  } catch (error) {
    spinner.fail("Load failed");
    console.log(
      chalk.red("Failed to get the latest version. Please try again later.")
    );
    return;
  }

  if (latestVersion && latestVersion !== localVersion) {
    console.log(
      chalk.yellow(`Truck-CLI version ${latestVersion} is available.`)
    );
    console.log(
      chalk.yellow(`You are currently using version ${localVersion}.`)
    );
    const answer = await inquirer.prompt(question);
    if (answer.isUpdateNow) {
      try {
        console.log(chalk.green("Updating Truck-CLI..."));
        execSync(`npm install -g truck-cli`);
        console.log(
          chalk.green(`Truck-CLI updated to version ${latestVersion}`)
        );
      } catch (error) {
        console.log(chalk.red(`Error updating Truck-CLI: ${error}`));
      }
    } else {
      console.log(
        chalk.yellow(
          "You can update manually by running 'npm install -g truck-cli'"
        )
      );
    }
  } else {
    console.log(chalk.green("You're using the latest version."));
  }
};
