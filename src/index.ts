import cors from '@koa/cors'
import { createServer } from 'http'
import Koa from 'koa'
import bodyParser from 'koa-bodyparser'
import signale from 'signale'
import { OPEN, Server as WebSocketServer } from 'ws'
import { AUTH_TOKEN, PORT } from './env'

signale.config({
  displayTimestamp: true,
})

const koa = new Koa()
const server = createServer(koa.callback())

const wss = new WebSocketServer({ server })
wss.on('connection', (_, req) => {
  const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
  signale.info(`Incoming socket connection from ${ip}`)
})

const broadcastWS = (data: object) => {
  const payload = JSON.stringify(data)
  wss.clients.forEach(client => {
    if (client.readyState === OPEN) client.send(payload)
  })
}

koa.proxy = true
koa.use(cors())
koa.use(bodyParser({ enableTypes: ['json'] }))
koa.use(ctx => {
  if (ctx.method !== 'POST') return (ctx.response.status = 405)

  if (AUTH_TOKEN) {
    const { authorization } = ctx.req.headers
    if (!authorization) return (ctx.response.status = 401)

    const [, token] = authorization.split('Bearer ')
    if (token !== AUTH_TOKEN) return (ctx.response.status = 401)
  }

  signale.info(`Incoming POST request from ${ctx.ip}`)
  ctx.response.status = 204

  broadcastWS(ctx.request.body)
})

server
  .listen(PORT)
  .on('listening', () => signale.start(`Listening on port ${PORT}`))
