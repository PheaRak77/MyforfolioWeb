const router = require("express").Router();

const {
  getAllCertificates,
  getCertificateById,
  getMyCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} = require("../controllers/certificate.controller");

const { requireAuth, requireAdmin } = require("../middleware/auth.middleware");

router.get("/", getAllCertificates);
router.get("/my", requireAuth, requireAdmin, getMyCertificates);
router.get("/:id", getCertificateById);
router.post("/", requireAuth, requireAdmin, createCertificate);
router.put("/:id", requireAuth, requireAdmin, updateCertificate);
router.delete("/:id", requireAuth, requireAdmin, deleteCertificate);

module.exports = router;
