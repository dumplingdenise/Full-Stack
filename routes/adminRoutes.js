const router = require("express").Router();
const service = require("../services/EventService");
const ensureAdmin = require("../middleware/ensureAdmin");
const User = require("../models/User");
const Reward = require("../models/Reward");
const Event = require("../models/Event");
const Chat = require("../models/Chat");
const Inbox = require("../models/Inbox");
const jwt = require("jsonwebtoken");
const { authenticateToken, setActiveInbox, getAnonChats, getUserList, getAnonLastChatWithInboxId, resetAnonChatsUnseenNumber } = require("../helpers/socketHelpers");

const stripe = require("stripe")(process.env.STRIPE_KEY);
const moment = require("moment");

router.get("/", ensureAdmin, async (req, res) => {
	await Reward.destroy({ where: { endDate: { [Op.lt]: moment().format("YYYY-MM-DD") } } });
	const users = await User.findAll({ include: [Reward] });
	const events = await Event.findAll();

	for (const event of events) {
		if (event.coupons === null) continue;
		event.rewards = [];
		for (const reward of event.coupons?.split(",")) {
			const coupon = await stripe.coupons.retrieve(reward);
			coupon.type = coupon.amount_off === null ? "$" : "%";
			coupon.amount = coupon.amount_off ?? coupon.percent_off;
			coupon.redeem_by = new Date((coupon.redeem_by + 28800) * 1000);
			coupon.eventId = event.id;
			event.rewards.push(coupon);
		}
	}

	res.render("admin", { user: req.user, users, events, adminPage: true, layout: "admin" });
});

router.put("/:id", ensureAdmin, async (req, res) => {
	try {
		await User.update(req.body, { where: { id: req.params.id } });
		res.json({ success: true });
	} catch (err) {
		console.log(err);
	}
});

router.delete("/:id", ensureAdmin, async (req, res) => {
	try {
		const id = req.params.id;
		global.sessions.delete(parseInt(id));
		await User.destroy({ where: { id } });
	} catch (err) {
		console.log(err);
	}
});

const generateAccessToken = (user) => jwt.sign(user, "secret");

router.get("/chats", ensureAdmin, authenticateToken, async (req, res) => {
	const { userId } = req.user;
	let foundUser = await User.findByPk(userId, { raw: true });
	if (foundUser.isAdmin == 0) return res.redirect("/");
	res.render("customer_service/adminChat2", { layout: "admin" });
});

const { Op } = require("sequelize");

//for admin to get inbox data so he can determine which messages are for which inbox
router.get("/admin-inbox", ensureAdmin, authenticateToken, async (req, res) => {
	const { userId } = req.user;
	let foundUser = await User.findByPk(userId, { raw: true });
	if (foundUser.isAdmin == 0) return res.json({ success: false, message: "You do not have permission." }, 403);
	let inboxList = await Inbox.findAll({ where: { ownerId: userId, [Op.not]: [{ senderId: userId }] }, raw: true });
	let userList = getUserList().filter((x) => x.anonInboxId != ""); //list of anonymous;
	userList.forEach((x) => {
		let { chats, unseenNumber } = getAnonLastChatWithInboxId(x.anonInboxId);
		let msg = "";
		let msgDate = "";
		if (chats) {
			msg = chats.msg;
			msgDate = chats.msgDate;
			inboxList.push({
				ownerId: foundUser.id,
				isAnon: 1,
				isAdmin: 0,
				name: x.name,
				email: x.email,
				id: x.anonInboxId,
				unseenNumber: unseenNumber,
				lastMsgReceived: msg,
				lastMsgReceivedDate: msgDate,
				profilePic: null,
				isResolved: 0,
				senderId: x.userId
			});
		}
	});
	//since we put in anon inbox we need to order descending now
	inboxList.sort((a, b) => {
		return new Date(b.lastMsgReceivedDate) - new Date(a.lastMsgReceivedDate);
	});
	res.json({ inboxes: inboxList });
});

//admin to get their chat.
router.get("/inbox/:inboxId", ensureAdmin, authenticateToken, async (req, res) => {
	const inboxId = req.params.inboxId;
	try {
		let foundInbox = await Inbox.findByPk(inboxId);
		console.log("/inbox/:inboxId " + foundInbox);
		// NEED HANDLE WHAT IF ANONYMOUS
		if (foundInbox == null) {
			// no inbox means anonymous
			resetAnonChatsUnseenNumber(inboxId);
			let allChats = getAnonChats(inboxId);
			console.log(allChats);
			return res.json({ success: true, inboxDetails: 1, chats: allChats }); //inboxDetails:1, means in memmory at frontend
		} else {
			// when it is reg user
			// when user clicks on inbox, search inboxId in chats
			let foundChats = await Chat.findAll({ where: { inboxId: inboxId }, raw: true, order: [["msgDate", "ASC"]] });
			// set the current active inbox for my socket to save unseenMessage for non active inbox
			setActiveInbox(inboxId);
			// set the unseenNumber to 0 as the chat is open
			if (foundInbox) {
				foundInbox.update({ unseenNumber: 0 }).then(async (updatedInbox) => {
					console.log(updatedInbox);
					// then find the inbox senders details with senderId, then join table and return items like email for display in chats area
					// let senderDetails = await User.findByPk(updatedInbox["senderId"],{raw:true});
					// as both inbox and chats have id as prim key. Change id for user table to be userId, while inbox id remains as id
					// senderDetails["senderId"] = senderDetails["id"];
					// let headerDetails = {...updatedInbox,...senderDetails};
					// delete senderDetails["id"];
					// render the chat
					res.json({ success: true, inboxDetails: updatedInbox, chats: foundChats });
				});
			} else {
				throw "No Inbox Found";
			}
		}
	} catch (err) {
		console.log(err);
		res.json({ success: false, message: "Error Rretrieving Message." });
	}
});

router.delete("/inbox/:inboxId", authenticateToken, async (req, res) => {
	try {
		const inboxId = req.params.inboxId;
		const { userId } = req.user;
		const foundInbox = await Inbox.findByPk(inboxId);
		if (!foundInbox) {
			return res.json({ success: false, message: "Inbox Not Found." });
		}
		if (foundInbox.ownerId != userId) {
			return res.json({ success: false, message: "Unauthorised Action." });
		}
		let deletedInbox = await Inbox.destroy({ where: { id: inboxId } });
		res.json({ success: true, message: "Deleted Inbox" });
	} catch (err) {
		console.log(err);
		res.json({ success: false, message: "Error Deleting Inbox." });
	}
});

router.get("/stats_data", ensureAdmin, authenticateToken, async (req, res) => {
	const { userId } = req.user;
	let inboxList = await Inbox.findAll({ where: { ownerId: userId, [Op.not]: [{ senderId: userId }] }, raw: true });
	total = inboxList.length;
	totalResolved = 0;
	inboxList.forEach((ele) => {
		if (ele.isResolved) {
			totalResolved += 1;
		}
	});
	console.log(total, ",", totalResolved);
	res.json({ success: true, total, totalResolved });
});

router.get("/stats", ensureAdmin, authenticateToken, (req, res) => {
	res.render("admin/stats", { layout: "admin" });
});
module.exports = router;
