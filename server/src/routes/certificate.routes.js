const router = require("express").Router();

const {
  getAllCertificates,
  getCertificateById,
  getMyCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
} = require("../controllers/certificate.controller");

const { requireAuth } = require("../middleware/auth.middleware");

router.get("/", getAllCertificates);
router.get("/my", requireAuth, getMyCertificates);
router.get("/:id", getCertificateById);
router.post("/", requireAuth, createCertificate);
router.put("/:id", requireAuth, updateCertificate);
router.delete("/:id", requireAuth, deleteCertificate);

module.exports = router;
