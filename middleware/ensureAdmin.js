const User = require("../models/User");

const ensureAdmin = async (req, res, next) => {
	const id = req.cookies["auth"];
	if (!global.sessions.has(parseInt(id))) return res.redirect("/login");

	const user = await User.findByPk(id);
	if (!user.isAdmin) return res.redirect("/user");
	req.user = user;

	return next();
};

module.exports = ensureAdmin;
