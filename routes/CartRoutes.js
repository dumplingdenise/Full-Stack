const router = require("express").Router();
const controller = require("../controllers/CartController");
const middleware = require("../middleware/cart");
const ensureAuth = require("../middleware/ensureAuth");

// Routes - Andre
router.post("/add", ensureAuth, controller.add);
router.put("/update", ensureAuth, controller.update);
router.delete("/", ensureAuth, controller.clear);
router.delete("/:id", ensureAuth, controller.remove);

router.post("/checkout", ensureAuth, controller.checkout);
router.get("/cancel", ensureAuth, middleware.checkSession, controller.cancel);
router.get("/return-to-checkout", ensureAuth, middleware.checkSession, controller.returnToCheckout);
router.get("/success", ensureAuth, middleware.checkSession, controller.success);

router.all("*", ensureAuth, (req, res) => res.redirect("/user"));

module.exports = router;
