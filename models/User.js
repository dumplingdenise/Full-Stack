const Sequelize = require("sequelize");
const db = require("../helpers/connectToDB");
// Create users table in MySQL Database
const User = db.define("user", {
	username: {
		type: Sequelize.STRING(50),
		allowNull: false
	},
	email: { type: Sequelize.STRING },
	verified: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	},
	banned: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	},
	name: { type: Sequelize.STRING, allowNull: false },
	password: { type: Sequelize.STRING, allowNull: false },
	phone: { type: Sequelize.BIGINT(12) },
	isAdmin: {
		type: Sequelize.BOOLEAN,
		allowNull: false,
		defaultValue: false
	},
	token: { type: Sequelize.STRING },
	poster: { type: Sequelize.STRING }
});

module.exports = User;
