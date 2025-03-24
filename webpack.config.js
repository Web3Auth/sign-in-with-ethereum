/* eslint-disable @typescript-eslint/no-require-imports */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const path = require("path");
const { EnvironmentPlugin } = require("webpack");

require("dotenv").config({ path: ".env" });

exports.baseConfig = {
  plugins: [new EnvironmentPlugin("VITE_APP_INFURA_PROJECT_KEY")],
};
