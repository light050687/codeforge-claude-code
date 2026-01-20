import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Explore from './pages/Explore'
import Search from './pages/Search'
import Leaderboard from './pages/Leaderboard'
import Playground from './pages/Playground'
import Problem from './pages/Problem'
import Category from './pages/Category'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Explore />} />
        <Route path="search" element={<Search />} />
        <Route path="leaderboard" element={<Leaderboard />} />
        <Route path="playground" element={<Playground />} />
        <Route path="problem/:problemId" element={<Problem />} />
        <Route path="category/:categoryId" element={<Category />} />
      </Route>
    </Routes>
  )
}

export default App
