const db = require("./connectToDB");

const setupDB = () => {
	const User = require("../models/User");
	const CartItem = require("../models/CartItem");
	const Event = require("../models/Event");
	const EventTimeslot = require("../models/EventTimeslot");
	const Reward = require("../models/Reward");

	const testConnection = require("./testDBConnection");
	const Inbox = require("../models/Inbox");
	const Chat = require("../models/Chat");
	const connectedToDB = testConnection();

	if (connectedToDB) {
		User.hasMany(CartItem, { onDelete: "cascade" });
		CartItem.belongsTo(User);
		CartItem.belongsTo(Event);
		CartItem.belongsTo(EventTimeslot, { foreignKey: "timeslot" });

		User.hasMany(Event, { onDelete: "cascade" });
		Event.belongsTo(User);

		Event.hasMany(EventTimeslot);
		EventTimeslot.belongsTo(Event);

		User.hasMany(Reward, { onDelete: "cascade" });
		Reward.belongsTo(User);

		User.hasMany(Inbox, { foreignKey: "ownerId", onDelete: "cascade" });
		Inbox.belongsTo(User, { as: "owner", foreignKey: "ownerId" });
		Inbox.belongsTo(User, { as: "sender", foreignKey: "senderId" });
		Inbox.hasMany(Chat, { onDelete: "cascade", hooks: true });
		Chat.belongsTo(Inbox);

		db.sync({ drop: true });
		console.log("DB setup!");
	}
};

module.exports = setupDB;
