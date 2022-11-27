const Sequelize = require("sequelize");
const db = require("../helpers/connectToDB");

const Reward = db.define("reward", {
	code: { type: Sequelize.STRING(50), allowNull: false, primaryKey: true },
	percent: { type: Sequelize.DOUBLE, allowNull: false },
	endDate: { type: Sequelize.DATEONLY }
});

module.exports = Reward;
