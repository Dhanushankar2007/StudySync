
import { useState, useEffect } from "react";
import "../study-planner.css";

function getDeadlineStatus(task) {
  if (task.completed) {
    return "Completed";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(`${task.dueDate}T00:00:00`);

  if (dueDate < today) {
    return "Overdue";
  }

  if (dueDate.getTime() === today.getTime()) {
    return "Due today";
  }

  return "Upcoming";
}

function StudyPlannerPage() {
 
const [tasks, setTasks] = useState(() => {
  try {
    const savedTasks = localStorage.getItem(
      "studysync-study-planner-tasks"
    );

    if (savedTasks !== null) {
      const parsedTasks = JSON.parse(savedTasks);

      if (Array.isArray(parsedTasks)) {
        return parsedTasks;
      }
    }
  } catch (error) {
    console.error("Could not load saved study tasks:", error);
  }

  return [
    {
      id: 1,
      title: "Review lecture notes",
      subject: "Computer Science",
      dueDate: "2026-10-21",
      priority: "High",
      completed: false,
    },
    {
      id: 2,
      title: "Practice mathematics problems",
      subject: "Mathematics",
      dueDate: "2026-10-23",
      priority: "Medium",
      completed: false,
    },
  ];
});


  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [filter, setFilter] = useState("All");
  const [editingTaskId, setEditingTaskId] = useState(null);

  function handleAddTask(event) {
    event.preventDefault();

if (editingTaskId !== null) {
  setTasks((currentTasks) =>
    currentTasks.map((task) =>
      task.id === editingTaskId
        ? {
            ...task,
            title: title.trim(),
            subject: subject.trim(),
            dueDate,
            priority,
          }
        : task
    )
  );

  handleCancelEdit();
  return;
}


    const newTask = {
      id: Date.now(),
      title: title.trim(),
      subject: subject.trim(),
      dueDate,
      priority,
      completed: false,
    };

    setTasks((currentTasks) => [...currentTasks, newTask]);

    setTitle("");
    setSubject("");
    setDueDate("");
    setPriority("Medium");
  }

  function handleToggleTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  }

  function handleDeleteTask(taskId) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId)
    );
  }

function handleStartEdit(task) {
  setEditingTaskId(task.id);
  setTitle(task.title);
  setSubject(task.subject);
  setDueDate(task.dueDate);
  setPriority(task.priority);
}

function handleCancelEdit() {
  setEditingTaskId(null);
  setTitle("");
  setSubject("");
  setDueDate("");
  setPriority("Medium");
}


  const completedCount = tasks.filter((task) => task.completed).length;

useEffect(() => {
  try {
    localStorage.setItem(
      "studysync-study-planner-tasks",
      JSON.stringify(tasks)
    );
  } catch (error) {
    console.error("Could not save study tasks:", error);
  }
}, [tasks]);


const filteredTasks = tasks.filter((task) => {
  if (filter === "Pending") {
    return !task.completed;
  }

  if (filter === "Completed") {
    return task.completed;
  }

  return true;
});


  return (
    <section className="planner-page">
      <header className="planner-header">
        <div>
          <p className="planner-eyebrow">YOUR LEARNING, ORGANIZED</p>
          <h2>Study Planner</h2>
          <p>Plan your tasks, stay on track, and reach your study goals.</p>
        </div>

        <div className="planner-progress">
          <span>Completed tasks</span>
          <strong>{completedCount} / {tasks.length}</strong>
        </div>
      </header>

      <section className="planner-panel">
        <h3>Add a study task</h3>

        <form className="planner-form" onSubmit={handleAddTask}>
          <label>
            Task name
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Review chapter 3"
              required
            />
          </label>

          <label>
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Biology"
              required
            />
          </label>

          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              required
            />
          </label>

          <label>
            Priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </label>

          <button type="submit" className="planner-add-button">
  {editingTaskId !== null ? "Save changes" : "+ Add task"}
</button>

{editingTaskId !== null && (
  <button
    type="button"
    className="planner-cancel-button"
    onClick={handleCancelEdit}
  >
    Cancel
  </button>
)}
        </form>
      </section>

      <section className="planner-panel">
        <div className="planner-list-header">
          <h3>Your study tasks</h3>
          <span>{tasks.length} total</span>
        </div>

<div className="planner-filters">
  {["All", "Pending", "Completed"].map((option) => (
    <button
      key={option}
      type="button"
      className={`planner-filter-button ${
        filter === option ? "active" : ""
      }`}
      onClick={() => setFilter(option)}
    >
      {option}
      {option === "All" && ` (${tasks.length})`}
      {option === "Pending" &&
        ` (${tasks.filter((task) => !task.completed).length})`}
      {option === "Completed" && ` (${completedCount})`}
    </button>
  ))}
</div>


        {filteredTasks.length === 0 ? (
         <p className="planner-empty">
  {tasks.length === 0
    ? "No tasks yet. Add your first study task above!"
    : `No ${filter.toLowerCase()} tasks to show.`}
</p>
        ) : (
          <div className="planner-task-list">
            {filteredTasks.map((task) => (
              <article className="planner-task" key={task.id}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => handleToggleTask(task.id)}
                  aria-label={`Mark ${task.title} as ${
                    task.completed ? "incomplete" : "complete"
                  }`}
                />

                <div className="planner-task-details">
                  <h4 className={task.completed ? "task-completed" : ""}>
                    {task.title}
                  </h4>
                  <p>
                    {task.subject} · Due{" "}
                    {new Date(`${task.dueDate}T00:00:00`).toLocaleDateString()}
                  </p>

<span
  className={`planner-deadline-status status-${getDeadlineStatus(
    task
  )
    .toLowerCase()
    .replace(" ", "-")}`}
>
  {getDeadlineStatus(task)}
</span>

                </div>

                <span
                  className={`planner-priority priority-${task.priority.toLowerCase()}`}
                >
                  {task.priority}
                </span>
<button
  type="button"
  className="planner-edit-button"
  onClick={() => handleStartEdit(task)}
>
  Edit
</button>
                <button
                  type="button"
                  className="planner-delete-button"
                  onClick={() => handleDeleteTask(task.id)}
                  aria-label={`Delete ${task.title}`}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}

export default StudyPlannerPage;
