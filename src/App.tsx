import React from "react"
import Home from "./Home"
import AdminPage from "./components/AdminPage"

const App: React.FC = () => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/"
  if (pathname.startsWith("/admin")) return <AdminPage />
  return <Home />
}

export default App
