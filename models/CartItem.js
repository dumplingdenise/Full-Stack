const Sequelize = require("sequelize");
const db = require("../helpers/connectToDB");

const CartItem = db.define("cartItem", {
  quantity: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
  paid: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
  },
});

module.exports = CartItem;
