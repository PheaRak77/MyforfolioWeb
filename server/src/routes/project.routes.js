const router = require("express").Router();

const {
  getAllProjects,
  getProjectById,
  getMyProjects,
  createProject,
  updateProject,
  deleteProject,
} = require("../controllers/project.controller");

const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", getAllProjects);
router.get("/my", requireAuth, getMyProjects);
router.get("/:id", getProjectById);
router.post("/", requireAuth, createProject);
router.put("/:id", requireAuth, updateProject);
router.delete("/:id", requireAuth, deleteProject);

module.exports = router;
