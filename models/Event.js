const Sequelize = require("sequelize");
const db = require("../helpers/connectToDB");

const Event = db.define("event", {
	name: { type: Sequelize.STRING(50), allowNull: false },
	ticketCount: { type: Sequelize.INTEGER, allowNull: false },
	ticketPrice: { type: Sequelize.DOUBLE, allowNull: false },
	product_id: { type: Sequelize.STRING(50), allowNull: false },
	price_id: { type: Sequelize.STRING(50), allowNull: false },
	coupons: { type: Sequelize.TEXT },
	synopsis: { type: Sequelize.TEXT },
	postponed: { type: Sequelize.BOOLEAN, allowNull: false },
	categories: { type: Sequelize.TEXT }
});

module.exports = Event;
