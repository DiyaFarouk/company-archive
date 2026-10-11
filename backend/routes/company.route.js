const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/auth");
const requireActiveCompany = require("../middleware/requireActiveCompany");
const { getMyCompany, updateMyCompany } = require("../controller/company.controller");

router.use(authenticate, requireRole("company"), requireActiveCompany);

router.get("/me", getMyCompany);
router.patch("/me", updateMyCompany);

module.exports = router;