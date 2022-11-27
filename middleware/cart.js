const stripe = require("stripe")(process.env.STRIPE_KEY);

const checkSession = async (req, res, next) => {
	const session_id = req.query.session_id;
	if (session_id == null) return res.redirect("../cart");

	try {
		req.line_items = await stripe.checkout.sessions.retrieve(session_id, {
			expand: ["line_items"]
		});
		next();
	} catch {
		res.redirect("../cart");
	}
};

module.exports = { checkSession };
