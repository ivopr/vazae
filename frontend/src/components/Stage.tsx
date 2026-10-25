import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

// The smallest canvas every screen fits on without scrolling. It stays under the
// default 1100×760 window so that opens at 1:1.
const DESIGN_W = 1024
const DESIGN_H = 720

// Mouse and trackpad only: phones and tablets keep their scrolling layout.
const DESKTOP = "(pointer: fine)"

// Large windows enlarge the canvas a little, so the table isn't a small island of
// 12px text on a big floor, without blowing type up past a comfortable size.
const MAX_SCALE = 1.3

type Fit = { w: number; h: number; scale: number; desktop: boolean }

function measure(): Fit {
  const w = window.innerWidth
  const h = window.innerHeight
  const desktop = window.matchMedia(DESKTOP).matches
  return { w, h, desktop, scale: desktop ? Math.min(MAX_SCALE, w / DESIGN_W, h / DESIGN_H) : 1 }
}

function useFit(): Fit {
  const [fit, setFit] = useState(measure)
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP)
    const update = () => setFit(measure())
    window.addEventListener("resize", update)
    mq.addEventListener("change", update)
    return () => {
      window.removeEventListener("resize", update)
      mq.removeEventListener("change", update)
    }
  }, [])
  return fit
}

const StageContext = createContext<HTMLElement | null>(null)

/** Where portals (dialogs) mount, so they scale with the rest of the app; also what scrolls on a phone. */
export function useStage() {
  return useContext(StageContext)
}

/**
 * On desktop the app never scrolls: it is laid out on a canvas at least the design
 * size and scaled to the window, down for small windows and a little up for large ones. The stage is also the size
 * container behind the `stage-*` variants, since media queries see the real window.
 */
export function Stage({ children }: { children: ReactNode }) {
  const { w, h, scale, desktop } = useFit()
  const [el, setEl] = useState<HTMLElement | null>(null)

  return (
    <div
      ref={setEl}
      className={
        desktop
          ? "@container/stage fixed top-0 left-0 overflow-hidden bg-room"
          : "@container/stage fixed inset-0 overflow-x-hidden overflow-y-auto bg-room"
      }
      style={
        desktop
          ? { width: w / scale, height: h / scale, transform: scale !== 1 ? `scale(${scale})` : undefined, transformOrigin: "0 0" }
          : undefined
      }
    >
      <StageContext.Provider value={el}>{children}</StageContext.Provider>
    </div>
  )
}
