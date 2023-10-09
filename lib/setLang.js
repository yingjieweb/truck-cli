const chalk = require("chalk");
const path = require("path");
const rcConfigPath = path.join(process.env.HOME, ".truckclirc");
const fs = require("fs");

module.exports.setLang = (options) => {
  const { set } = options;
  if (!set) {
    console.log(chalk.red("Please use `tk -s en` command to set language"));
    return;
  }
  if (!/^(en|zh)$/i.test(set)) {
    console.error(chalk.red('Invalid language. Please use "en" or "zh".'));
    return;
  }

  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    rcConfigData.lang = set;
    fs.writeFileSync(rcConfigPath, JSON.stringify(rcConfigData, null, 2));
  } else {
    fs.writeFileSync(rcConfigPath, JSON.stringify({ lang: set }, null, 2));
  }
  console.log(chalk.green(`Language set to ${set}! 🎉`));
};
