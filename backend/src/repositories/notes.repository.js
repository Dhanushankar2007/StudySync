
const prisma = require("../db/prisma");

async function findAll(userId) {
  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { id: "desc" },
  });

  return notes.map(noteToDto);
}

async function findById(id, userId) {
  const noteId = Number(id);

  if (!Number.isInteger(noteId) || noteId <= 0) return null;

  const note = await prisma.note.findFirst({
    where: { id: noteId, userId },
  });

  return note ? noteToDto(note) : null;
}

async function create(data, userId) {
  const note = await prisma.note.create({
    data: {
      userId,
      title: data.title.trim(),
      content: data.content ?? "",
    },
  });

  return noteToDto(note);
}

async function update(id, data, userId) {
  const noteId = Number(id);

  if (!Number.isInteger(noteId) || noteId <= 0) return null;

  const result = await prisma.note.updateMany({
    where: { id: noteId, userId },
    data: {
      title: data.title !== undefined ? data.title.trim() : undefined,
      content: data.content !== undefined ? data.content : undefined,
    },
  });

  if (result.count === 0) return null;

  return findById(noteId, userId);
}

async function remove(id, userId) {
  const noteId = Number(id);

  if (!Number.isInteger(noteId) || noteId <= 0) return false;

  const result = await prisma.note.deleteMany({
    where: { id: noteId, userId },
  });

  return result.count > 0;
}

function noteToDto(note) {
  return {
    id: note.id,
    userId: note.userId,
    title: note.title,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
  };
}

module.exports = { findAll, findById, create, update, remove };
