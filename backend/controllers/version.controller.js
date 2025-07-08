// controllers/version.controller.js
const getLatestVersion = (req, res) => {
  res.status(200).json({ latestVersion: "1.0.0.22" });
};

module.exports = { getLatestVersion };
