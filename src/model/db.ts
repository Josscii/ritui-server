import Candidate from "./Candidate";
import Daily from "./Daily";
import Response from "./Response";
import { sequelize } from "./sequelize";
import User from "./User";

async function dbInit() {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
    await User.sync();
    await Daily.sync();
    await Response.sync();
    await Candidate.sync();
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
}

export { dbInit };
