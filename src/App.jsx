import { useEffect, useRef, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import './App.css'
import { auth } from './firebase'

const priorityOptions = ['Low', 'Medium', 'High']
const categoryOptions = ['All', 'General', 'Study', 'Work', 'Personal']
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
  const categoryText = task.category || 'General'
  return `${task.text} - ${task.priority} priority, ${categoryText}, ${dateText}`
}

function sortTasksByPriorityAndDate(firstTask, secondTask) {
  const firstPriority = priorityScore[firstTask.priority]
  const secondPriority = priorityScore[secondTask.priority]

  if (firstPriority !== secondPriority) {
    return firstPriority - secondPriority
  }

  if (!firstTask.dueDate) {
    return 1
  }

  if (!secondTask.dueDate) {
    return -1
  }

  return firstTask.dueDate.localeCompare(secondTask.dueDate)
}

function capitalizePriority(priorityText) {
  return priorityText.charAt(0).toUpperCase() + priorityText.slice(1)
}

function formatFriendlyDate(dateText) {
  if (!dateText) {
    return 'No due date'
  }

  return new Date(`${dateText}T00:00:00`).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}

function getWeekDates() {
  return Array.from({ length: 7 }, (_item, index) => {
    const date = new Date()
    date.setDate(date.getDate() + index)

    return {
      label: date.toLocaleDateString([], { weekday: 'short' }),
      date: formatDateForInput(date),
    }
  })
}

function App() {
  const recognitionRef = useRef(null)

  const [user, setUser] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [authMode, setAuthMode] = useState('login')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [tasks, setTasks] = useState([])

  const [taskText, setTaskText] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Medium')
  const [category, setCategory] = useState('General')
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [assistantInput, setAssistantInput] = useState('')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [voiceMessage, setVoiceMessage] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [isAssistantThinking, setIsAssistantThinking] = useState(false)
  const [assistantReply, setAssistantReply] = useState(
    'Ask me anything, or try "plan my day", "summary", or "add study DSA tomorrow high".',
  )

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)

      if (currentUser) {
        const savedTasks = localStorage.getItem(`ai-planner-tasks-${currentUser.uid}`)
        setTasks(savedTasks ? JSON.parse(savedTasks) : [])
      } else {
        setTasks([])
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      localStorage.setItem(`ai-planner-tasks-${user.uid}`, JSON.stringify(tasks))
    }
  }, [tasks, user])

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  function getFriendlyAuthError(error) {
    if (error.code === 'auth/email-already-in-use') {
      return 'This email is already registered. Try logging in instead.'
    }

    if (error.code === 'auth/invalid-credential') {
      return 'Email or password is incorrect.'
    }

    if (error.code === 'auth/weak-password') {
      return 'Password should be at least 6 characters.'
    }

    if (error.code === 'auth/configuration-not-found') {
      return 'Firebase Auth is not enabled yet. Turn on Email/Password sign-in in Firebase.'
    }

    return error.message
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setAuthError('')

    try {
      if (authMode === 'signup') {
        await createUserWithEmailAndPassword(auth, authEmail, authPassword)
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword)
      }

      setAuthEmail('')
      setAuthPassword('')
    } catch (error) {
      setAuthError(getFriendlyAuthError(error))
    }
  }

  async function handleLogout() {
    await signOut(auth)
    setAssistantOpen(false)
  }

  function createTask(text, date, taskPriority, taskCategory = 'General') {
    const newTask = {
      id: Date.now(),
      text,
      dueDate: date,
      priority: taskPriority,
      category: taskCategory,
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

    createTask(taskText.trim(), dueDate, priority, category)
    setTaskText('')
    setDueDate('')
    setPriority('Medium')
    setCategory('General')
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

  function getGeneralAssistantReply(command) {
    if (command.includes('hello') || command.includes('hi')) {
      return 'Hey! I can help with your tasks, planning, motivation, and simple questions.'
    }

    if (command.includes('what can you do') || command.includes('help')) {
      return 'I can add tasks, plan your day, show urgent work, summarize your list, take voice input, and answer simple offline questions.'
    }

    if (command.includes('time')) {
      return `The current time is ${new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}.`
    }

    if (command.includes('date') || command.includes('day is it')) {
      return `Today is ${new Date().toLocaleDateString([], {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })}.`
    }

    if (command.includes('thank')) {
      return 'You are welcome. I am right here when you want to plan the next thing.'
    }

    if (command.includes('who are you')) {
      return 'I am your offline planner assistant. I can manage tasks and give simple helpful replies without using an API.'
    }

    if (command.includes('how to focus') || command.includes('focus')) {
      return 'Pick one small task, set a 25 minute timer, and remove one distraction before you start.'
    }

    return 'I am running without an AI API, so I cannot truly answer everything yet. Ask me in simple words and I will try to help, or use commands like "add study DSA tomorrow high", "summary", and "plan my day".'
  }

  async function askAiAssistant(message) {
    const response = await fetch('/api/assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        tasks,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'The AI assistant could not answer.')
    }

    return data.reply
  }

  function getVoiceErrorMessage(error) {
    if (error === 'not-allowed') {
      return 'Microphone permission was blocked. Please allow mic access in your browser.'
    }

    if (error === 'no-speech') {
      return 'I did not hear anything. Please try again.'
    }

    if (error === 'network') {
      return 'Speech recognition needs browser network support. Please try again.'
    }

    return 'Could not hear that clearly. Please try again.'
  }

  function toggleVoiceInput() {
    const SpeechRecognition =
      globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition

    if (!SpeechRecognition) {
      setVoiceMessage('Speech recognition is not supported in this browser.')
      return
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop()
      setVoiceMessage('Voice input stopped.')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false
    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsListening(true)
      setVoiceMessage('Listening...')
    }

    recognition.onresult = (event) => {
      const spokenText = event.results[0][0].transcript
      setAssistantInput(spokenText)
      setVoiceMessage('Voice added to assistant input. Press Send to run it.')
    }

    recognition.onerror = (event) => {
      setVoiceMessage(getVoiceErrorMessage(event.error))
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    try {
      recognition.start()
    } catch {
      setVoiceMessage('Voice input is already starting. Please try again.')
    }
  }

  async function handleAssistantSubmit(event) {
    event.preventDefault()

    const command = assistantInput.trim().toLowerCase()
    const originalMessage = assistantInput.trim()

    if (originalMessage === '') {
      return
    }

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
      setIsAssistantThinking(true)
      setAssistantReply('Thinking...')

      try {
        const aiReply = await askAiAssistant(originalMessage)
        setAssistantReply(aiReply)
      } catch (error) {
        setAssistantReply(
          `${error.message}\n\nOffline fallback: ${getGeneralAssistantReply(command)}`,
        )
      } finally {
        setIsAssistantThinking(false)
      }
    }

    setAssistantInput('')
  }

  const completedCount = tasks.filter((task) => task.completed).length
  const pendingCount = tasks.length - completedCount
  const today = getTodayDate()
  const weekDates = getWeekDates()
  const todayTasks = tasks
    .filter((task) => task.dueDate === today && !task.completed)
    .sort(sortTasksByPriorityAndDate)
  const highPriorityCount = tasks.filter((task) => {
    return task.priority === 'High' && !task.completed
  }).length
  const nextDueTask = tasks
    .filter((task) => task.dueDate && !task.completed)
    .sort(sortTasksByPriorityAndDate)[0]
  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = task.text
        .toLowerCase()
        .includes(searchText.trim().toLowerCase())
      const matchesCategory =
        categoryFilter === 'All' || (task.category || 'General') === categoryFilter

      return matchesSearch && matchesCategory
    })
    .sort(sortTasksByPriorityAndDate)

  if (authLoading) {
    return (
      <main className="app auth-shell">
        <section className="auth-card">
          <p className="eyebrow">AI Task Planner</p>
          <h1>Loading your workspace...</h1>
          <p>Checking your sign-in session.</p>
        </section>
      </main>
    )
  }

  if (!user) {
    return (
      <main className="app auth-shell">
        <section className="auth-card">
          <p className="eyebrow">Secure Planner</p>
          <h1>{authMode === 'signup' ? 'Create your account' : 'Welcome back'}</h1>
          <p>
            Sign in to keep your tasks private. Each Firebase user gets a separate
            task workspace on this device.
          </p>

          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <label>
              Email
              <input
                type="email"
                placeholder="you@example.com"
                value={authEmail}
                onChange={(event) => setAuthEmail(event.target.value)}
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                placeholder="At least 6 characters"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
                required
              />
            </label>

            {authError && <p className="auth-error">{authError}</p>}

            <button type="submit">
              {authMode === 'signup' ? 'Sign Up' : 'Login'}
            </button>
          </form>

          <button
            className="auth-switch"
            type="button"
            onClick={() => {
              setAuthMode(authMode === 'signup' ? 'login' : 'signup')
              setAuthError('')
            }}
          >
            {authMode === 'signup'
              ? 'Already have an account? Login'
              : 'New here? Create an account'}
          </button>
        </section>
      </main>
    )
  }

  return (
    <main className="app">
      <section className="hero">
        <div>
          <p className="eyebrow">AI Task Planner</p>
          <h1>Plan smarter. Finish calmer.</h1>
          <p className="hero-text">
            Keep tasks, due dates, and priorities in one focused workspace.
          </p>
          <div className="user-bar">
            <span>Signed in as {user.email}</span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>
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
          <div>
            <span>{pendingCount}</span>
            <p>Pending</p>
          </div>
          <div>
            <span>{highPriorityCount}</span>
            <p>High Priority</p>
          </div>
        </div>
      </section>

      <section className="dashboard">
        <div className="dashboard-card focus-card">
          <p className="section-label">Today</p>
          <h2>{todayTasks.length} tasks due today</h2>
          <p>
            {todayTasks.length > 0
              ? 'Start with the highest priority item and keep momentum simple.'
              : 'No unfinished tasks are due today. Great space to plan ahead.'}
          </p>
        </div>

        <div className="dashboard-card">
          <p className="section-label">Next Due</p>
          <h2>{nextDueTask ? nextDueTask.text : 'Nothing scheduled'}</h2>
          <p>
            {nextDueTask
              ? formatFriendlyDate(nextDueTask.dueDate)
              : 'Add due dates to see your next deadline.'}
          </p>
        </div>
      </section>

      <section className="insights-grid">
        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="section-label">Today Tasks</p>
              <h2>Focus queue</h2>
            </div>
          </div>

          {todayTasks.length === 0 ? (
            <div className="mini-empty">
              <h3>No tasks due today</h3>
              <p>Add a task with today as the due date to build your focus queue.</p>
            </div>
          ) : (
            <div className="compact-list">
              {todayTasks.map((task) => (
                <div className="compact-task" key={`today-${task.id}`}>
                  <span>{task.text}</span>
                  <small>
                    {task.priority} / {task.category || 'General'}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="panel">
          <div className="section-heading">
            <div>
              <p className="section-label">Weekly Overview</p>
              <h2>Next 7 days</h2>
            </div>
          </div>

          <div className="week-grid">
            {weekDates.map((day) => {
              const dayTasks = tasks.filter((task) => task.dueDate === day.date)

              return (
                <div className="week-day" key={day.date}>
                  <span>{day.label}</span>
                  <strong>{dayTasks.length}</strong>
                  <small>{formatFriendlyDate(day.date)}</small>
                </div>
              )
            })}
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

          <label>
            Category
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              {categoryOptions
                .filter((option) => option !== 'All')
                .map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
            </select>
          </label>

          <button type="submit">Add Task</button>
        </form>

        <div className="task-list">
          <div className="toolbar">
            <label>
              Search
              <input
                type="search"
                placeholder="Search tasks..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
              />
            </label>

            <label>
              Category
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                {categoryOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {tasks.length === 0 ? (
            <div className="empty-state">
              <h2>No tasks yet</h2>
              <p>Add your first task or ask the AI assistant to create one for you.</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="empty-state">
              <h2>No matching tasks</h2>
              <p>Try a different search term or category filter.</p>
            </div>
          ) : (
            filteredTasks.map((task) => (
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
                  <span>{formatFriendlyDate(task.dueDate)}</span>
                  <span>{task.category || 'General'}</span>
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
                <h2>AI Assistant</h2>
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
                <div className="assistant-input-row">
                  <input
                    type="text"
                    placeholder="Ask anything or add a task"
                    value={assistantInput}
                    onChange={(event) => setAssistantInput(event.target.value)}
                  />
                  <button
                    className="mic-button"
                    type="button"
                    onClick={toggleVoiceInput}
                    aria-label="Use voice input"
                  >
                    {isListening ? 'Stop' : 'Mic'}
                  </button>
                </div>
              </label>
              {voiceMessage && <p className="voice-message">{voiceMessage}</p>}
              <button type="submit">Send</button>
              {isAssistantThinking && <p className="voice-message">AI is writing...</p>}
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
