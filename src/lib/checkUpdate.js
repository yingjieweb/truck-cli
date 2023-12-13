const axios = require("axios");

module.exports.checkForUpdate = async (localVersion) => {
  let latestVersion = null;
  try {
    const response = await axios.get(`https://registry.npmjs.org/truck-cli`);
    latestVersion = response.data["dist-tags"].latest;
  } catch (error) {
    console.error("Error fetching remote version:", error);
    return;
  }
  if (latestVersion && latestVersion !== localVersion) {
    console.log(
      `New version ${latestVersion} is available. Run 'npm install -g truck-cli' to update.`
    );
  } else {
    console.log("You're using the latest version.");
  }
};
