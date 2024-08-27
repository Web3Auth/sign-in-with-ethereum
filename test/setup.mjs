/* eslint-disable import/extensions */
import register from "@babel/register";
import config from "@toruslabs/config/babel-test.config.js";
import { config as dotEnvConfig } from "dotenv";

dotEnvConfig();
register(config);
