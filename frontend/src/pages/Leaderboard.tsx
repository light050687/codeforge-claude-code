import { useState } from 'react'
import { motion } from 'framer-motion'

type TabType = 'authors' | 'solutions' | 'categories'

const mockAuthors = [
  { rank: 1, username: 'speedmaster', score: 12847, solutions: 89, avatar: null },
  { rank: 2, username: 'algorithmist', score: 11234, solutions: 76, avatar: null },
  { rank: 3, username: 'pyoptimizer', score: 9876, solutions: 65, avatar: null },
  { rank: 4, username: 'rustacean', score: 8765, solutions: 54, avatar: null },
  { rank: 5, username: 'gopher_dev', score: 7654, solutions: 48, avatar: null },
]

const mockSolutions = [
  { rank: 1, title: 'SIMD Matrix Multiply', speedup: 1247, author: 'speedmaster', language: 'C++' },
  { rank: 2, title: 'Vectorized Sort', speedup: 892, author: 'algorithmist', language: 'Rust' },
  { rank: 3, title: 'GPU Hash Table', speedup: 756, author: 'cudamaster', language: 'CUDA' },
  { rank: 4, title: 'Branch-free Binary Search', speedup: 543, author: 'lowlevel', language: 'C' },
  { rank: 5, title: 'NumPy FFT', speedup: 421, author: 'pyoptimizer', language: 'Python' },
]

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<TabType>('authors')

  const tabs: { id: TabType; label: string }[] = [
    { id: 'authors', label: 'Top Authors' },
    { id: 'solutions', label: 'Fastest Solutions' },
    { id: 'categories', label: 'By Category' },
  ]

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-primary">Leaderboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-bg-tertiary pb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-accent-primary text-white'
                : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Podium for Top 3 */}
      {activeTab === 'authors' && (
        <div className="flex justify-center items-end gap-4 py-8">
          {/* Second Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center text-2xl mb-2">
              🥈
            </div>
            <div className="text-text-primary font-medium">{mockAuthors[1].username}</div>
            <div className="text-sm text-text-muted">{mockAuthors[1].score} pts</div>
            <div className="w-24 h-24 bg-bg-secondary rounded-t-lg mt-2" />
          </motion.div>

          {/* First Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center"
          >
            <div className="w-24 h-24 rounded-full bg-accent-primary/20 flex items-center justify-center text-3xl mb-2">
              🥇
            </div>
            <div className="text-text-primary font-semibold text-lg">{mockAuthors[0].username}</div>
            <div className="text-sm text-text-muted">{mockAuthors[0].score} pts</div>
            <div className="w-28 h-32 bg-accent-primary/30 rounded-t-lg mt-2" />
          </motion.div>

          {/* Third Place */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="w-20 h-20 rounded-full bg-bg-tertiary flex items-center justify-center text-2xl mb-2">
              🥉
            </div>
            <div className="text-text-primary font-medium">{mockAuthors[2].username}</div>
            <div className="text-sm text-text-muted">{mockAuthors[2].score} pts</div>
            <div className="w-24 h-16 bg-bg-secondary rounded-t-lg mt-2" />
          </motion.div>
        </div>
      )}

      {/* Table */}
      <div className="bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-bg-tertiary">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                Rank
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                {activeTab === 'solutions' ? 'Solution' : 'Author'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                {activeTab === 'solutions' ? 'Speedup' : 'Score'}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider">
                {activeTab === 'solutions' ? 'Language' : 'Solutions'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bg-tertiary">
            {activeTab === 'authors'
              ? mockAuthors.map((author, index) => (
                  <motion.tr
                    key={author.username}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-bg-tertiary/50"
                  >
                    <td className="px-6 py-4 text-text-primary font-medium">#{author.rank}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-sm text-accent-primary">
                          {author.username[0].toUpperCase()}
                        </div>
                        <span className="text-text-primary">@{author.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-text-primary">{author.score.toLocaleString()}</td>
                    <td className="px-6 py-4 text-text-secondary">{author.solutions}</td>
                  </motion.tr>
                ))
              : mockSolutions.map((solution, index) => (
                  <motion.tr
                    key={solution.title}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-bg-tertiary/50"
                  >
                    <td className="px-6 py-4 text-text-primary font-medium">#{solution.rank}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-text-primary">{solution.title}</div>
                        <div className="text-sm text-text-muted">by @{solution.author}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs font-medium bg-accent-success/20 text-accent-success rounded">
                        {solution.speedup}x
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary">{solution.language}</td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
