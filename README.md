<p align="center" style="font-size: 88px; line-height: 88px"> 🚚 </p>
<p align="center">An indispensable tool that streamlines the front-end CI/CD workflow.</p>
<p align="center">
  <a href="https://www.npmjs.com/package/truck-cli" target="_blank">
    <img src="https://img.shields.io/npm/v/truck-cli.svg" alt="NPM Version" />
  </a>
  <a href="https://www.npmjs.com/package/truck-cli" target="_blank">
    <img src="https://img.shields.io/npm/l/truck-cli.svg" alt="Package License" />
  </a>
</p>

<!-- ## Why use Truck-CLI? 🤔 -->

## Installation 🛠

```
npm install truck-cli -g

# OR

yarn global add truck-cli
```

## Usage 👨‍💻

You are supposed to have a `package.json` file in your project. Please note that the `version` field in your `package.json` file must be a valid semantic version. Execute the following command in your project root directory to update the version of your project. And you can use the `config` command to satisfy different use cases.

```
Usage: truck-cli [options] [command]

A command-line tool for streamlining the front-end CI/CD workflow.

Options:
  -V, --version     output the version number
  -h, --help        display help for command

Commands:
  release           Update the version of the current repository.
  config [options]  Set the runtime config of truck-cli.
  lang [options]    Set the language of the current repository.
  help [command]    display help for command
```

## Workflow 🧫

![workflow](./src/assets/workflow.png)

## License

Nest is [MIT licensed](LICENSE).
