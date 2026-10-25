import { useRef, useState } from "react"

import { Phase } from "../bindings/vazae/game/models"
import { Stage } from "@/components/Stage"
import { Toaster } from "@/components/ui/sonner"
import { useSolo, type StartConfig } from "@/game/useSolo"
import { Home } from "@/screens/Home"
import { Result } from "@/screens/Result"
import { SoloSetup } from "@/screens/SoloSetup"
import { Table } from "@/screens/Table"

type Screen = "home" | "setup" | "table"

export default function App() {
  const game = useSolo()
  const [screen, setScreen] = useState<Screen>("home")
  const lastCfg = useRef<StartConfig | null>(null)

  const start = async (cfg: StartConfig) => {
    lastCfg.current = cfg
    await game.start(cfg)
  }

  const leave = async () => {
    await game.quit()
    setScreen("home")
  }

  // A view only exists after Start succeeds, so it decides when the table shows.
  const atTable = screen !== "home" && game.view !== null

  let body
  if (atTable && game.view) {
    body =
      game.view.phase === Phase.PhaseOver ? (
        <Result
          view={game.view}
          busy={game.status.kind === "starting"}
          onAgain={() => lastCfg.current && start(lastCfg.current)}
          onHome={leave}
        />
      ) : (
        <Table game={{ ...game, view: game.view }} onLeave={leave} />
      )
  } else if (screen === "setup") {
    body = (
      <SoloSetup
        status={game.status}
        onStart={async (cfg) => {
          await start(cfg)
          setScreen("table")
        }}
        onBack={() => setScreen("home")}
      />
    )
  } else {
    body = <Home onSolo={() => setScreen("setup")} />
  }

  return (
    <Stage>
      {body}
      <Toaster position="top-center" />
    </Stage>
  )
}
