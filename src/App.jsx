import { useEffect, useState } from 'react'
import './App.css'

const priorityOptions = ['Low', 'Medium', 'High']
const priorityScore = {
  High: 1,
  Medium: 2,
  Low: 3,
}

function getTodayDate() {
  return formatDateForInput(new Date())
}

function getTomorrowDate() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  return formatDateForInput(tomorrow)
}

function formatDateForInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function formatTask(task) {
  const dateText = task.dueDate ? `due ${task.dueDate}` : 'no due date'
  return `${task.text} - ${task.priority} priority, ${dateText}`
}

function sortTasksByPriorityAndDate(firstTask, secondTask) {
  const firstPriority = priorityScore[firstTask.priority]
  const secondPriority = priorityScore[secondTask.priority]

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority
  }

  return firstTask.dueDate.localeCompare(secondTask.dueDate)
}

function capitalizePriority(priorityText) {
  return priorityText.charAt(0).toUpperCase() + priorityText.slice(1)
}

function App() {
  const [tasks, setTasks] = useState(() => {
    const savedTasks = localStorage.getItem('ai-planner-tasks')
    return savedTasks ? JSON.parse(savedTasks) : []
  })

  const [taskText, setTaskText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [assistantReply, setAssistantReply] = useState(
    'Try typing "plan my day", "show urgent", "motivate me", or "summary".',
  )

  useEffect(() => {
    localStorage.setItem('ai-planner-tasks', JSON.stringify(tasks))
  }, [tasks])

  function createTask(text, date, taskPriority) {
    const newTask = {
      id: Date.now(),
      text,
      dueDate: date,
      priority: taskPriority,
      completed: false,
    }

    setTasks((currentTasks) => [newTask, ...currentTasks])
    return newTask
  }

  function addTask(event) {
    event.preventDefault()

    if (taskText.trim() === '') {
      return
    }

    createTask(taskText.trim(), dueDate, priority)
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

  function planMyDay() {
    const today = getTodayDate()
    const todaysTasks = tasks
      .filter((task) => task.dueDate === today && !task.completed)
      .sort(sortTasksByPriorityAndDate)

    if (todaysTasks.length === 0) {
      return 'You do not have any unfinished tasks due today. Nice breathing room.'
    }

    return todaysTasks.map(formatTask).join('\n')
  }

  function showUrgentTasks() {
    const today = getTodayDate()
    const threeDaysFromNow = new Date()
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3)
    const soon = formatDateForInput(threeDaysFromNow)

    const urgentTasks = tasks
      .filter((task) => {
        return (
          task.priority === 'High' &&
          task.dueDate !== '' &&
          task.dueDate >= today &&
          task.dueDate <= soon &&
          !task.completed
        )
      })
      .sort(sortTasksByPriorityAndDate)

    if (urgentTasks.length === 0) {
      return 'No high priority tasks are due in the next 3 days.'
    }

    return urgentTasks.map(formatTask).join('\n')
  }

  function showSummary() {
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.completed).length
    const pendingTasks = totalTasks - completedTasks

    return `Total tasks: ${totalTasks}\nCompleted tasks: ${completedTasks}\nPending tasks: ${pendingTasks}`
  }

  function addTaskFromAssistant(command) {
    const words = command.split(' ')
    const taskWords = words.slice(1)
    let taskPriority = 'Medium'
    let taskDate = ''

    const lastWord = taskWords[taskWords.length - 1]

    if (['low', 'medium', 'high'].includes(lastWord)) {
      taskPriority = capitalizePriority(lastWord)
      taskWords.pop()
    }

    const dateWord = taskWords[taskWords.length - 1]

    if (dateWord === 'today') {
      taskDate = getTodayDate()
      taskWords.pop()
    } else if (dateWord === 'tomorrow') {
      taskDate = getTomorrowDate()
      taskWords.pop()
    }

    const newTaskText = taskWords.join(' ').trim()

    if (newTaskText === '') {
      return 'Please tell me what task to add. Example: add study DSA tomorrow high'
    }

    const newTask = createTask(newTaskText, taskDate, taskPriority)
    const dateText = newTask.dueDate ? ` for ${newTask.dueDate}` : ''

    return `Added "${newTask.text}"${dateText} with ${newTask.priority} priority.`
  }

  function handleAssistantSubmit(event) {
    event.preventDefault()

    const command = assistantInput.trim().toLowerCase()

    if (command === 'plan my day') {
      setAssistantReply(planMyDay())
    } else if (command === 'show urgent') {
      setAssistantReply(showUrgentTasks())
    } else if (command === 'motivate me') {
      setAssistantReply('You are closer than you think. Pick one task and move it forward.')
    } else if (command === 'summary') {
      setAssistantReply(showSummary())
    } else if (command.startsWith('add ')) {
      setAssistantReply(addTaskFromAssistant(command))
    } else {
      setAssistantReply(
        'I know these commands: "plan my day", "show urgent", "motivate me", "summary", and "add study DSA tomorrow high".',
      )
    }

    setAssistantInput('')
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

      <div className="assistant-widget">
        {assistantOpen && (
          <aside className="assistant-popover">
            <div className="assistant-header">
              <div className="bot-face" aria-hidden="true">
                AI
              </div>
              <div>
                <p className="eyebrow">Rule-Based Bot</p>
                <h2>Assistant</h2>
              </div>
            </div>

            <div className="assistant-reply">
              {assistantReply.split('\n').map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>

            <form className="assistant-form" onSubmit={handleAssistantSubmit}>
              <label>
                Assistant
                <input
                  type="text"
                  placeholder="add study DSA tomorrow high"
                  value={assistantInput}
                  onChange={(event) => setAssistantInput(event.target.value)}
                />
              </label>
              <button type="submit">Send</button>
            </form>
          </aside>
        )}

        <button
          className="bot-button"
          type="button"
          onClick={() => setAssistantOpen(!assistantOpen)}
          aria-expanded={assistantOpen}
          aria-label="Open planner assistant"
        >
          <span>AI</span>
        </button>
      </div>
    </main>
  )
}

export default App
