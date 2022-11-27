const sequelize = require("./connectToDB");

const testConnection = async () => {
  try {
    let res = false;

    await sequelize.authenticate();
    console.log("Connected to database!");

    res = true;
  } catch (error) {
    console.error(error);
  }
};

module.exports = testConnection;
