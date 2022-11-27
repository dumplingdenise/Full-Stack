const router = require('express').Router();
const User = require("../models/User");
const Chat = require("../models/Chat");
const Inbox = require("../models/Inbox");
const ensureAuthenticated = require('../helpers/auth');
const jwt = require("jsonwebtoken");
const { authenticateToken, setActiveInbox, getAnonChats, getUserList, getAnonLastChatWithInboxId, resetAnonChatsUnseenNumber} = require("../helpers/socketHelpers");

function generateAccessToken(user) {
	return jwt.sign(user, "secret")
}
router.get("/profilepage", ensureAuthenticated, (req,res)=>{
	const user = req.user;
	var token = generateAccessToken({ userId: user.id });
	//save refresh token into db
	user.update({ token }).then(updatedRecord => {
			console.log(user.name + "logged in");
			res.cookie("token", token).cookie("userId",user.id).render('admin/adminprofilepage', {user});
	});
});

router.get('/logout', (req, res) => {
	req.logout(function (err) {
			if (err) { return next(err); }
			res.redirect('/');
	});
});

router.get("/chats", authenticateToken, async (req, res) => {
	const { userId } = req.user;
	let foundUser = await User.findByPk(userId, { raw: true });
	console.log(foundUser)
	if (foundUser.isAdmin == 0) return res.redirect("/");
	res.render('customer_service/adminChat2');
});
//for admin to get inbox data so he can determine which messages are for which inbox
router.get("/admin-inbox", authenticateToken, async (req, res) => {
	const { userId } = req.user;
	let foundUser = await User.findByPk(userId, { raw: true });
	if (foundUser.isAdmin == 0) return res.json({ success: false, message: "You do not have permission." }, 403);
	// let inboxList = await Inbox.findAll({where:{ownerId:userId},raw:true,order:[["lastMsgReceivedDate","DESC"]]});
	let inboxList = await Inbox.findAll({ where: { ownerId: userId }, raw: true });
	let userList = getUserList().filter(x => x.anonInboxId != ""); //list of anonymous;
	userList.forEach(x => {
		let { chats, unseenNumber } = getAnonLastChatWithInboxId(x.anonInboxId);
		let msg = ""
		let msgDate = ""
		if (chats) {
			msg = chats.msg
			msgDate = chats.msgDate
			inboxList.push({
				name: x.name,
				email: x.email,
				id: x.anonInboxId,
				unseenNumber: unseenNumber,
				lastMsgReceived: msg,
				lastMsgReceivedDate: msgDate,
				profilePic: null,
				isResolved: null,
				senderId: x.userId,
			});
		}
	});
	//since we put in anon inbox we need to order descending now
	inboxList.sort((a, b) => { return new Date(b.lastMsgReceivedDate) - new Date(a.lastMsgReceivedDate) });
	res.json({ inboxes: inboxList })
});

//admin to get their chat.
router.get("/inbox/:inboxId", authenticateToken, async (req, res) => {
	const inboxId = req.params.inboxId;
	try {
		let foundInbox = await Inbox.findByPk(inboxId);
		console.log("/inbox/:inboxId " + foundInbox);
		// NEED HANDLE WHAT IF ANONYMOUS
		if (foundInbox == null) { // no inbox means anonymous
			resetAnonChatsUnseenNumber(inboxId);
			let allChats = getAnonChats(inboxId);
			console.log(allChats);
			return res.json({ success: true, inboxDetails: 1, chats: allChats });//inboxDetails:1, means in memmory at frontend
		} else { // when it is reg user
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

router.get("/stats_data", authenticateToken, async (req,res)=>{
	const { userId } = req.user;
	let inboxList = await Inbox.findAll({ where: { ownerId: userId }, raw: true });
	total = inboxList.length;
	totalResolved = 0;
	inboxList.forEach(ele=>{
		if (ele.isResolved){
			totalResolved += 1;
		}
	})
	console.log(total,",", totalResolved);
	res.json({success:true, total, totalResolved});
});
router.get("/stats",authenticateToken, (req,res)=>{
	res.render("admin/stats");
});
module.exports = router;