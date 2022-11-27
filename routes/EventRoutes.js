const router = require("express").Router();
const Event = require("../models/Event");
const User = require("../models/User");
const EventTimeslot = require("../models/EventTimeslot");
const CartItem = require("../models/CartItem");
const sequelize = require("../helpers/connectToDB");
const { formatDatetime } = require("../helpers/handlebars");
const ensureAuth = require("../middleware/ensureAuth");
const stripe = require("stripe")(process.env.STRIPE_KEY);

// Routes - Chantelle

router.get("/", ensureAuth, async (req, res) => res.render("event/add"));

router.get("/edit/:id", ensureAuth, async (req, res) => {
	Event.findByPk(req.params.id) // find by primary key
		.then((event) => {
			if (!event) {
				flashMessage(res, "error", "Event not found");
				res.redirect("/event/");
				return;
			}
			res.render("event/edit", { event });
		})
		.catch((err) => console.log(err));
});

router.get("/analytics", ensureAuth, async (req, res) => {
	let events = await sequelize.query(`
		SELECT e.id, e.name, count(*) sold, e.ticketPrice
		FROM events e
		inner join cartItems c
		on e.id = c.eventid
		where c.paid = true and e.userId = ${req.user.id}
		group by e.id
	`);

	events = events[0].map((obj) => obj);

	const revenue = events.reduce((total, event) => total + event.ticketPrice * event.sold, 0);
	const totalSold = events.reduce((total, event) => total + event.sold, 0);

	let ticketsSold = await sequelize.query(`
		select date(c.updatedAt) date, sum(c.quantity) over(order by c.id) sold
		from cartItems c
		inner join events e
		on c.eventId = e.id
		where paid = true and e.userId = ${req.user.id}
	`);

	ticketsSold = ticketsSold[0]?.map(({ sold, date }) => ({ date: formatDatetime(new Date(date)), sold: parseInt(sold) }));
	const days = ticketsSold.reduce((total, sold) => total + 1, 0);
	const gradient = revenue > 0 ? revenue / days : 0;

	res.render("event/analytics", { revenue, totalSold, gradient, events: JSON.stringify(events), ticketsSold: JSON.stringify(ticketsSold) });
});

const { QueryTypes } = require("sequelize");

router.get("/:id", async (req, res) => {
	try {
		const event = await Event.findByPk(req.params.id, { include: User });
		const paid = await CartItem.findAll({ where: { eventId: event.id, paid: true } });
		event.ticketsLeft = event.ticketCount - paid.reduce((total, sold) => total + sold.quantity, 0);
		const soldOut = event.ticketsLeft === 0;

		const timeslots = await EventTimeslot.findAll({ where: { eventId: event.id } });
		for (const slot of timeslots) slot.startTimeString = `${slot.startTime.toDateString()} ${slot.startTime.toTimeString().slice(0, 5).replace(":", "")} hours`;

		res.render("event/details", { event, soldOut, timeslots, loggedIn: global.sessions.has(parseInt(req.cookies["auth"])) });
	} catch (err) {
		console.log(err);
	}
});

router.post("/", ensureAuth, async (req, res) => {
	let { name, ticketCount, ticketPrice, synopsis, categories, timeslots } = req.body;
	categories = categories.replaceAll(" ", "");
	if (synopsis.trim() === "") synopsis = null;
	if (categories === "") categories = null;
	timeslots = JSON.parse(timeslots);

	const { id: product } = await stripe.products.create({ name });
	const { id: default_price } = await stripe.prices.create({ currency: "sgd", product, unit_amount: ticketPrice * 100 });
	await stripe.products.update(product, { default_price });

	const event = await Event.create({ name, ticketCount, ticketPrice, synopsis, categories, postponed: false, product_id: product, price_id: default_price, userId: req.user.id });
	for (const slot of timeslots) await EventTimeslot.create({ startTime: slot.startTime, endTime: slot.endTime, venue: slot.venue, eventId: event.id });
	res.json({ success: true });
});

router.patch("/:id", ensureAuth, async (req, res) => {
	try {
		await Event.update(req.body, { where: { id: req.params.id } });
		res.json({ success: true });
	} catch (err) {
		console.log(err);
	}
});

router.put("/:id", ensureAuth, async (req, res) => {
	let { name, ticketCount, ticketPrice, synopsis, categories } = req.body;
	categories = categories.replaceAll(" ", "");
	if (synopsis.trim() === "") synopsis = null;
	if (categories === "") categories = null;

	await Event.update({ name, ticketCount, ticketPrice, synopsis, categories }, { where: { id: req.params.id } });
	res.json({ success: true });
});

router.delete("/:id", ensureAuth, async (req, res) => {
	try {
		await Event.destroy({ where: { id: req.params.id } });
		const events = await Event.findAll({ where: { userId: req.user.id } });
		res.json({ success: true, empty: events.length == 0 });
	} catch ({ message }) {
		res.json({ success: false, message });
	}
});

module.exports = router;
