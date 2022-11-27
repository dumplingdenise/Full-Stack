const service = require("../services/CartService");

// Controller - Andre

const index = async (req, res) => {
	try {
		const { cartItems, total } = await service.getAll({
			where: { userId: req.user.id, paid: false }
		});

		res.render("cart/index", { cartItems, total });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

const add = async (req, res) => {
	try {
		await service.addToCart({ ...req.body, userId: req.user.id });
		res.json({ success: true });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

const update = async ({ body: { id: itemId, quantity } }, res) => {
	try {
		const { subtotal, total } = await service.updateCartItem(itemId, quantity);
		return res.json({ success: true, subtotal, total });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

const remove = async ({ params: { id: itemId } }, res) => {
	try {
		const { total, empty } = await service.removeFromCartById(itemId);
		return res.json({ success: true, total, empty });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

const clear = async ({ user: { id } }, res) => {
	try {
		res.json({ success: await service.clearCart(id) });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

const stripe = require("stripe")(process.env.STRIPE_KEY);

const checkout = async ({ user: { id: userId }, body: { code } }, res) => {
	try {
		const { cartItems } = await service.getAll({ where: { userId, paid: false } });

		let session;
		if (code === "" || code === undefined) {
			const lineItems = cartItems.map(({ event, quantity }) => {
				return {
					price: event.price_id,
					quantity,
					adjustable_quantity: {
						enabled: true,
						maximum: event.ticketsLeft
					}
				};
			});

			session = await stripe.checkout.sessions.create({
				line_items: lineItems,
				mode: "payment",
				allow_promotion_codes: true,
				success_url: `${process.env.SERVER_URL}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${process.env.SERVER_URL}/cart/cancel?session_id={CHECKOUT_SESSION_ID}`
			});
		} else {
			lineItems = cartItems.map(({ event, quantity }) => {
				return {
					price_data: {
						currency: "sgd",
						product_data: { name: event.name },
						unit_amount: event.ticketPrice * 90
					},
					quantity,
					adjustable_quantity: {
						enabled: true,
						maximum: event.ticketsLeft
					}
				};
			});

			session = await stripe.checkout.sessions.create({
				line_items: lineItems,
				mode: "payment",
				success_url: `${process.env.SERVER_URL}/cart/success?session_id={CHECKOUT_SESSION_ID}`,
				cancel_url: `${process.env.SERVER_URL}/cart/cancel?session_id={CHECKOUT_SESSION_ID}`
			});
		}

		res.json({ success: true, url: session.url });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

const cancel = async (req, res) => {
	try {
		res.render("cart/cancel", { layout: "checkout" });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

const returnToCheckout = async (req, res) => {
	try {
		res.json({ url: req.line_items.url });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

const Reward = require("../models/Reward");
const sendGrid = require("@sendgrid/mail");

const success = async ({ user: { id, username }, query: { session_id } }, res) => {
	try {
		await service.checkout(id);
		await Reward.destroy({ where: { code: username } });

		sendGrid.setApiKey(process.env.SENDGRID_API_KEY);
		const { customer_details } = await stripe.checkout.sessions.retrieve(session_id);

		await sendGrid.send({
			from: "andreg.foo@gmail.com",
			to: customer_details.email,
			subject: "Payment successful!",
			text: `Congrats! ${customer_details.name}, your payment is successful.`
		});

		res.render("cart/success", { layout: "checkout" });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
};

module.exports = {
	index,
	add,
	update,
	remove,
	clear,
	checkout,
	cancel,
	returnToCheckout,
	success
};
