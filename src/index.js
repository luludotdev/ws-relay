const { createServer } = require('http')
const dotenv = require('dotenv')
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const bodyParser = require('body-parser')
const WebSocket = require('ws')
const { IpFilter: ipFilter, IpDeniedError } = require('express-ipfilter')

// Whitelisted IPs
dotenv.load()
const { IP_ALLOW } = process.env
const IPs = !IP_ALLOW ? ['::1'] : ['::1', ...IP_ALLOW.split('|')]

// Express App
const app = express()
app.set('trust proxy', true)
app.use(ipFilter(IPs, { mode: 'allow' }))
app.use((err, req, res, next) => {
  if (err instanceof IpDeniedError) return res.sendStatus(401)
  else return next()
})
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
