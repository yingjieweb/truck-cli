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

## Truck-CLI workflow 🧫

### release 🎉

1. Checking if the working area is clean?
   - Clean -> Continue
   - Non-clean -> Exit
2. Checking if the origin/master branch is merged into the current branch?
   - Merged -> Continue
   - Not merged -> Ask whether to merge
     - Merge -> Execute merge operation
       - Merge success -> Continue
       - Merge failure -> Exit
     - Not merge -> Exit
3. Get the current repo version number
   - Get success -> Continue
   - Get failure -> Exit
4. Get the next version number
5. Input the release message (default: release x.x.x)
6. Update the version number and create a release tag
7. Commit and push to the remote repository
8. Adding Ding notify
