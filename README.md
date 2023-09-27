# 🎡 Truck-CLI

Truck-CLI is an indispensable tool that streamlines the front-end CI/CD workflow.

## Installation 🛠

```
npm install truck-cli -g

# OR

yarn global add truck-cli
```

## Usage 👨‍💻

You are supposed to have a `package.json` file in your project. Please note that the `version` field in your `package.json` file must be a valid semantic version. And execute the following command in your project root directory to update the version of your project. 

```
tk [options] [command]

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  release         Update the version of the current repository.
  help [command]  display help for command
```

## Workflow 🧫

### release 🎉

![release](./assets/release.png)
