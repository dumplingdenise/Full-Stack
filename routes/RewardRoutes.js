const router = require("express").Router();
const controller = require("../controllers/RewardController");
const ensureAuth = require("../middleware/ensureAuth");
const Event = require("../models/Event");
const Reward = require("../models/Reward");

// Routes - Denise
router.get("/event/:id", ensureAuth, async (req, res) => {
	const error = req.query.error ?? null;
	const { id, percent_off, max_redemptions, redeem_by } = req.query;
	res.render("rewards/add", { error, id, percent_off, max_redemptions, redeem_by });
});

router.get("/:id", ensureAuth, async (req, res) => {
	const reward = await Reward.findByPk(req.params.id);

	const error = req.query.error ?? null;
	const { code, percent, endDate } = req.query;
	res.render("rewards/edit", { error, code: reward?.code ?? code, percent: reward?.percent ?? percent, endDate: reward?.endDate ?? endDate });
});

router.get("/user/:id", ensureAuth, async (req, res) => {
	const error = req.query.error ?? null;
	const { code, percent, endDate } = req.query;
	res.render("rewards/addByUser", { error, code, percent, endDate });
});

router.post("/user/:id", ensureAuth, controller.addByUser);
router.post("/edit/:id", ensureAuth, controller.editByUser);
router.delete("/code/:id", ensureAuth, controller.deleteByCode);

router.post("/check", ensureAuth, controller.checkCode);
router.post("/event/:id", ensureAuth, controller.add);
router.delete("/:id", ensureAuth, controller.remove);

module.exports = router;
