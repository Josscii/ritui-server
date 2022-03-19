import { Sequelize } from "@sequelize/core";
import { CONNECTION_EXP } from "./db.config";

const sequelize = new Sequelize(CONNECTION_EXP);

export { sequelize };
