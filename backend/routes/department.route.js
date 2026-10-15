const router = require("express").Router();
const { authenticate, requireRole } = require("../middleware/auth");
const requireActiveCompany = require("../middleware/requireActiveCompany");
const validateObjectId = require("../middleware/validateObjectId");
const {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartmentById,
} = require("../controller/department.controller");

router.use(authenticate, requireRole("company"), requireActiveCompany);

router.post("/", createDepartment);
router.get("/", getAllDepartments);
router.get("/:id", validateObjectId, getDepartmentById);
router.patch("/:id", validateObjectId, updateDepartment);
router.delete("/:id", validateObjectId, deleteDepartmentById);

module.exports = router;