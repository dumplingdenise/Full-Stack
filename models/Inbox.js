const Sequelize = require("sequelize");
const db = require("../helpers/connectToDB");

const Inbox = db.define("inbox", {
  isResolved: { type: Sequelize.BOOLEAN },
  unseenNumber: { type: Sequelize.INTEGER },
  lastMsgReceived: { type: Sequelize.STRING },
  lastMsgReceivedDate: { type: Sequelize.DATE },
  name: { type: Sequelize.STRING },
  profilePic: {
    type: Sequelize.STRING,
    defaultValue: "/images/avatar/Reg_User_Icon.png",
  },
  email: { type: Sequelize.STRING },
});

module.exports = Inbox;
