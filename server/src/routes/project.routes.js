const router = require("express").Router();

const {
  getAllProjects,
  getProjectById,
  getMyProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/project.controller");

const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");

router.get("/", getAllProjects);
router.get("/my", requireAuth, requireAdmin, getMyProjects);
router.get("/:id", getProjectById);
router.post("/", requireAuth, requireAdmin, createProject);
router.put("/:id", requireAuth, requireAdmin, updateProject);
router.delete("/:id", requireAuth, requireAdmin, deleteProject);

module.exports = router;
