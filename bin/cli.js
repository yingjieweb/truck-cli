#!/usr/bin/env node
const { Command } = require("commander");
const pkg = require("../package.json");
const API = require("../lib");

const program = new Command();

program
  .name("truck-cli")
  .description(
    "A command-line tool for streamlining the front-end CI/CD workflow."
  )
  .version(pkg.version);

program
  .command("release")
  .description("Update the version of the current repository.")
  .action(() => {
    API.release();
  });

program.parse();
