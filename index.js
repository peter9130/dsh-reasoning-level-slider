/**
 * Host half of the reasoning-slider bundle.
 *
 * The visible feature lives in the browser half (`client.js`), which appends a
 * reasoning-effort slider to the composer model menu. A slot entry that throws
 * while rendering abdicates silently in the page, so this half owns one small
 * diagnostic sink: the browser half POSTs the exact failure and it lands in
 * `~/.dsh/reasoning-slider.log`.
 *
 * This plugin has no Config.
 */
import { appendFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'

const LOG_PATH = join(homedir(), '.dsh', 'reasoning-slider.log')
/** Cap one reported body so a hostile page cannot grow the request buffer. */
const MAX_BODY_BYTES = 64 * 1024
/** Cap one logged line so the log stays readable. */
const MAX_LOG_CHARS = 8000

/** Collapse a crash loop: one line per distinct report per ten seconds. */
let lastReport = ''
let lastReportAt = 0

/**
 * Append one reported browser-side failure, dropping immediate repeats.
 * @param body - Raw request body from the browser half.
 */
function record(body) {
  const now = Date.now()
  if (body === lastReport && now - lastReportAt < 10_000) return
  lastReport = body
  lastReportAt = now
  appendFile(LOG_PATH, `${new Date(now).toISOString()} ${body}\n`).catch(() => {})
}

/**
 * Mount the diagnostic sink.
 * @param ctx - Host plugin context.
 */
export function apply(ctx) {
  ctx.inject(['webServer'], (scope) => {
    scope.effect(() => scope.webServer.register({
      kind: 'exact',
      path: '/dsh-reasoning-slider/log',
      handler: (req, res) => {
        if (req.method !== 'POST') {
          res.writeHead(405)
          res.end()
          return
        }
        const chunks = []
        let received = 0
        let settled = false
        const finish = (status) => {
          if (settled) return
          settled = true
          res.writeHead(status)
          res.end()
        }
        req.on('data', (chunk) => {
          if (settled) return
          received += chunk.length
          if (received > MAX_BODY_BYTES) {
            chunks.length = 0
            finish(413)
            req.destroy()
            return
          }
          chunks.push(chunk)
        })
        req.on('end', () => {
          if (settled) return
          const body = Buffer.concat(chunks).toString('utf8').slice(0, MAX_LOG_CHARS)
          if (body.length > 0) record(body)
          finish(204)
        })
        req.on('error', () => { finish(400) })
        req.on('aborted', () => { finish(400) })
        req.on('close', () => { if (!settled && !req.complete) finish(400) })
      },
    }), 'reasoning-slider: diagnostic sink')
  })
}
