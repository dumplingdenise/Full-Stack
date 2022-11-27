const Sequelize = require("sequelize");
const db = require("../helpers/connectToDB");

const EventTimeslot = db.define("eventTimeslot", {
	startTime: { type: Sequelize.DATE, allowNull: false },
	endTime: { type: Sequelize.DATE, allowNull: false },
	venue: { type: Sequelize.STRING(50), allowNull: false }
});

module.exports = EventTimeslot;
