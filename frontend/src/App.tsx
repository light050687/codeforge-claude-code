import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import Explore from './pages/Explore'
import Search from './pages/Search'
import Leaderboard from './pages/Leaderboard'
import Playground from './pages/Playground'
import Problem from './pages/Problem'
import Category from './pages/Category'
import AuthCallback from './pages/AuthCallback'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Explore />} />
          <Route path="search" element={<Search />} />
          <Route path="leaderboard" element={<Leaderboard />} />
          <Route path="playground" element={<Playground />} />
          <Route path="problem/:problemId" element={<Problem />} />
          <Route path="category/:categoryId" element={<Category />} />
        </Route>
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </AuthProvider>
  )
}

export default App
