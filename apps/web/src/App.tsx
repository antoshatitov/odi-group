import { useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'

import SiteFooter from './components/SiteFooter'
import SiteHeader from './components/SiteHeader'
import Consent from './pages/Consent'
import Cookies from './pages/Cookies'
import Home from './pages/Home'
import Policy from './pages/Policy'

const ScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

const App = () => {
  return (
    <div>
      <ScrollToTop />
      <SiteHeader />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/policy" element={<Policy />} />
          <Route path="/consent" element={<Consent />} />
          <Route path="/cookies" element={<Cookies />} />
        </Routes>
      </main>
      <SiteFooter />
    </div>
  )
}

export default App
