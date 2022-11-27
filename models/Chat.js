const Sequelize = require("sequelize");
const db = require("../helpers/connectToDB");

const Chat = db.define("chat", {
  msg: { type: Sequelize.STRING },
  msgDate: { type: Sequelize.DATE },
  file: { type: Sequelize.STRING },
  senderId: { type: Sequelize.STRING },
});

module.exports = Chat;
