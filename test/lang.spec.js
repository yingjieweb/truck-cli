const chai = require("chai");
const expect = chai.expect;
const sinon = require("sinon");
const fs = require("fs");

const setLangAPI = require("../src/lib/setLang");

describe("Truck CLI Program", () => {
  describe("Command「lang」 -> setLang API", () => {
    afterEach(() => {
      sinon.restore();
    });

    it('should set the language to "en" when valid input is provided', () => {
      const options = { set: "en" };
      const existsSyncStub = sinon.stub(fs, "existsSync").returns(false);
      const writeFileSyncStub = sinon.stub(fs, "writeFileSync");

      setLangAPI.setLang(options);

      expect(existsSyncStub.calledOnce).to.equal(true);
      expect(writeFileSyncStub.calledOnce).to.equal(true);
      expect(
        writeFileSyncStub.calledWith(
          sinon.match.any,
          JSON.stringify({ lang: "en" }, null, 2)
        )
      ).to.equal(true);
    });

    it('should set the language to "zh" when valid input is provided', () => {
      const options = { set: "zh" };
      const existsSyncStub = sinon.stub(fs, "existsSync").returns(false);
      const writeFileSyncStub = sinon.stub(fs, "writeFileSync");

      setLangAPI.setLang(options);

      expect(existsSyncStub.calledOnce).to.equal(true);
      expect(writeFileSyncStub.calledOnce).to.equal(true);
      expect(
        writeFileSyncStub.calledWith(
          sinon.match.any,
          JSON.stringify({ lang: "zh" }, null, 2)
        )
      ).to.equal(true);
    });

    it("should display an error message when an invalid language is provided", () => {
      const options = { set: "invalidLang" };
      const consoleErrorStub = sinon.stub(console, "error");

      setLangAPI.setLang(options);

      expect(consoleErrorStub.calledOnce).to.equal(true);
      expect(
        consoleErrorStub.calledWith(sinon.match(/Invalid language/))
      ).to.equal(true);
    });

    it("should display an error message when no language is provided", () => {
      const options = {};
      const consoleLogStub = sinon.stub(console, "log");

      setLangAPI.setLang(options);

      expect(consoleLogStub.calledOnce).to.equal(true);
      expect(
        consoleLogStub.calledWith(
          sinon.match(/Please use `tk -s en` command to set language/)
        )
      ).to.equal(true);
    });

    it("should update the existing config file when it exists", () => {
      const options = { set: "en" };
      const existsSyncStub = sinon.stub(fs, "existsSync").returns(true);
      const readFileSyncStub = sinon
        .stub(fs, "readFileSync")
        .returns(JSON.stringify({ lang: "zh" }));
      const writeFileSyncStub = sinon.stub(fs, "writeFileSync");

      setLangAPI.setLang(options);

      expect(existsSyncStub.calledOnce).to.equal(true);
      expect(readFileSyncStub.calledOnce).to.equal(true);
      expect(writeFileSyncStub.calledOnce).to.equal(true);
      expect(
        writeFileSyncStub.calledWith(
          sinon.match.any,
          JSON.stringify({ lang: "en" }, null, 2)
        )
      ).to.equal(true);
    });
  });
});
