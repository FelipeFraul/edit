import React, { Suspense } from "react"
import Home from "./Home"

const AdminPage = React.lazy(() => import("./components/AdminPage"))

const App: React.FC = () => {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/"
  if (pathname.startsWith("/admin")) {
    return (
      <Suspense fallback={<div className="min-h-screen bg-[#0E1A37]" />}>
        <AdminPage />
      </Suspense>
    )
  }
  return <Home />
}

export default App
