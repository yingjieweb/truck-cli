const chalk = require("chalk");
const path = require("path");
const rcConfigPath = path.join(process.env.HOME, ".truckclirc");
const fs = require("fs");

module.exports.setLang = (options) => {
  const { lang } = options;
  if (!/^(en|zh)$/i.test(lang)) {
    console.error(chalk.red('Invalid language. Please use "en" or "zh".'));
    return;
  }

  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    rcConfigData.lang = lang;
    fs.writeFileSync(rcConfigPath, JSON.stringify(rcConfigData, null, 2));
  } else {
    fs.writeFileSync(rcConfigPath, JSON.stringify({ lang }, null, 2));
  }
  console.log(chalk.green(`Specify language to ${lang}! 🎉`));
};
