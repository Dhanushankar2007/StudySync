
const repository = require("../repositories/notes.repository");

async function listNotes(userId) {
  return repository.findAll(userId);
}

async function getNote(id, userId) {
  const note = await repository.findById(id, userId);

  if (!note) {
    const error = new Error("Note not found");
    error.statusCode = 404;
    throw error;
  }

  return note;
}

function validateNote(data, isUpdate = false) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    const error = new Error("Request body must be a JSON object");
    error.statusCode = 400;
    throw error;
  }

  if (!isUpdate || data.title !== undefined) {
    if (typeof data.title !== "string" || !data.title.trim()) {
      const error = new Error("A non-empty title is required");
      error.statusCode = 400;
      throw error;
    }
  }

  if (data.content !== undefined && typeof data.content !== "string") {
    const error = new Error("Content must be a string");
    error.statusCode = 400;
    throw error;
  }
}

async function createNote(data, userId) {
  validateNote(data);
  return repository.create(data, userId);
}

async function updateNote(id, data, userId) {
  validateNote(data, true);
  await getNote(id, userId);
  return repository.update(id, data, userId);
}

async function deleteNote(id, userId) {
  await getNote(id, userId);
  await repository.remove(id, userId);
}

module.exports = {
  listNotes,
  getNote,
  createNote,
  updateNote,
  deleteNote,
};
