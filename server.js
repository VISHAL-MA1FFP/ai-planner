import 'dotenv/config'
import process from 'node:process'
import express from 'express'
import OpenAI from 'openai'

const app = express()
const port = process.env.PORT || 3001
const model = process.env.OPENAI_MODEL || 'gpt-4.1-mini'

app.use(express.json())

app.get('/api/health', (_request, response) => {
  response.json({ ok: true })
})

app.post('/api/assistant', async (request, response) => {
  try {
    const { message, tasks } = request.body

    if (!process.env.OPENAI_API_KEY) {
      return response.status(500).json({
        error: 'Missing OPENAI_API_KEY. Add it to your .env file.',
      })
    }

    if (!message || typeof message !== 'string') {
      return response.status(400).json({
        error: 'Message is required.',
      })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const taskContext = Array.isArray(tasks)
      ? tasks
          .map((task) => {
            const status = task.completed ? 'completed' : 'pending'
            const dueDate = task.dueDate || 'no due date'
            const category = task.category || 'General'
            return `- ${task.text} (${category}, ${task.priority}, ${dueDate}, ${status})`
          })
          .join('\n')
      : 'No task context was provided.'

    const aiResponse = await openai.responses.create({
      model,
      instructions:
        'You are a friendly AI task planner assistant. Answer clearly and helpfully. If the user asks about their tasks, use the task context. Keep responses concise unless the user asks for detail.',
      input: `Current tasks:\n${taskContext}\n\nUser message: ${message}`,
    })

    response.json({
      reply: aiResponse.output_text,
    })
  } catch (error) {
    console.error(error)
    response.status(500).json({
      error: error.message || 'The AI assistant could not answer right now.',
    })
  }
})

app.listen(port, () => {
  console.log(`AI backend running on http://localhost:${port}`)
})
