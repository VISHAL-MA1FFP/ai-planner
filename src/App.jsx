import { useEffect, useState } from 'react'
import './App.css'

const priorityOptions = ['Low', 'Medium', 'High']

function App() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('ai-planner-tasks')
    return savedTasks ? JSON.parse(savedTasks) : []
  })

  const [taskText, setTaskText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')

  useEffect(() => {
    localStorage.setItem('ai-planner-tasks', JSON.stringify(tasks))
  }, [tasks])

  function addTask(event) {
    event.preventDefault()

    if (taskText.trim() === '') {
      return
    }

    const newTask = {
      id: Date.now(),
      text: taskText.trim(),
      dueDate,
      priority,
      completed: false,
    }

    setTasks([newTask, ...tasks])
    setTaskText('')
    setDueDate('')
    setPriority('Medium')
  }

  function toggleTaskComplete(taskId) {
    const updatedTasks = tasks.map((task) => {
      if (task.id === taskId) {
        return { ...task, completed: !task.completed }
      }

      return task
    })

    setTasks(updatedTasks)
  }

  function deleteTask(taskId) {
    const remainingTasks = tasks.filter((task) => task.id !== taskId)
    setTasks(remainingTasks)
  }

  const completedCount = tasks.filter((task) => task.completed).length

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">AI Task Planner</p>
          <h1>Plan smarter. Finish calmer.</h1>
          <p className="hero-text">
            Keep tasks, due dates, and priorities in one focused workspace.
          </p>
        </div>

        <div className="stats">
          <div>
            <span>{tasks.length}</span>
            <p>Total</p>
          </div>
          <div>
            <span>{completedCount}</span>
            <p>Done</p>
          </div>
        </div>
      </section>

      <section className="planner">
        <form className="task-form" onSubmit={addTask}>
          <label>
            Task
            <input
              type="text"
              placeholder="Write a task..."
              value={taskText}
              onChange={(event) => setTaskText(event.target.value)}
            />
          </label>

          <label>
            Due date
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
            />
          </label>

          <label>
            Priority
            <select
              value={priority}
              onChange={(event) => setPriority(event.target.value)}
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <button type="submit">Add Task</button>
        </form>

        <div className="task-list">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <h2>No tasks yet</h2>
              <p>Add your first task to start planning your day.</p>
            </div>
          ) : (
            tasks.map((task) => (
              <article
                className={`task-card ${task.completed ? 'completed' : ''}`}
                key={task.id}
              >
                <label className="task-check">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTaskComplete(task.id)}
                  />
                  <span>{task.text}</span>
                </label>

                <div className="task-details">
                  <span>{task.dueDate || 'No due date'}</span>
                  <span className={`priority ${task.priority.toLowerCase()}`}>
                    {task.priority}
                  </span>
                </div>

                <button
                  className="delete-button"
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete ${task.text}`}
                >
                  Delete
                </button>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

export default App
