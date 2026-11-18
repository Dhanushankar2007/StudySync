const prisma = require("../db/prisma");

async function findAll(userId) {
  const where = userId ? { userId } : {};
  const tasks = await prisma.task.findMany({
    where,
    orderBy: { id: "desc" },
  });

  return tasks.map(taskToDto);
}

async function findById(id, userId) {
  const taskId = Number(id);
  if (Number.isNaN(taskId)) return null;

  const where = userId ? { id: taskId, userId } : { id: taskId };
  const task = await prisma.task.findFirst({ where });

  return task ? taskToDto(task) : null;
}

async function create(data) {
  const created = await prisma.task.create({
    data: {
      userId:      data.userId || null,
      title:       data.title.trim(),
      description: data.description || "",
      deadline:    data.deadline    || null,
      priority:    data.priority    || "medium",
      completed:   Boolean(data.completed),
    },
  });

  // Auto-notification
  try {
    const deadlineText = data.deadline ? ` for ${data.deadline}` : "";
    await prisma.notification.create({
      data: {
        id:      `notif_task_${Date.now()}`,
        userId:  data.userId || null,
        title:   "New Study Task Added",
        message: `"${data.title.trim()}" was scheduled${deadlineText}.`,
        type:    "task",
        read:    false,
        link:    "/study-planner",
      },
    });
  } catch (err) {
    console.error("Auto notification error:", err);
  }

  return taskToDto(created);
}

async function update(id, data, userId) {
  const existing = await findById(id, userId);
  if (!existing) return null;

  const taskId = Number(id);
  const updated = await prisma.task.update({
    where: { id: taskId },
    data: {
      title:       data.title !== undefined ? data.title.trim() : undefined,
      description: data.description !== undefined ? data.description : undefined,
      deadline:    data.deadline !== undefined ? data.deadline : undefined,
      priority:    data.priority !== undefined ? data.priority : undefined,
      completed:   data.completed !== undefined ? Boolean(data.completed) : undefined,
    },
  });

  // Achievement notification when completing a task
  if (data.completed === true && !existing.completed) {
    try {
      await prisma.notification.create({
        data: {
          id:      `notif_comp_${Date.now()}`,
          userId:  existing.userId || null,
          title:   "Task Completed! 🎉",
          message: `Great job finishing "${updated.title}"! Keep up the momentum.`,
          type:    "achievement",
          read:    false,
          link:    "/study-planner",
        },
      });
    } catch (err) {
      console.error("Auto completion notification error:", err);
    }
  }

  return taskToDto(updated);
}

async function remove(id, userId) {
  const taskId = Number(id);
  if (Number.isNaN(taskId)) return false;

  const where = userId ? { id: taskId, userId } : { id: taskId };
  const result = await prisma.task.deleteMany({ where });
  return result.count > 0;
}

// ── helpers ──────────────────────────────────────────────────────────────────
function taskToDto(task) {
  return {
    id:          task.id,
    userId:      task.userId,
    title:       task.title,
    description: task.description || "",
    deadline:    task.deadline    || null,
    priority:    task.priority    || "medium",
    completed:   Boolean(task.completed),
    createdAt:   task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
    updatedAt:   task.updatedAt instanceof Date ? task.updatedAt.toISOString() : task.updatedAt,
  };
}

module.exports = { findAll, findById, create, update, remove };
