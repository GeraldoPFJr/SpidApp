import type { FastifyReply, FastifyRequest } from 'fastify'
import { env } from '../config/env.js'

export async function authMiddleware(request: FastifyRequest, reply: FastifyReply) {
  const instanceId = request.headers['x-app-instance-id']
  const syncSecret = request.headers['x-sync-secret']

  if (!instanceId || typeof instanceId !== 'string') {
    return reply.status(401).send({ error: 'Missing X-App-Instance-Id header' })
  }

  if (!syncSecret || syncSecret !== env.SYNC_SECRET) {
    return reply.status(401).send({ error: 'Invalid X-Sync-Secret header' })
  }

  request.deviceId = instanceId
}

declare module 'fastify' {
  interface FastifyRequest {
    deviceId: string
  }
}
