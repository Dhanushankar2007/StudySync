
const service = require("../services/notes.service");

async function listNotes(req, res, next) {
  try {
    const notes = await service.listNotes(req.user.id);
    res.json({ success: true, data: notes });
  } catch (error) {
    next(error);
  }
}

async function getNote(req, res, next) {
  try {
    const note = await service.getNote(req.params.id, req.user.id);
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

async function createNote(req, res, next) {
  try {
    const note = await service.createNote(req.body, req.user.id);
    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

async function updateNote(req, res, next) {
  try {
    const note = await service.updateNote(
      req.params.id,
      req.body,
      req.user.id
    );
    res.json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
}

async function deleteNote(req, res, next) {
  try {
    await service.deleteNote(req.params.id, req.user.id);
    res.status(204).end();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
};
