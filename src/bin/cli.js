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
  .description("Check for updates.")
  .action(() => {
    checkUpdateAPI.checkForUpdate(pkg.version);
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
  .option("-g, --global", "The global config.")
  .option("-p, --project", "The project config.")
  .option("-rn, --repo-name <repoName>", "The name of the repository.")
  .option(
    "-cm, --check-merge",
    "Whether need to check the target branch has been merged into the current branch."
  )
  .option(
    "-tbn, --target-branch-name <targetBranchName>",
    "The name of the target branch that needs checked merged"
  )
  .action((options) => {
    setConfigAPI.setConfig(options);
  });

program
  .command("lang")
  .description("Set the language of the current repository.")
  .option(
    "-s, --set <set>",
    "Set the language for the current repository (en or zh)."
  )
  .action((options) => {
    setLangAPI.setLang(options);
  });

program.parse();
