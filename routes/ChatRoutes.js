const router = require("express").Router();
const User = require("../models/User");
const Chat = require("../models/Chat");
const Inbox = require("../models/Inbox");
const { authenticateToken, getAnonChatsWithUserId, getAnonLastChatWithInboxId, deleteAnonChats } = require("../helpers/socketHelpers");
const { v4: uuidv4 } = require("uuid");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const chatsImageUpload = require("../helpers/chatsImageUpload");

const getCookieValue = (cookie, name) => cookie.match("(^|;)\\s*" + name + "\\s*=\\s*([^;]+)")?.pop() || "";

//user to get their chat
router.post("/inbox/", async (req, res) => {
	if (req.headers.cookie == undefined) {
		//check if already have current chats for anon users
		let anonChats = await getAnonChatsWithUserId(req.body.userId);
		console.log(anonChats);
		if (anonChats != null) return res.json({ success: true, chats: anonChats, isAnon: true });
		return res.json({ success: false, invalidToken: true });
	}
	const cookies = `; ${req.headers.cookie}`;
	console.log("/inbox/ ", cookies);
	let normalToken = getCookieValue(cookies, "token");
	console.log("/inbox/ ", normalToken);

	if (!normalToken) return res.json({ success: false, invalidToken: true }); //invalid token
	console.log(normalToken);
	jwt.verify(normalToken, "secret", (err, userId) => {
		console.log(err);
		if (err) return res.json({ success: false, invalidToken: true }); //invalid token
		console.log(userId);
		req.user = userId;
	});
	const { userId } = req.user; //get userId from req.user
	// var {inboxHash} = inbox.find(x=>x.senderId == userId)

	let foundInbox = await Inbox.findOne({
		where: { senderId: userId },
		raw: true
	}); //get the inboxId and search chats for existing chats

	console.log("/inbox/ " + foundInbox);
	if (foundInbox) {
		let id = foundInbox.id;
		// search chats which match inboxId
		let userChatList = await Chat.findAll({ where: { inboxId: id }, raw: true, order: [["msgDate", "ASC"]] });
		res.json({ success: true, chats: userChatList, adminId2: foundInbox.ownerId });
	} else if (!foundInbox && userId) {
		// if registered user but haven have an inbox create one.
		const foundUser = await User.findByPk(userId, { raw: true });
		const foundAdmin = await User.findOne({ where: { isAdmin: 1 }, raw: true });
		console.log("/inbox/" + foundAdmin?.id);
		const newInbox = await Inbox.create({
			isResolved: 0,
			unseenNumber: 0,
			lastMsgReceived: "",
			lastMsgReceivedDate: null,
			profilePic: foundUser.poster,
			name: foundUser.username,
			ownerId: foundAdmin.id,
			senderId: userId,
			email: foundUser.email
		});
		res.json({ success: true, chats: [] });
	} else {
		res.json({ success: false });
	}
});

router.post("/start_chat", async (req, res) => {
	//do verification and if ok start chat
	try {
		const { name, email, message } = req.body;
		if (name.trim() == "" || email.trim() == "" || message.trim() == "") {
			return res.json({ sucess: false, name, email, message });
		}
		//find if existing user
		const foundUser = await User.findOne({ where: { email }, raw: true });
		if (foundUser) {
			// start chat as anonymous if want.
			return res.json({
				success: true,
				isExistingCustomer: true,
				name,
				email,
				message,
				userId: uuidv4().replace(/-/g, "")
			});
		}
		//starting chat as anonymous
		res.json({
			success: true,
			name,
			email,
			message,
			userId: uuidv4().replace(/-/g, "")
		});
	} catch (err) {
		res.json({ success: false, err: "Error occurred. Try again." });
	}
});

router.post("/resolve/", async (req, res) => {
	try {
		// if anonymous delete the chat in memory
		const { inboxId } = req.body;
		let { chats, unseenNumber } = getAnonLastChatWithInboxId(inboxId);
		console.log("/resolve/ " + chats?.msg + unseenNumber);
		if (chats?.msg != undefined) {
			// meaning it is anon inbox
			console.log(chats.msg);
			deleteAnonChats(inboxId);
			res.json({ success: true, inboxDetails: { id: inboxId } });
		} else {
			console.log("why is here");
			let foundInbox = await Inbox.findByPk(inboxId);
			foundInbox.update({ isResolved: foundInbox.isResolved == 1 ? 0 : 1 }).then((updatedRecord) => {
				res.json({ success: true, inboxDetails: updatedRecord });
			});
		}
	} catch (err) {
		console.log(err);
		res.json({ success: false, message: "Error Occurred. Try Again." });
	}
});

router.delete("/message/:id", authenticateToken, async (req, res) => {
	try {
		const messageId = req.params.id;
		const { userId } = req.user;
		const foundMsg = await Chat.findByPk(messageId);
		if (!foundMsg) {
			return res.json({ success: false, message: "Message Not Found." });
		}
		if (foundMsg.senderId != userId) {
			return res.json({ success: false, message: "Unauthorised Action." });
		}
		let deletedMessage = await foundMsg.update({ msg: null });
		let foundInbox = await Inbox.findByPk(foundMsg.inboxId);
		if (foundInbox.lastMsgReceived == foundMsg.msg){
			foundInbox.update({ lastMsgReceived: null });
		}
		res.json({ success: true, message: "Deleted Message" });
	} catch (err) {
		console.log(err);
		res.json({ success: false, message: "Error Deleting Message." });
	}
});

router.post("/image", authenticateToken, (req, res) => {
	if (!fs.existsSync("./public/chats/")) {
		fs.mkdirSync("./public/chats/", { recursive: true });
	}
	chatsImageUpload.single("chat-files")(req, res, (err) => {
		console.log(req.file);
		if (err?.code == "LIMIT_FILE_SIZE") {
			// e.g. File too large
			res.json({
				success: false,
				err: { message: "Max file size is 1Mb" }
			});
		} else if (err) {
			res.json({
				success: false,
				err: err
			});
		} else {
			res.json({
				success: true,
				// url: `/uploads/${req.file.filename}`
				url: res.req.file.path.substring(6)
			});
		}
	});
});

module.exports = router;
