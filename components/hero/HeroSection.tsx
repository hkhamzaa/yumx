'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'

// Total frames extracted from yam_x_hero.mp4 via:
//   ffmpeg -i yam_x_hero.mp4 -vf "fps=12,scale=1280:-2" -vcodec libwebp -q:v 82 frame_%03d.webp
// Result: 97 frames, 4.8 MB total, ~49 KB/frame, 1280×720 WebP
const TOTAL_FRAMES     = 97
const FRAME_BASE       = '/hero-frames/frame_'
const SCROLL_HEIGHT_VH = 350

function pad3(n: number) {
  return String(n).padStart(3, '0')
}

/** Draws `img` onto `ctx` with object-fit: cover semantics */
function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  cw: number,
  ch: number,
) {
  const iw = img.naturalWidth  || 1280
  const ih = img.naturalHeight || 720
  const scale = Math.max(cw / iw, ch / ih)
  ctx.drawImage(
    img,
    (cw - iw * scale) / 2,
    (ch - ih * scale) / 2,
    iw * scale,
    ih * scale,
  )
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const rafRef       = useRef<number>(0)
  const framesRef    = useRef<HTMLImageElement[]>([])

  const targetRef    = useRef(0)   // set by scroll handler
  const displayRef   = useRef(0)   // lerped inside rAF loop
  const lastIdxRef   = useRef(-1)  // last frame index drawn

  const [progress,  setProgress]  = useState(0)
  const [loaded,    setLoaded]    = useState(0)   // # frames loaded (or errored)
  const [isDesktop, setIsDesktop] = useState(false)

  const allLoaded = loaded >= TOTAL_FRAMES

  /* ── Breakpoint detection ─────────────────────────────────────────────── */
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)')
    setIsDesktop(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  /* ── Preload all frames ───────────────────────────────────────────────── */
  useEffect(() => {
    let count = 0
    for (let i = 0; i < TOTAL_FRAMES; i++) {
      const img = new window.Image()
      img.src         = `${FRAME_BASE}${pad3(i + 1)}.webp`
      img.onload      = () => setLoaded(++count)
      img.onerror     = () => setLoaded(++count) // still count errors so we don't hang
      framesRef.current[i] = img
    }
  }, [])

  /* ── Canvas: resize to fill its CSS box at device pixel ratio ─────────── */
  const syncCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const dpr = window.devicePixelRatio || 1
    canvas.width  = rect.width  * dpr
    canvas.height = rect.height * dpr
    // Redraw the current frame so there's no blank after resize
    const idx = Math.max(0, Math.min(TOTAL_FRAMES - 1, lastIdxRef.current))
    const img = framesRef.current[idx]
    const ctx = canvas.getContext('2d')
    if (img?.complete && img.naturalWidth && ctx) {
      drawCover(ctx, img, canvas.width, canvas.height)
    }
  }, [])

  /* Run syncCanvas when isDesktop flips (canvas may not exist yet → rAF) */
  useEffect(() => {
    if (!isDesktop) return
    const handle = requestAnimationFrame(syncCanvas)
    window.addEventListener('resize', syncCanvas)
    return () => {
      cancelAnimationFrame(handle)
      window.removeEventListener('resize', syncCanvas)
    }
  }, [isDesktop, syncCanvas])

  /* ── Scroll → update target ref (no DOM writes) ───────────────────────── */
  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (!el || !isDesktop) return
    const { top, height } = el.getBoundingClientRect()
    targetRef.current = Math.max(0, Math.min(1, -top / (height - window.innerHeight)))
  }, [isDesktop])

  /* ── rAF loop: lerp → frame index → drawCover ────────────────────────── */
  useEffect(() => {
    if (!isDesktop) return

    function loop() {
      // Lerp factor 0.25 → smooth ~180 ms settle at 60 fps
      displayRef.current += (targetRef.current - displayRef.current) * 0.25

      const idx = Math.min(
        TOTAL_FRAMES - 1,
        Math.floor(displayRef.current * TOTAL_FRAMES),
      )

      if (idx !== lastIdxRef.current) {
        lastIdxRef.current = idx
        const img    = framesRef.current[idx]
        const canvas = canvasRef.current
        const ctx    = canvas?.getContext('2d')
        if (img?.complete && img.naturalWidth && canvas && ctx) {
          drawCover(ctx, img, canvas.width, canvas.height)
        }
        setProgress(displayRef.current)
      }

      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(loop)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('scroll', onScroll)
    }
  }, [isDesktop, onScroll])

  /* ── Derived animation values ─────────────────────────────────────────── */
  // Text overlay fades out and drifts up over first 40% of scroll range
  const textOpacity   = isDesktop ? Math.max(0, 1 - progress / 0.40) : 1
  const textTranslate = isDesktop ? progress * -50 : 0

  return (
    <section
      ref={containerRef}
      aria-label="Hero"
      style={isDesktop ? { height: `${SCROLL_HEIGHT_VH}vh` } : {}}
    >
      <div className={isDesktop ? 'hero-pin' : 'relative h-[100svh] min-h-[600px]'}>

        {/* ── Desktop: canvas, frame-scrubbed by scroll ────────────────── */}
        {isDesktop && (
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            aria-hidden="true"
          />
        )}

        {/* ── Mobile: static first frame as plain image ────────────────── */}
        {!isDesktop && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${FRAME_BASE}001.webp`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
        )}

        {/* ── Loading veil (desktop only, until all frames are ready) ───── */}
        {isDesktop && !allLoaded && (
          <div className="absolute inset-0 z-30 bg-brand-bg flex items-end justify-start px-6 sm:px-10 lg:px-16 xl:px-24 pb-12">
            <div className="flex flex-col gap-2">
              <div className="w-28 h-px bg-brand-border overflow-hidden">
                <div
                  className="h-full bg-brand-accent"
                  style={{
                    width: `${(loaded / TOTAL_FRAMES) * 100}%`,
                    transition: 'width 80ms linear',
                  }}
                />
              </div>
              <p className="label-caps text-brand-dim">
                {Math.round((loaded / TOTAL_FRAMES) * 100)}%
              </p>
            </div>
          </div>
        )}

        {/* ── Gradient overlays ─────────────────────────────────────────── */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-bg/90 via-brand-bg/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-brand-bg/40 via-transparent to-brand-bg/70" />

        {/* ── Text content ─────────────────────────────────────────────── */}
        <div
          className="absolute inset-0 flex flex-col justify-center px-6 sm:px-10 lg:px-16 xl:px-24"
          style={isDesktop ? {
            opacity:    textOpacity,
            transform:  `translateY(${textTranslate}px)`,
            transition: 'none',
          } : {}}
        >
          <div
            className={[
              'max-w-[90vw] sm:max-w-[70vw] lg:max-w-[48vw] xl:max-w-[42vw]',
              !isDesktop ? 'animate-fade-in' : '',
            ].join(' ')}
          >
            {/* Eyebrow */}
            <p className="label-caps text-brand-accent mb-4 md:mb-5">
              Lahore&apos;s Boldest Fast Food
            </p>

            {/* Headline — Playfair Display 700, bold serif */}
            <h1 className="font-display font-bold text-[clamp(3rem,6vw,4.5rem)] leading-[1.05] text-brand-text tracking-tight">
              Real Food.<br />
              <span className="text-brand-accent italic">Fast.</span>
            </h1>

            {/* Body copy */}
            <p className="font-body text-base sm:text-lg text-brand-muted leading-relaxed mt-5 mb-8 max-w-sm">
              Crafted with bold flavours, served fast.
              Every bite hits different.
            </p>

            {/* Two CTAs — primary (filled amber) + secondary (outlined) */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/menu"
                className="font-body font-bold text-sm px-8 py-4 rounded-squoval bg-brand-accent text-brand-bg hover:bg-white hover:text-brand-bg transition-all duration-300 ease-in-out text-center"
              >
                Explore Menu
              </Link>
              <a
                href="/#deals"
                onClick={e => {
                  e.preventDefault()
                  document.querySelector('#deals')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="font-body font-bold text-sm px-8 py-4 rounded-squoval border-[1.5px] border-white/30 text-brand-text hover:bg-white hover:border-white hover:text-brand-bg transition-all duration-300 ease-in-out text-center"
              >
                See Deals
              </a>
            </div>
          </div>
        </div>

        {/* ── Scroll hint (desktop, initial position only) ──────────────── */}
        {isDesktop && allLoaded && progress < 0.05 && (
          <div className="absolute bottom-8 left-16 xl:left-24 flex flex-col items-start gap-2 opacity-60">
            <span className="label-caps text-brand-muted">Scroll</span>
            <div className="w-px h-10 bg-gradient-to-b from-brand-muted to-transparent animate-pulse" />
          </div>
        )}
      </div>
    </section>
  )
}
