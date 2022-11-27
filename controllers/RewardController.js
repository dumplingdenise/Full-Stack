// Controller - Denise
const Event = require("../models/Event");
const Reward = require("../models/Reward");
const User = require("../models/User");
const sequelize = require("../helpers/connectToDB");

const checkCode = async (req, res) => {
	const reward = await Reward.findByPk(req.body.code);
	res.json({ valid: reward !== null });
};

const stripe = require("stripe")(process.env.STRIPE_KEY);

const add = async (req, res) => {
	try {
		let { id, percent_off, max_redemptions, redeem_by } = req.body;

		if (id.includes(" ")) {
			redeem_by = new Date(redeem_by).toLocaleDateString().split("/").reverse().join("-");
			const queryString = `id=${id}&percent_off=${percent_off}&max_redemptions=${max_redemptions}&redeem_by=${redeem_by}`;
			return res.redirect(`/reward/event/${req.params.id}?error=Code must not contain whitespace, please remove and try again&${queryString}`);
		}

		const event = await Event.findByPk(req.params.id);
		redeem_by = new Date(redeem_by).getTime() / 1000 - 28800;
		const coupon = await stripe.coupons.create({
			id,
			percent_off,
			applies_to: {
				products: [event.product_id]
			},
			max_redemptions,
			redeem_by
		});

		await stripe.promotionCodes.create({ coupon: id, code: id });

		let { coupons } = event;
		if (coupons === null) coupons = id.toLowerCase();
		else coupons += `,${id.toLowerCase()}`;
		await Event.update({ coupons }, { where: { id: req.params.id } });

		res.redirect("/user");
	} catch ({ message }) {
		let { id, percent_off, max_redemptions, redeem_by } = req.body;
		redeem_by = new Date(redeem_by).toLocaleDateString().split("/").reverse().join("-");
		const queryString = `id=${id}&percent_off=${percent_off}&max_redemptions=${max_redemptions}&redeem_by=${redeem_by}`;
		res.redirect(`/reward/event/${req.params.id}?error=Code already in use, please try another&${queryString}`);
	}
};

const addByUser = async (req, res) => {
	let { code, percent, endDate } = req.body;

	if (code.includes(" ")) {
		endDate = new Date(endDate).toLocaleDateString().split("/").reverse().join("-");
		const queryString = `code=${code}&percent=${percent}&endDate=${endDate}`;
		return res.redirect(`/reward/user/${req.params.id}?error=Code must not contain whitespace, please remove and try again&${queryString}`);
	}

	await Reward.create({ code, percent, endDate, userId: req.params.id });
	res.redirect("/admin");
};

const editByUser = async (req, res) => {
	let { code, percent, endDate } = req.body;
	await Reward.update({ percent, endDate }, { where: { code } });
	res.redirect("/admin");
};

const remove = async (req, res) => {
	try {
		let { eventId, coupons } = (
			await sequelize.query(`
			select id eventId, coupons from events
			where coupons like "%${req.params.id}%"
		`)
		)[0][0];

		coupons = coupons
			.split(",")
			.filter((coupon) => coupon !== req.params.id)
			.join(",");

		if (coupons === "") coupons = null;
		await Event.update({ coupons }, { where: { id: eventId } });

		await stripe.coupons.del(req.params.id);
		res.json({ success: true });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

const deleteByCode = async (req, res) => {
	await Reward.destroy({ where: { code: req.params.id } });
};

module.exports = { checkCode, add, addByUser, editByUser, remove, deleteByCode };
