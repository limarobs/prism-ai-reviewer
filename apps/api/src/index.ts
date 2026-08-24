import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('/api/*', cors())

app.get('/api/health', (context) =>
  context.json({
    service: 'prism-api',
    status: 'ok',
  }),
)

export default app
