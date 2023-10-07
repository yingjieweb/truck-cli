const chalk = require("chalk");
const path = require("path");
const rcConfigPath = path.join(process.env.HOME, ".truckclirc");
const fs = require("fs");

module.exports.setLang = (options) => {
  const { set } = options;
  if (!set || !/^(en|zh)$/i.test(set)) {
    console.error(chalk.red('Invalid language. Please use "en" or "zh".'));
    return;
  }

  // TODO
  console.log("Language is set to " + chalk.green(set) + ".");
};
