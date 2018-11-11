const { createServer } = require('http')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')
const WebSocket = require('ws')

// Express App
const app = express()
app.set('trust proxy', true)
app.use(morgan('combined'))
app.use(cors())
app.use(bodyParser.json())
app.use((req, res, next) => {
  res.set('X-Docker-Hostname', process.env.HOSTNAME)
  res.removeHeader('X-Powered-By')
  next()
})

app.post('*', (req, res) => {
  wss.broadcast(req.body)
  return res.sendStatus(200)
})

// WS
const server = createServer(app)
const wss = new WebSocket.Server({ server })

wss.broadcast = function broadcast (data) {
  const payload = JSON.stringify(data)
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) client.send(payload)
  })
}

server.listen(process.env.PORT || 3000, () => {
  console.log(`Server started on port ${server.address().port} :)`)
})
