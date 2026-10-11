const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/auth");
const validateObjectId = require("../middleware/validateObjectId");
const {
  getAllCompanies,
  getCompanyById,
  updateCompanyStatus,
  deleteCompanyById,
} = require("../controller/company.controller");

router.use(authenticate, requireRole("admin"));

router.get("/companies", getAllCompanies);
router.get("/companies/:id", validateObjectId, getCompanyById);
router.patch("/companies/:id/status", validateObjectId, updateCompanyStatus);
router.delete("/companies/:id", validateObjectId, deleteCompanyById);

module.exports = router;