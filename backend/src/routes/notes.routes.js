
const express = require("express");
const controller = require("../controllers/notes.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

const router = express.Router();

// All Notes endpoints require authentication.
router.use(requireAuth);

router.get("/", controller.listNotes);
router.post("/", controller.createNote);
router.get("/:id", controller.getNote);
router.put("/:id", controller.updateNote);
router.delete("/:id", controller.deleteNote);

module.exports = router;
