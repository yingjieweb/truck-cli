const chalk = require("chalk");
const fs = require("fs");
const i18n = require("i18n");
const { setLang } = require("../src/lib/setLang");

jest.mock("fs");
jest.mock("i18n");

describe("setLang function", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should set language and write to config file when it exists", () => {
    const options = { lang: "en" };
    const rcConfigData = { lang: "zh" };
    fs.existsSync.mockReturnValueOnce(true);
    fs.readFileSync.mockReturnValueOnce(JSON.stringify(rcConfigData));
    const writeFileSyncMock = jest.spyOn(fs, "writeFileSync");

    setLang(options);

    expect(writeFileSyncMock).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ lang: "en" }, null, 2)
    );
  });

  test("should set language and create new config file when it does not exist", () => {
    const options = { lang: "en" };
    fs.existsSync.mockReturnValueOnce(false);
    const writeFileSyncMock = jest.spyOn(fs, "writeFileSync");

    setLang(options);

    expect(writeFileSyncMock).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify({ lang: "en" }, null, 2)
    );
  });

  test("should print error message if language is invalid", () => {
    const options = { lang: "invalidLang" };
    const consoleErrorSpy = jest.spyOn(console, "error");

    setLang(options);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      chalk.red(i18n.__("langInvalidTip"))
    );
  });
});
