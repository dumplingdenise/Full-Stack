const Sequelize = require("sequelize");

module.exports = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PWD, {
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	dialect: "mysql",
	logging: false,
	timezone: "+08:00"
});
