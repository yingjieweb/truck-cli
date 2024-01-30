#!/usr/bin/env node
const { program } = require("commander");
const pkg = require("../../package.json");
const checkUpdateAPI = require("../lib/checkUpdate");
const releaseAPI = require("../lib/release");
const setConfigAPI = require("../lib/setConfig");
const setLangAPI = require("../lib/setLang");

program
  .name("truck-cli")
  .description(
    "A command-line tool for streamlining the front-end CI/CD workflow."
  )
  .version(pkg.version);

program
  .command("checkupdate")
  .description("Check Truck-CLI version for updates.")
  .action(() => {
    checkUpdateAPI.checkUpdate(pkg.version);
  });

program
  .command("release")
  .description("Update the version of the current repository.")
  .action(() => {
    releaseAPI.release();
  });

program
  .command("config")
  .description("Set the runtime config of truck-cli.")
  .option(
    "-cm, --check-merge",
    "If need to check the target branch has been merged into the current branch."
  )
  .option(
    "-ncm, --not-check-merge",
    "If do not need to check the target branch has been merged into the current branch."
  )
  .option(
    "-tb, --target-branch <targetBranch>",
    "The name of the target branch that needs checked merged"
  )
  .action((options) => {
    setConfigAPI.setConfig(options);
  });

program
  .option("-l, --lang <lang>", "Specify the language (en or zh)")
  .action((options) => {
    setLangAPI.setLang(options);
  });

program.parse();
