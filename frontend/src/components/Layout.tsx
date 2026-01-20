import { Outlet, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

const navItems = [
  { path: '/', label: 'Explore' },
  { path: '/search', label: 'Search' },
  { path: '/leaderboard', label: 'Leaderboard' },
  { path: '/playground', label: 'Playground' },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-bg-tertiary bg-bg-primary/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-accent-primary flex items-center justify-center">
                <span className="text-white font-bold">CF</span>
              </div>
              <span className="text-xl font-semibold text-text-primary">CodeForge</span>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative px-4 py-2 text-sm font-medium rounded-lg transition-colors"
                >
                  {location.pathname === item.path && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-bg-tertiary rounded-lg"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      location.pathname === item.path
                        ? 'text-text-primary'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>

            {/* Auth */}
            <button className="px-4 py-2 text-sm font-medium text-text-primary bg-accent-primary rounded-lg hover:bg-accent-primary/90 transition-colors">
              Sign in with GitHub
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-bg-tertiary mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-text-muted text-sm">
            CodeForge - Semantic Code Search Engine
          </p>
        </div>
      </footer>
    </div>
  )
}
