const router = require("express").Router();

const {
  getAllSkills,
  getMySkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
} = require("../controllers/skill.controller");

const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");

router.get("/", getAllSkills);
router.get("/my", requireAuth, requireAdmin, getMySkills);
router.get("/:id", getSkillById);
router.post("/", requireAuth, requireAdmin, createSkill);
router.put("/:id", requireAuth, requireAdmin, updateSkill);
router.delete("/:id", requireAuth, requireAdmin, deleteSkill);

module.exports = router;
