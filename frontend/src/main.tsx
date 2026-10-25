import React from "react"
import ReactDOM from "react-dom/client"

import "./index.css"
// Applies the saved or system theme before the first paint.
import "./lib/theme"
import App from "./App"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
