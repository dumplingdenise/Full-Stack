const router = require("express").Router();
const ensureAuth = require("../middleware/ensureAuth");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const axios = require("axios").default;
const service = require("../services/EventService");

const jwt = require("jsonwebtoken");
const generateAccessToken = (user) => jwt.sign(user, "secret");

router.get("/", async (req, res) => {
	const events = await service.getAll({ where: { postponed: false } });
	res.render("index", { events });
});

router.get("/login", (req, res) => {
	if (global.sessions.has(parseInt(req.cookies["auth"]))) return res.redirect("/user");

	const error = req.query.error ?? null;
	const { username, password } = req.query;
	res.render("login", { error, username, password });
});

router.get("/register", (req, res) => {
	if (global.sessions.has(parseInt(req.cookies["auth"]))) return res.redirect("/user");

	const errors = req.query.errors !== undefined ? JSON.parse(req.query.errors) : null;
	let { username, name, phone, email, password } = req.query;
	email = email === undefined ? "" : JSON.parse(email);
	res.render("register", { errors, username, name, phone, email, password });
});

router.get("/reset-password", (req, res) => {
	const errors = req.query.errors !== undefined ? JSON.parse(req.query.errors) : null;
	res.render("ask-email", { errors });
});

router.get("/reset-password/:id", (req, res) => {
	const errors = req.query.errors !== undefined ? JSON.parse(req.query.errors) : null;
	res.render("resetPassword", { errors });
});

const sendGrid = require("@sendgrid/mail");

router.post("/reset-password", async (req, res) => {
	const errors = [];
	const user = await User.findOne({ where: { email: req.body.email } });

	if (user === null) {
		errors.push("No user with specified email found.");
		return res.redirect(`/reset-password?errors=${JSON.stringify(errors)}`);
	}

	if (!user.verified) {
		errors.push("Unable to reset password, email not verified.");
		return res.redirect(`/reset-password?errors=${JSON.stringify(errors)}`);
	}

	sendGrid.setApiKey(process.env.SENDGRID_API_KEY);
	await sendGrid.send({
		from: "andreg.foo@gmail.com",
		to: req.body.email,
		subject: "Password reset",
		templateId: "d-e18d46355a7d4c739c52ef7e417c1e5b",
		personalizations: [
			{
				to: req.body.email,
				dynamic_template_data: { url: `http://localhost:5000/reset-password/${user.id}` }
			}
		]
	});
});

router.post("/reset-password/:id", async (req, res) => {
	const errors = [];
	const { password, confirmPassword } = req.body;

	const user = await User.findByPk(req.params.id);

	if (await bcrypt.compare(password, user.password)) {
		errors.push("New password cannot be the same as the old password.");
		return res.redirect(`/reset-password/${user.id}?errors=${JSON.stringify(errors)}`);
	}

	if (password.length < 6) errors.push("Password must be at least 6 characters long.");
	if (confirmPassword !== password) errors.push("Passwords do not match, try again.");
	if (errors.length > 0) return res.redirect(`/reset-password?errors=${JSON.stringify(errors)}`);

	const hash = bcrypt.hashSync(password, await bcrypt.genSaltSync(10));
	await User.update({ password: hash }, { where: { id: user.id } });

	res.clearCookie("auth");
	const id = user.id;
	global.sessions.delete(parseInt(user.id));
	console.log(global.sessions);
	res.redirect(`/login?username=${user.username}&password=${password}`);
});

const Reward = require("../models/Reward");

router.post("/register", async (req, res) => {
	const errors = [];

	let { username, name, email, phone, password, confirmPassword } = req.body;
	email = email.trim();
	if (email === "") email = null;
	if (phone === "") phone = null;

	const queryString = `username=${username}&name=${name}&email=${email}&phone=${phone}&password=${password}`;

	if ((await User.findOne({ where: { username } })) !== null) {
		errors.push("Username taken, try another.");
		return res.redirect(`/register?errors=${JSON.stringify(errors)}&${queryString}`);
	}

	if (username.includes(" ")) {
		errors.push("Code must not contain whitespace, please remove and try again.");
		return res.redirect(`/register?errors=${JSON.stringify(errors)}&${queryString}`);
	}

	if (email !== null && (await User.findOne({ where: { email } })) !== null) {
		errors.push("Email registered, try logging in instead.");
		return res.redirect(`/register?errors=${JSON.stringify(errors)}&${queryString}`);
	}

	if (password.length < 6) errors.push("Password must be at least 6 characters long.");
	if (confirmPassword !== password) errors.push("Passwords do not match, try again.");

	if (errors.length > 0) return res.redirect(`/register?errors=${JSON.stringify(errors)}&${queryString}`);

	const hash = bcrypt.hashSync(password, await bcrypt.genSaltSync(10));
	const user = await User.create({ username, name, email, phone, password: hash, isAdmin: false, verified: false, banned: false, poster:"/images/avatar/Reg_User_Icon.png" });

	await Reward.create({ code: username, percent: 10, userId: user.id });

	if (user.email !== null) {
		sendGrid.setApiKey(process.env.SENDGRID_API_KEY);
		await sendGrid.send({
			from: "andreg.foo@gmail.com",
			to: user.email,
			subject: "Email verification",
			templateId: "d-b3c853db1166487390fc929ef921bfc9",
			personalizations: [
				{
					to: req.body.email,
					dynamic_template_data: { url: `http://localhost:5000/user/verify-email/${user.id}` }
				}
			]
		});
	}

	res.redirect(`/login?username=${user.username}&password=${password}`);
});

router.post("/login", async (req, res, next) => {
	const { username, password } = req.body;
	const user = await User.findOne({ where: { username: username } });

	if (user === null) return res.redirect(`/login?error=No user found&username=${username}&password=${password}`);
	if (user.banned) return res.redirect(`/login?error=Your account is banned, for help please chat with our customer service officers`);
	if (!(await bcrypt.compare(password, user.password))) return res.redirect(`/login?error=Either your username or password is incorrect&username=${username}&password=${password}`);

	global.sessions.add(user.id);
	console.log(global.sessions);

	res.cookie("auth", user.id);
	res.cookie("token", generateAccessToken({ userId: user.id }));
	if (user.isAdmin) res.redirect("/admin");
	else res.redirect("/user");
});

router.get("/logout", ensureAuth, (req, res) => {
	global.sessions.delete(parseInt(req.user.id));
	console.log(global.sessions);
	res.json({ success: true });
});

module.exports = router;
