const router = require("express").Router();
const User = require("../models/User");
const Reward = require("../models/Reward");
const bcrypt = require("bcryptjs");
const ensureAuth = require("../middleware/ensureAuth");
const fs = require("fs");
const upload = require("../helpers/imageUpload");
const cartService = require("../services/CartService");
const eventService = require("../services/EventService");
const { Op } = require("sequelize");
const moment = require("moment");

const stripe = require("stripe")(process.env.STRIPE_KEY);

// Routes - Kyaw Myo
router.get("/", ensureAuth, async (req, res) => {
	const { cartItems, total } = await cartService.getAll({ where: { userId: req.user.id, paid: false } });
	const events = await eventService.getAll({ where: { userId: req.user.id } });
	const rewards = await Reward.findAll({ where: { userId: req.user.id } });

	for (const event of events) {
		if (event.coupons === null) continue;
		event.rewards = [];
		for (const reward of event.coupons?.split(",")) {
			const coupon = await stripe.coupons.retrieve(reward);
			coupon.redeem_by = new Date((coupon.redeem_by + 28800) * 1000);
			coupon.eventId = event.id;
			event.rewards.push(coupon);
		}
	}

	res.render("user/profile", { user: req.user, rewards, cartItems, showCode: rewards.length > 0, total, events });
});

router.get("/edit", ensureAuth, async (req, res) => {
	const errors = req.query.errors !== undefined ? JSON.parse(req.query.errors) : null;
	const user = await User.findByPk(req.user.id);
	res.render("user/edit", { user, errors });
});

router.get("/recent", ensureAuth, async (req, res) => {
	await cartService.removeFromCart({
		where: {
			userId: req.user.id,
			paid: true,
			updatedAt: { [Op.lt]: moment().subtract(30, "days") }
		}
	});

	const { cartItems } = await cartService.getAll({
		where: { userId: req.user.id, paid: true },
		order: [["updatedAt", "DESC"]]
	});

	res.render("cart/recent", { cartItems });
});

router.get("/verify-email/:id", async (req, res) => {
	await User.update({ verified: true }, { where: { id: req.params.id } });
	res.render("user/email", { layout: "checkout" });
});

router.get("/reset-password", ensureAuth, (req, res) => {
	const errors = req.query.errors !== undefined ? JSON.parse(req.query.errors) : null;
	res.render("user/password", { errors });
});

router.post("/reset-password", ensureAuth, async (req, res) => {
	const errors = [];
	const { oldPassword, newPassword, confirmPassword } = req.body;

	const user = await User.findByPk(req.user.id);

	if (!(await bcrypt.compare(oldPassword, user.password))) {
		errors.push("Old password is incorrect, please try again.");
		return res.redirect(`/user/reset-password?errors=${JSON.stringify(errors)}`);
	}

	if (newPassword.length < 6) errors.push("Password must be at least 6 characters long.");
	if (confirmPassword !== newPassword) errors.push("Passwords do not match, try again.");
	if (errors.length > 0) return res.redirect(`/user/reset-password?errors=${JSON.stringify(errors)}`);

	const hash = bcrypt.hashSync(newPassword, await bcrypt.genSaltSync(10));
	await User.update({ password: hash }, { where: { id: req.user.id } });

	res.clearCookie("auth");
	const id = req.user.id;
	global.sessions.delete(parseInt(req.user.id));
	console.log(global.sessions);
	res.redirect(`/login?username=${req.user.username}&password=${newPassword}`);
});

const sendGrid = require("@sendgrid/mail");

const Inbox = require("../models/Inbox");

router.post("/edit", ensureAuth, async function (req, res) {
	const errors = [];

	let { username, name, email, phone, posterURL } = req.body;
	email = email.trim();
	if (email === "") email = null;
	if (phone === "") phone = null;
	if (posterURL === "") posterURL = null;

	const queryString = `username=${username}&name=${name}&phone=${phone}&email=${email}`;

	const usernameTaken = await User.findOne({ where: { username } });
	if (usernameTaken !== null && usernameTaken.id !== req.user.id) {
		errors.push("Username taken, try another.");
		return res.redirect(`/user/edit?errors=${JSON.stringify(errors)}&${queryString}`);
	}

	if (posterURL === null && email !== null && (await User.findOne({ where: { email } })) !== null) {
		errors.push("Email already registered.");
		return res.redirect(`/user/edit?errors=${JSON.stringify(errors)}&${queryString}`);
	}

	const values = { username, name, email, phone };

	const { email: oldEmail } = await User.findByPk(req.user.id);
	if (email !== oldEmail) {
		values.email = email;
		values.verified = false;

		sendGrid.setApiKey(process.env.SENDGRID_API_KEY);
		await sendGrid.send({
			from: "andreg.foo@gmail.com",
			to: email,
			subject: "Email verification",
			templateId: "d-b3c853db1166487390fc929ef921bfc9",
			personalizations: [
				{
					to: req.body.email,
					dynamic_template_data: { url: `http://localhost:5000/user/verify-email/${req.user.id}` }
				}
			]
		});
	}

	if (posterURL !== null || email !== null) {
		await Inbox.update({ profilePic: posterURL, email:email }, { where: { senderId: req.user.id } });
		values.poster = posterURL;
	}


	await User.update(values, { where: { id: req.user.id } });
	res.redirect("/user");
});

router.get("/image", ensureAuth, (req, res) => res.render("user/image"));

router.post("/upload", ensureAuth, async (req, res) => {
	const user = req.user;
	if (!fs.existsSync("./public/uploads/" + req.user.id)) fs.mkdirSync("./public/uploads/" + req.user.id, { recursive: true });

	upload(req, res, (err) => {
		if (err) res.json({ err: err });
		else if (req.file === undefined) res.json({});
		else res.json({ file: `/uploads/${req.user.id}/${req.file.filename}` });
	});
});

const axios = require("axios");

router.delete("/", ensureAuth, async function (req, res) {
	try {
		res.clearCookie("auth");

		const id = req.user.id;
		global.sessions.delete(parseInt(req.user.id));
		console.log(global.sessions);

		await User.destroy({ where: { id } });
		res.json({ success: true });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
});

module.exports = router;
