const chalk = require("chalk");
const path = require("path");
const rcConfigPath = path.join(process.env.HOME, ".truckclirc");
const fs = require("fs");
const i18n = require("i18n");

module.exports.setLang = (options) => {
  const { lang } = options;
  if (!/^(en|zh)$/i.test(lang)) {
    console.log(chalk.red(i18n.__("langInvalidTip")));
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

  i18n.setLocale(lang)
  console.log(chalk.blue(i18n.__("welcome")))
};
