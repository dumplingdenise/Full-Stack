const User = require("../models/User");

const ensureAuth = async (req, res, next) => {
	const id = req.cookies["auth"];
	if (!global.sessions.has(parseInt(id))) return res.redirect("/login");

	const user = await User.findByPk(id);
	if (user.banned) return res.redirect("/logout");
	req.user = user;

	return next();
};

module.exports = ensureAuth;
