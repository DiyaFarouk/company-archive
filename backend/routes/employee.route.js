const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/auth");
const requireActiveCompany = require("../middleware/requireActiveCompany");
const validateObjectId = require("../middleware/validateObjectId");
const {
  createEmployee,
  getAllEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployeeById,
} = require("../controller/employee.controller");

// Runs for every route below, in this order
router.use(authenticate, requireRole("company"), requireActiveCompany);

router.post("/", createEmployee);
router.get("/", getAllEmployees);
router.get("/:id", validateObjectId, getEmployeeById);
router.patch("/:id", validateObjectId, updateEmployee);
router.delete("/:id", validateObjectId, deleteEmployeeById);

module.exports = router;