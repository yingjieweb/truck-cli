const fs = require("fs");
const path = require("path");
const rcConfigPath = path.join(process.env.HOME, ".truckclirc");

function getFieldFromRC(fieldName) {
  let fieldValue;
  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    if (rcConfigData[fieldName]) {
      fieldValue = rcConfigData[fieldName];
    }
  }
  return fieldValue;
}
function setFieldToRC(fieldName, fieldValue) {
  if (fs.existsSync(rcConfigPath)) {
    const rcConfigFile = fs.readFileSync(rcConfigPath, "utf-8");
    const rcConfigData = JSON.parse(rcConfigFile);
    rcConfigData[fieldName] = fieldValue;
    fs.writeFileSync(rcConfigPath, JSON.stringify(rcConfigData, null, 2));
  } else {
    fs.writeFileSync(
      rcConfigPath,
      JSON.stringify(
        {
          [fieldName]: fieldValue,
        },
        null,
        2
      )
    );
  }
}

module.exports = {
  getFieldFromRC,
  setFieldToRC
};