import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'

// Lazy load pages for code splitting - reduces initial bundle size
const Explore = lazy(() => import('./pages/Explore'))
const Search = lazy(() => import('./pages/Search'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Playground = lazy(() => import('./pages/Playground'))
const Problem = lazy(() => import('./pages/Problem'))
const Category = lazy(() => import('./pages/Category'))
const AuthCallback = lazy(() => import('./pages/AuthCallback'))
const UserProfile = lazy(() => import('./pages/UserProfile'))
const Compare = lazy(() => import('./pages/Compare'))

// Lightweight loading fallback
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent-primary" />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Explore />} />
            <Route path="search" element={<Search />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="playground" element={<Playground />} />
            <Route path="problem/:problemId" element={<Problem />} />
            <Route path="category/:categoryId" element={<Category />} />
            <Route path="user/:username" element={<UserProfile />} />
            <Route path="compare" element={<Compare />} />
          </Route>
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  )
}

export default App
