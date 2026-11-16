/**
 * Reasoning slider — browser half.
 *
 * Adds one entry to `conversation.input.model.options`, the composer model
 * menu's session-options slot: a reasoning-effort slider for the model that is
 * currently selected. The entry is additive, so the shipped menu (模型 row,
 * 推理等级 row, search, badges) and every other plugin's option entries stay
 * untouched.
 *
 * Data and submission ride the shared per-session `ctx.modelDirectories`
 * directory — the same store and `select()` call the shipped selector uses — so
 * a drag updates the trigger caption, the 推理等级 row, and the /model popup at
 * once. Levels come from the Host's catalog (`model.reasoning.efforts`), never
 * from a client-owned vocabulary; a model without selectable levels renders
 * nothing, and a provider default with no explicit effort gets a leading
 * "默认" step, mirroring the shipped list.
 *
 * Drags are local until release: the thumb follows the pointer, and only the
 * released level is submitted (one RPC per gesture). Arrow keys submit one
 * level per key press and are consumed so the menu's own arrow navigation does
 * not move focus away.
 *
 * Styling uses only `--dsw-alias-*` theme tokens (with rgba fallbacks for
 * `color-mix`) and `rsl-` prefixed classes; controls are written here instead
 * of importing Harness Client packages.
 */
window.__ModuleLoader__.load({
  id: '@local/dsh-reasoning-slider',
  factory(require) {
    const React = require('react')
    const h = React.createElement

    const NS = 'reasoning-slider'

    /* ------------------------------------------------------------------ *
     * Dictionaries
     * ------------------------------------------------------------------ */

    const zh = {
      'hint': '更快消耗使用额度',
      'aria.slider': '推理等级：{name}',
      'aria.group': '推理等级',
      'level.default': '默认',
      'pending': '正在切换到{name}…',
      'announce': '推理等级已切换到{name}',
      'loading': '正在读取推理等级…',
      'error.load': '无法读取推理等级：{message}',
      'error.switch': '切换推理等级失败：{message}',
      'retry': '重试',
    }

    const en = {
      'hint': 'Higher effort uses more quota',
      'aria.slider': 'Reasoning effort: {name}',
      'aria.group': 'Reasoning effort',
      'level.default': 'Default',
      'pending': 'Switching to {name}…',
      'announce': 'Reasoning effort set to {name}',
      'loading': 'Reading reasoning levels…',
      'error.load': 'Could not read reasoning levels: {message}',
      'error.switch': 'Could not switch reasoning effort: {message}',
      'retry': 'Retry',
    }

    /* ------------------------------------------------------------------ *
     * Styles
     * ------------------------------------------------------------------ */

    const CSS = `
.rsl-entry {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  display: block;
  user-select: none;
  -webkit-user-select: none;
}
.rsl-panel {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  margin: 2px 0 0;
  padding: 9px 10px 11px;
  border-radius: 10px;
  border: 1px solid rgba(124, 92, 255, 0.30);
  border-color: color-mix(in srgb, var(--dsw-alias-brand-primary) 30%, transparent);
  background: rgba(124, 92, 255, 0.08);
  background-image: linear-gradient(
    180deg,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 15%, transparent),
    color-mix(in srgb, var(--dsw-alias-brand-primary) 5%, transparent)
  );
}
.rsl-caption {
  margin: 0 0 7px;
  overflow: hidden;
  color: var(--dsw-alias-brand-primary);
  font-size: 11px;
  line-height: 16px;
  letter-spacing: 0.2px;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  opacity: 0.92;
}
.rsl-track {
  position: relative;
  box-sizing: border-box;
  height: 28px;
  border-radius: 14px;
  background: rgba(124, 92, 255, 0.14);
  box-shadow: inset 0 0 0 1px rgba(124, 92, 255, 0.20);
  cursor: grab;
  outline: none;
  touch-action: none;
}
.rsl-track:active,
.rsl-dragging .rsl-track {
  cursor: grabbing;
}
.rsl-track:focus-visible {
  box-shadow:
    inset 0 0 0 1px rgba(124, 92, 255, 0.20),
    0 0 0 2px var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
}
.rsl-track[aria-disabled="true"] {
  cursor: default;
}
.rsl-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: calc(11px + (100% - 22px) * var(--rsl-pct, 0));
  overflow: hidden;
  border-radius: 14px;
  background: rgba(124, 92, 255, 0.85);
  background-image: linear-gradient(
    90deg,
    color-mix(in srgb, var(--dsw-alias-brand-primary) 72%, transparent),
    var(--dsw-alias-brand-primary)
  );
  transition: width 120ms ease;
}
.rsl-stars {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 6% 32%, rgba(255, 255, 255, 0.95) 0 1px, transparent 1.8px),
    radial-gradient(circle at 14% 68%, rgba(255, 255, 255, 0.70) 0 0.8px, transparent 1.6px),
    radial-gradient(circle at 22% 44%, rgba(255, 255, 255, 0.90) 0 1.1px, transparent 2px),
    radial-gradient(circle at 30% 26%, rgba(255, 255, 255, 0.65) 0 0.7px, transparent 1.4px),
    radial-gradient(circle at 38% 62%, rgba(255, 255, 255, 0.90) 0 1px, transparent 1.9px),
    radial-gradient(circle at 46% 38%, rgba(255, 255, 255, 0.60) 0 0.7px, transparent 1.4px),
    radial-gradient(circle at 55% 70%, rgba(255, 255, 255, 0.85) 0 0.9px, transparent 1.7px),
    radial-gradient(circle at 63% 30%, rgba(255, 255, 255, 0.75) 0 0.8px, transparent 1.5px),
    radial-gradient(circle at 71% 56%, rgba(255, 255, 255, 0.90) 0 1px, transparent 1.8px),
    radial-gradient(circle at 79% 24%, rgba(255, 255, 255, 0.60) 0 0.7px, transparent 1.3px),
    radial-gradient(circle at 86% 66%, rgba(255, 255, 255, 0.80) 0 0.9px, transparent 1.6px),
    radial-gradient(circle at 94% 40%, rgba(255, 255, 255, 0.90) 0 1px, transparent 1.8px);
  opacity: 0.9;
  pointer-events: none;
}
.rsl-spark {
  position: absolute;
  color: rgba(255, 255, 255, 0.92);
  font-size: 7px;
  line-height: 1;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.rsl-thumb {
  position: absolute;
  top: 3px;
  left: calc(11px + (100% - 22px) * var(--rsl-pct, 0));
  width: 22px;
  height: 22px;
  margin-left: -11px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow:
    0 1px 3px rgba(20, 12, 50, 0.35),
    0 0 0 1px rgba(124, 92, 255, 0.25);
  pointer-events: none;
  transition: left 120ms ease;
}
.rsl-dragging .rsl-fill,
.rsl-dragging .rsl-thumb {
  transition: none;
}
.rsl-busy {
  opacity: 0.7;
}
.rsl-busy .rsl-track {
  cursor: default;
}
.rsl-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  border: 0;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.rsl-error {
  margin-top: 7px;
  color: var(--dsw-alias-state-error-primary);
  font-size: 11px;
  line-height: 16px;
  word-break: break-word;
}
.rsl-note {
  padding: 6px 8px;
  color: var(--dsw-alias-label-secondary);
  font-size: 11px;
  line-height: 16px;
}
.rsl-noteError {
  color: var(--dsw-alias-state-error-primary);
}
.rsl-retry {
  margin-left: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--dsw-alias-brand-primary);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}
.rsl-retry:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-brand-primary));
  outline-offset: 2px;
  border-radius: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .rsl-fill,
  .rsl-thumb {
    transition: none;
  }
}
`

    /* ------------------------------------------------------------------ *
     * Diagnostics and translation fallback
     * ------------------------------------------------------------------ */

    function reportToHost(kind, details) {
      try {
        if (typeof fetch !== 'function') return
        const payload = { kind }
        if (details instanceof Error) {
          payload.message = String(details.message)
          payload.stack = String(details.stack)
        } else if (details !== null && typeof details === 'object') {
          Object.assign(payload, details)
        } else {
          payload.message = String(details)
        }
        fetch('/dsh-reasoning-slider/log', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
          credentials: 'same-origin',
        }).catch(() => {})
      } catch (ignored) {
        // Reporting must never fail the slot again.
      }
    }

    function fallbackTranslate(key, params) {
      const dict = zh
      const template = dict[key] === undefined ? key : dict[key]
      if (params === undefined) return template
      return template.replace(/\{(\w+)\}/g, (match, name) => (
        params[name] === undefined ? match : String(params[name])
      ))
    }

    /* ------------------------------------------------------------------ *
     * Crash boundary: an abdicated entry hands the menu back to the shipped
     * rows, so one render failure loses only the slider.
     * ------------------------------------------------------------------ */

    class EntryBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false, error: null }
      }

      static getDerivedStateFromError(error) {
        return { failed: true, error }
      }

      componentDidCatch(error) {
        reportToHost('render', error)
      }

      render() {
        if (this.state.failed) throw this.state.error
        return this.props.children
      }
    }

    /** Stable fallback snapshot for a directory that cannot be resolved. */
    const EMPTY_STATE = Object.freeze({
      current: null,
      retainedEffort: undefined,
      routable: null,
      groups: [],
      failures: [],
      status: 'idle',
      pending: null,
      error: null,
    })

    /* ------------------------------------------------------------------ *
     * Component
     * ------------------------------------------------------------------ */

    /**
     * Render the effort slider row for the current session's model.
     * @param props - standard seat props (sessionId, t) + the injected
     * shared model directory service (`models`).
     */
    function EffortSlider(props) {
      const t = typeof props.t === 'function' ? props.t : fallbackTranslate
      const models = props.models
      const sessionId = props.sessionId
      const locked = props.locked === true
      // The menu owner shows selection failures through its anchored toast; the
      // inline line below the slider is the fallback surface.
      const reportFailure = typeof props.reportFailure === 'function' ? props.reportFailure : null

      const directory = React.useMemo(() => {
        if (models === undefined || models === null || sessionId === undefined) return null
        try {
          return models.directoryFor(sessionId)
        } catch (error) {
          reportToHost('directory', error)
          return null
        }
      }, [models, sessionId])

      const subscribe = React.useCallback(
        (onChange) => directory === null ? () => {} : directory.store.subscribe(onChange),
        [directory],
      )
      const read = React.useCallback(
        () => directory === null ? EMPTY_STATE : directory.store.getSnapshot(),
        [directory],
      )
      const state = React.useSyncExternalStore(subscribe, read)

      const [preview, setPreview] = React.useState(null)
      const [hover, setHover] = React.useState(null)
      const [failure, setFailure] = React.useState(null)
      const [dragging, setDragging] = React.useState(false)
      const [announcement, setAnnouncement] = React.useState('')
      const trackRef = React.useRef(null)
      const draggingRef = React.useRef(false)

      React.useEffect(() => {
        if (directory === null) return undefined
        // The catalog service shares one in-flight load, so a remount is cheap.
        Promise.resolve()
          .then(() => directory.load())
          .catch(() => { /* surfaced on the directory store */ })
        return undefined
      }, [directory])

      const current = state.current
      const group = current === null ? undefined : state.groups.find((entry) => entry.id === current.provider)
      const model = group === undefined ? undefined : group.models.find((entry) => entry.id === current.model)
      const reasoning = model === undefined ? undefined : model.reasoning

      const levels = React.useMemo(() => {
        if (reasoning === undefined || reasoning === null) return []
        const list = []
        if (reasoning.defaultEffort === undefined) {
          list.push({ key: 'provider-default', effort: undefined, name: t('level.default') })
        }
        for (const effort of reasoning.efforts) {
          list.push({ key: `effort:${effort.id}`, effort: effort.id, name: effort.name })
        }
        return list
      }, [reasoning, t])

      const busy = state.pending !== null || state.status === 'selecting'
      const failureText = failure
      const effective = current === null ? undefined : current.reasoningEffort

      let index = levels.findIndex((level) => level.effort === effective)
      if (index < 0 && reasoning !== undefined && reasoning !== null) {
        index = levels.findIndex((level) => level.effort === reasoning.defaultEffort)
      }
      if (index < 0) index = 0
      const shown = preview === null
        ? index
        : Math.max(0, Math.min(levels.length - 1, preview))
      const percent = levels.length < 2 ? 0 : shown / (levels.length - 1)
      const level = levels[shown]
      const levelName = level === undefined ? '' : level.name
      const caption = busy && level !== undefined
        ? t('pending', { name: levelName })
        : hover === null
          ? t('hint')
          : (levels[hover] === undefined ? t('hint') : levels[hover].name)

      const reload = React.useCallback(() => {
        if (directory === null) return
        setFailure(null)
        directory.load().catch((error) => {
          setFailure(t('error.load', { message: error instanceof Error ? error.message : String(error) }))
        })
      }, [directory, t])

      const commit = React.useCallback((effort) => {
        if (directory === null || current === null || busy || locked) {
          setPreview(null)
          return
        }
        if (effort === effective) {
          // Re-selecting the current level still confirms the value.
          setPreview(null)
          const currentLevel = levels.find((entry) => entry.effort === effort)
          if (currentLevel !== undefined) setAnnouncement(t('announce', { name: currentLevel.name }))
          return
        }
        const target = levels.find((entry) => entry.effort === effort)
        const targetName = target === undefined ? '' : target.name
        const fail = (message) => {
          setPreview(null)
          const text = t('error.switch', { message })
          if (reportFailure === null) setFailure(text)
          else reportFailure(text)
        }
        setFailure(null)
        const selection = {
          provider: current.provider,
          model: current.model,
          ...effort === undefined ? {} : { reasoningEffort: effort },
        }
        let operation
        try {
          operation = directory.select(selection)
        } catch (error) {
          fail(error instanceof Error ? error.message : String(error))
          return
        }
        Promise.resolve(operation).then((result) => {
          setPreview(null)
          if (result !== undefined && result !== null && result.ok === false) {
            const message = result.error === undefined
              ? 'unknown error'
              : `${result.error.code}: ${result.error.message}`
            fail(message)
            return
          }
          setAnnouncement(t('announce', { name: targetName }))
        }).catch((error) => {
          fail(error instanceof Error ? error.message : String(error))
        })
      }, [directory, current, busy, locked, effective, levels, reportFailure, t])

      const indexFromPoint = React.useCallback((clientX) => {
        const node = trackRef.current
        if (node === null || levels.length < 2) return 0
        const rect = node.getBoundingClientRect()
        const usable = Math.max(1, rect.width - 22)
        const ratio = Math.min(1, Math.max(0, (clientX - rect.left - 11) / usable))
        return Math.round(ratio * (levels.length - 1))
      }, [levels.length])

      const onPointerDown = React.useCallback((event) => {
        if (busy || locked || levels.length < 2) return
        event.preventDefault()
        const node = event.currentTarget
        try { node.setPointerCapture(event.pointerId) } catch (ignored) { /* older engines */ }
        draggingRef.current = true
        setDragging(true)
        if (typeof node.focus === 'function') node.focus({ preventScroll: true })
        const next = indexFromPoint(event.clientX)
        setPreview(next)
        setHover(next)
      }, [busy, locked, levels.length, indexFromPoint])

      const onPointerMove = React.useCallback((event) => {
        if (!draggingRef.current || event.buttons === 0) return
        const next = indexFromPoint(event.clientX)
        setPreview(next)
        setHover(next)
      }, [indexFromPoint])

      const onPointerUp = React.useCallback((event) => {
        if (!draggingRef.current) return
        draggingRef.current = false
        setDragging(false)
        try { event.currentTarget.releasePointerCapture(event.pointerId) } catch (ignored) { /* already released */ }
        const next = indexFromPoint(event.clientX)
        setHover(null)
        if (levels[next] === undefined) {
          setPreview(null)
          return
        }
        setPreview(next)
        commit(levels[next].effort)
      }, [indexFromPoint, commit, levels])

      const onPointerCancel = React.useCallback(() => {
        draggingRef.current = false
        setDragging(false)
        setPreview(null)
        setHover(null)
      }, [])

      // A capture lost mid-drag ends the gesture; releasing it ourselves after
      // a committed pointerup must not clear that commit's preview.
      const onLostPointerCapture = React.useCallback(() => {
        if (!draggingRef.current) return
        draggingRef.current = false
        setDragging(false)
        setPreview(null)
        setHover(null)
      }, [])

      const onKeyDown = React.useCallback((event) => {
        if (event.nativeEvent !== undefined && event.nativeEvent.isComposing) return
        if (busy || locked || levels.length < 2) return
        const active = preview === null ? index : preview
        let next = active
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = Math.min(levels.length - 1, active + 1)
        else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = Math.max(0, active - 1)
        else if (event.key === 'Home') next = 0
        else if (event.key === 'End') next = levels.length - 1
        else if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          event.stopPropagation()
          if (levels[active] !== undefined) {
            setPreview(active)
            setHover(active)
            commit(levels[active].effort)
          }
          return
        } else {
          return
        }
        // Keep the menu's own arrow navigation and Tab handling out of the slider.
        event.preventDefault()
        event.stopPropagation()
        if (levels[next] === undefined) return
        setPreview(next)
        setHover(next)
        commit(levels[next].effort)
      }, [busy, locked, levels, preview, index, commit])

      // A model without selectable levels has nothing to slide.
      if (directory === null) return null
      if (levels.length < 2) {
        if (model !== undefined) return null
        if (state.status === 'loading' || state.status === 'idle') {
          return h('div', { className: 'rsl-entry rsl-note', role: 'status' }, t('loading'))
        }
        if (state.status === 'error') {
          return h('div', { className: 'rsl-entry rsl-note rsl-noteError', role: 'status' },
            t('error.load', { message: state.error === null ? '' : state.error }),
            h('button', { type: 'button', className: 'rsl-retry', onClick: reload }, t('retry')))
        }
        return null
      }

      const disabled = busy || locked
      return h('div', { className: 'rsl-entry' + (dragging ? ' rsl-dragging' : '') + (busy ? ' rsl-busy' : '') },
        h('div', {
          className: 'rsl-panel',
          role: 'group',
          'aria-label': t('aria.group'),
          'aria-busy': busy ? 'true' : undefined,
        },
          h('div', { className: 'rsl-caption', 'aria-hidden': true }, caption),
          h('span', { className: 'rsl-sr', 'aria-live': 'polite' }, announcement),
          h('div', {
            ref: trackRef,
            className: 'rsl-track',
            role: 'slider',
            tabIndex: 0,
            'aria-label': t('aria.group'),
            'aria-orientation': 'horizontal',
            'aria-valuemin': 0,
            'aria-valuemax': levels.length - 1,
            'aria-valuenow': shown,
            'aria-valuetext': levelName,
            'aria-disabled': disabled ? 'true' : undefined,
            title: t('aria.slider', { name: levelName }),
            'data-effort': level === undefined ? undefined : (level.effort === undefined ? 'default' : String(level.effort)),
            style: { '--rsl-pct': String(percent) },
            onPointerDown,
            onPointerMove,
            onPointerUp,
            onPointerCancel,
            onLostPointerCapture,
            onKeyDown,
            onFocus: () => { if (!disabled) setHover(shown) },
            onBlur: () => { setHover(null) },
          },
            h('div', { className: 'rsl-fill', 'aria-hidden': true }),
            h('div', { className: 'rsl-stars', 'aria-hidden': true }),
            h('span', { className: 'rsl-spark', 'aria-hidden': true, style: { left: '14%', top: '38%' } }, '✦'),
            h('span', { className: 'rsl-spark', 'aria-hidden': true, style: { left: '34%', top: '62%' } }, '✦'),
            h('span', { className: 'rsl-spark', 'aria-hidden': true, style: { left: '58%', top: '26%' } }, '✦'),
            h('span', { className: 'rsl-spark', 'aria-hidden': true, style: { left: '76%', top: '58%' } }, '✦'),
            h('div', { className: 'rsl-thumb', 'aria-hidden': true }),
          ),
          failureText === null ? null : h('div', { className: 'rsl-error', role: 'alert' }, failureText),
        ),
      )
    }

    /* ------------------------------------------------------------------ *
     * Client plugin
     * ------------------------------------------------------------------ */

    const inject = ['slots', 'sessions', 'locale', 'modelDirectories']

    /**
     * Register the dictionaries and append the slider entry to the composer
     * model menu's session-options slot.
     * @param ctx - client root context.
     */
    function apply(ctx) {
      ctx.effect(() => {
        const style = document.createElement('style')
        style.dataset.dshPlugin = NS
        style.textContent = CSS
        document.head.appendChild(style)
        return () => { style.remove() }
      }, 'reasoning-slider: styles')

      ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'reasoning-slider: dictionaries')

      ctx.inject(['slots', 'modelDirectories'], (scope) => {
        const models = scope.modelDirectories
        const Entry = (props) => h(EntryBoundary, null, h(EffortSlider, Object.assign({}, props, { models })))
        scope.slots.inject('conversation.input.model.options', () => scope.slots.register({
          name: 'conversation.input.model.options',
          id: 'reasoning-slider',
          order: -1,
          locale: NS,
        }, Entry))

      })
    }

    return { inject, apply }
  },
})
