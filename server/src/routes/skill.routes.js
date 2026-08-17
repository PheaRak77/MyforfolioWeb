const router = require("express").Router();

const {
  getAllSkills,
  getMySkills,
  getSkillById,
  createSkill,
  updateSkill,
  deleteSkill,
} = require("../controllers/skill.controller");

const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", getAllSkills);
router.get("/my", requireAuth, getMySkills);
router.get("/:id", getSkillById);
router.post("/", requireAuth, createSkill);
router.put("/:id", requireAuth, updateSkill);
router.delete("/:id", requireAuth, deleteSkill);

module.exports = router;
