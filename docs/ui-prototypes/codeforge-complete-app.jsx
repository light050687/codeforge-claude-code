import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Zap, Clock, Users, ChevronRight, Copy, Check, Star, GitBranch, Play, Filter, TrendingUp, BookOpen, Code2, Cpu, ArrowRight, X, ThumbsUp, MessageSquare, Share2, Bookmark, ExternalLink, Terminal, Layers, Award, Brain, Atom, FlaskConical, ChevronDown, BarChart3, History, Globe, CheckCircle2, GitCompare, ArrowLeftRight, Info, AlertCircle, Scale, Minus, Plus, Eye, ChevronUp, Trophy, Medal, Crown, Flame, Target, Compass, Grid3X3, Beaker, Calculator, Network, FileText, Database, Lock, Gauge, Timer, MemoryStick, Pause, RotateCcw, Settings, ChevronLeft, Maximize2, Minimize2, Split, Download, Upload, Share, Heart, Flag, MoreHorizontal, ArrowUpRight, Sparkle, Rocket, Lightbulb, Dna, TrendingDown, Activity, PieChart, LineChart } from 'lucide-react';

const theme = {
  colors: {
    bg: {
      primary: '#0a0a0f',
      secondary: '#12121a',
      tertiary: '#1a1a24',
      elevated: '#22222e',
      glass: 'rgba(255,255,255,0.03)',
    },
    accent: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      tertiary: '#a855f7',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      cyan: '#06b6d4',
      pink: '#ec4899',
      orange: '#f97316',
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b',
    },
    border: {
      subtle: 'rgba(255,255,255,0.06)',
      medium: 'rgba(255,255,255,0.1)',
    }
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    gold: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
    silver: 'linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%)',
    bronze: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    fire: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)',
    mesh: `radial-gradient(at 40% 20%, rgba(99,102,241,0.08) 0px, transparent 50%),
           radial-gradient(at 80% 0%, rgba(139,92,246,0.06) 0px, transparent 50%),
           radial-gradient(at 0% 50%, rgba(168,85,247,0.05) 0px, transparent 50%)`,
  }
};

// ==================== DATA ====================
const languages = [
  { id: 'python', name: 'Python', icon: '🐍', color: '#3776ab' },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', color: '#f7df1e' },
  { id: 'typescript', name: 'TypeScript', icon: '📘', color: '#3178c6' },
  { id: 'go', name: 'Go', icon: '🔵', color: '#00add8' },
  { id: 'rust', name: 'Rust', icon: '🦀', color: '#dea584' },
  { id: 'cpp', name: 'C++', icon: '⚙️', color: '#00599c' },
  { id: 'java', name: 'Java', icon: '☕', color: '#ed8b00' },
];

const categories = [
  { id: 'sorting', name: 'Sorting', icon: Layers, count: 1234, color: '#6366f1', description: 'Алгоритмы сортировки данных' },
  { id: 'search', name: 'Search', icon: Search, count: 2891, color: '#8b5cf6', description: 'Поиск и фильтрация' },
  { id: 'graphs', name: 'Graphs', icon: Network, count: 892, color: '#a855f7', description: 'Графы и деревья' },
  { id: 'strings', name: 'Strings', icon: FileText, count: 3456, color: '#06b6d4', description: 'Работа со строками' },
  { id: 'math', name: 'Math', icon: Calculator, count: 1789, color: '#10b981', description: 'Математические вычисления' },
  { id: 'io', name: 'I/O', icon: Database, count: 967, color: '#f59e0b', description: 'Ввод-вывод и парсинг' },
  { id: 'memory', name: 'Memory', icon: MemoryStick, count: 654, color: '#ef4444', description: 'Управление памятью' },
  { id: 'crypto', name: 'Crypto', icon: Lock, count: 432, color: '#ec4899', description: 'Криптография и хеширование' },
];

const inspirations = [
  { id: 'physics', name: 'Physics', icon: Atom, count: 456, color: '#6366f1', description: 'Термодинамика, квантовая механика' },
  { id: 'biology', name: 'Biology', icon: Dna, count: 324, color: '#10b981', description: 'Генетические алгоритмы, нейросети' },
  { id: 'math', name: 'Mathematics', icon: Calculator, count: 567, color: '#8b5cf6', description: 'Теория чисел, оптимизация' },
  { id: 'economics', name: 'Economics', icon: LineChart, count: 234, color: '#f59e0b', description: 'Теория игр, рынки' },
];

const topSolutions = [
  { id: 1, title: 'TimSort Hybrid', author: 'alex_perf', avatar: '🚀', language: 'Python', speedup: '47x', votes: 2847, category: 'Sorting', trending: true },
  { id: 2, title: 'Parallel QuickSort', author: 'parallel_ninja', avatar: '⚡', language: 'Go', speedup: '32x', votes: 1923, category: 'Sorting', trending: true },
  { id: 3, title: 'Cache-aware Radix', author: 'cache_master', avatar: '🧠', language: 'Rust', speedup: '28x', votes: 1456, category: 'Sorting', trending: false },
  { id: 4, title: 'SIMD Binary Search', author: 'simd_wizard', avatar: '🎯', language: 'C++', speedup: '12x', votes: 1234, category: 'Search', trending: true },
  { id: 5, title: 'Lock-free HashMap', author: 'concurrent_dev', avatar: '🔒', language: 'Rust', speedup: '8x', votes: 1122, category: 'Memory', trending: false },
];

const topAuthors = [
  { rank: 1, name: 'alex_perf', avatar: '🚀', score: 48750, solutions: 156, avgSpeedup: '23x', streak: 45, badges: ['🏆', '⚡', '🔥'] },
  { rank: 2, name: 'parallel_ninja', avatar: '⚡', score: 42300, solutions: 134, avgSpeedup: '19x', streak: 32, badges: ['🥈', '💪', '🎯'] },
  { rank: 3, name: 'cache_master', avatar: '🧠', score: 38900, solutions: 98, avgSpeedup: '21x', streak: 28, badges: ['🥉', '🧠', '⭐'] },
  { rank: 4, name: 'simd_wizard', avatar: '🎯', score: 35200, solutions: 87, avgSpeedup: '15x', streak: 21, badges: ['🎖️', '🚀'] },
  { rank: 5, name: 'rust_enthusiast', avatar: '🦀', score: 31800, solutions: 76, avgSpeedup: '18x', streak: 19, badges: ['🦀', '💎'] },
  { rank: 6, name: 'go_guru', avatar: '🔵', score: 28500, solutions: 65, avgSpeedup: '14x', streak: 15, badges: ['🔵', '⚡'] },
  { rank: 7, name: 'cpp_veteran', avatar: '⚙️', score: 25100, solutions: 54, avgSpeedup: '16x', streak: 12, badges: ['⚙️', '🏅'] },
  { rank: 8, name: 'algo_master', avatar: '📊', score: 22400, solutions: 48, avgSpeedup: '13x', streak: 10, badges: ['📊', '🎓'] },
];

const mockSearchResults = [
  {
    id: 1, rank: 1, title: 'TimSort Hybrid с адаптивным порогом',
    description: 'Комбинация merge sort и insertion sort с динамическим определением оптимального размера run',
    language: 'Python', speedup: '47x', speedupValue: 47,
    baseline: { name: 'Наивная сортировка O(n²)', time: '2.35s', description: 'Bubble sort на 100K элементов' },
    benchmarks: { time: '0.05s', timeMs: 50, memory: '12.4 MB', memoryMb: 12.4, opsPerSec: 1200000, cacheHitPercent: 94 },
    complexity: 'O(n log n)', memoryUsage: 'O(n)', benchmarkScore: 98.7, votes: 2847, comments: 156, contributors: 23,
    inspiration: { name: 'Термодинамика', icon: Atom },
    author: { name: 'alex_perf', avatar: '🚀', rating: 4.9 },
    verified: true, trending: true,
    code: `def adaptive_timsort(arr, key=None):
    """Adaptive TimSort with dynamic run detection"""
    n = len(arr)
    if n < 64:
        return insertion_sort(arr, 0, n - 1, key)
    
    min_run = compute_minrun(n)
    runs = detect_natural_runs(arr, min_run, key)
    
    stack = []
    for run in runs:
        stack.append(run)
        while should_merge(stack):
            merge_collapse(stack, arr, key)
    return arr`
  },
  {
    id: 2, rank: 2, title: 'Parallel QuickSort с Work Stealing',
    description: 'Многопоточная реализация с балансировкой нагрузки',
    language: 'Go', speedup: '32x', speedupValue: 32,
    baseline: { name: 'Однопоточный QuickSort', time: '1.6s', description: 'Go stdlib sort' },
    benchmarks: { time: '0.05s', timeMs: 50, memory: '8.2 MB', memoryMb: 8.2, opsPerSec: 980000, cacheHitPercent: 89 },
    complexity: 'O(n log n)', memoryUsage: 'O(log n)', benchmarkScore: 94.2, votes: 1923, comments: 89, contributors: 15,
    inspiration: { name: 'Game Theory', icon: Brain },
    author: { name: 'parallel_ninja', avatar: '⚡', rating: 4.7 },
    verified: true, trending: false,
    code: `func parallelQuickSort(arr []int, workers int) []int {
    queue := NewWorkStealingQueue(workers)
    queue.Push(Task{arr, 0, len(arr) - 1})
    
    var wg sync.WaitGroup
    for i := 0; i < workers; i++ {
        wg.Add(1)
        go worker(queue, &wg)
    }
    wg.Wait()
    return arr
}`
  },
];

// ==================== HEADER ====================
const Header = ({ activePage, setActivePage }) => (
  <header className="sticky top-0 z-40 backdrop-blur-xl px-8 py-4"
    style={{ background: `${theme.colors.bg.primary}dd`, borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
    <div className="flex items-center justify-between max-w-7xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: theme.gradients.primary }}>
          <Zap size={22} className="text-white" />
        </div>
        <span className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
          CodeForge <span style={{ color: theme.colors.accent.primary }}>Cloud</span>
        </span>
      </div>
      <nav className="flex items-center gap-1">
        {[
          { id: 'explore', label: 'Explore', icon: Compass },
          { id: 'search', label: 'Search', icon: Search },
          { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
          { id: 'playground', label: 'Playground', icon: Play },
        ].map((item) => (
          <button key={item.id} onClick={() => setActivePage(item.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all"
            style={{ 
              background: activePage === item.id ? theme.colors.bg.elevated : 'transparent',
              color: activePage === item.id ? theme.colors.text.primary : theme.colors.text.secondary,
              fontWeight: activePage === item.id ? 600 : 400
            }}>
            <item.icon size={16} />
            {item.label}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-lg transition-all hover:bg-white/5" style={{ color: theme.colors.text.muted }}>
          <Settings size={20} />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold text-white cursor-pointer"
          style={{ background: theme.gradients.primary }}>JD</div>
      </div>
    </div>
  </header>
);

// ==================== EXPLORE PAGE ====================
const ExplorePage = ({ onNavigate }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  return (
    <div className="max-w-7xl mx-auto px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
          style={{ background: `${theme.colors.accent.primary}15`, border: `1px solid ${theme.colors.accent.primary}30` }}>
          <Compass size={16} style={{ color: theme.colors.accent.primary }} />
          <span className="text-sm font-medium" style={{ color: theme.colors.accent.primary }}>Explore Solutions</span>
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
          Discover <span style={{ background: theme.gradients.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Optimized Code</span>
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: theme.colors.text.secondary }}>
          Исследуйте 2.4M+ решений по категориям, языкам и научным источникам вдохновения
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6 mb-16">
        {[
          { label: 'Решений', value: '2.4M+', icon: Code2, color: theme.colors.accent.primary },
          { label: 'Авторов', value: '125K', icon: Users, color: theme.colors.accent.secondary },
          { label: 'Языков', value: '16', icon: Globe, color: theme.colors.accent.cyan },
          { label: 'Бенчмарков', value: '89M', icon: Gauge, color: theme.colors.accent.success },
        ].map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl text-center transition-all hover:scale-105"
            style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}` }}>
            <stat.icon size={32} className="mx-auto mb-3" style={{ color: stat.color }} />
            <div className="text-3xl font-bold mb-1" style={{ color: theme.colors.text.primary }}>{stat.value}</div>
            <div className="text-sm" style={{ color: theme.colors.text.muted }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Categories */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
            Browse by Category
          </h2>
          <button className="flex items-center gap-2 text-sm" style={{ color: theme.colors.accent.primary }}>
            View All <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {categories.map((cat) => (
            <button key={cat.id} 
              onClick={() => { setSelectedCategory(cat.id); onNavigate('search'); }}
              className="p-6 rounded-2xl text-left transition-all hover:scale-[1.02] group"
              style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                style={{ background: `${cat.color}20` }}>
                <cat.icon size={24} style={{ color: cat.color }} />
              </div>
              <h3 className="text-lg font-semibold mb-1" style={{ color: theme.colors.text.primary }}>{cat.name}</h3>
              <p className="text-sm mb-3" style={{ color: theme.colors.text.muted }}>{cat.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: cat.color }}>{cat.count.toLocaleString()} solutions</span>
                <ArrowRight size={16} style={{ color: theme.colors.text.muted }} className="group-hover:translate-x-1 transition-transform" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Scientific Inspirations */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold" style={{ color: theme.colors.text.primary }}>
            <span className="mr-2">🔬</span> Scientific Inspirations
          </h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {inspirations.map((insp) => (
            <div key={insp.id} className="p-6 rounded-2xl transition-all hover:scale-[1.02]"
              style={{ background: `${insp.color}10`, border: `1px solid ${insp.color}30` }}>
              <insp.icon size={32} className="mb-4" style={{ color: insp.color }} />
              <h3 className="text-lg font-semibold mb-1" style={{ color: theme.colors.text.primary }}>{insp.name}</h3>
              <p className="text-sm mb-3" style={{ color: theme.colors.text.secondary }}>{insp.description}</p>
              <span className="text-sm font-medium" style={{ color: insp.color }}>{insp.count} algorithms</span>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Solutions */}
      <div className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: theme.colors.text.primary }}>
            <Flame size={24} style={{ color: theme.colors.accent.orange }} /> Trending Now
          </h2>
          <button className="flex items-center gap-2 text-sm" style={{ color: theme.colors.accent.primary }}>
            View All <ChevronRight size={16} />
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {topSolutions.filter(s => s.trending).slice(0, 3).map((sol, i) => {
            const lang = languages.find(l => l.name === sol.language) || { icon: '📄', color: '#888' };
            return (
              <div key={sol.id} className="flex items-center gap-6 p-5 rounded-2xl transition-all hover:scale-[1.01]"
                style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}` }}>
                <div className="text-3xl font-bold w-12 text-center" style={{ color: theme.colors.text.muted }}>
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>{sol.title}</h3>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                      style={{ background: `${lang.color}20`, color: lang.color }}>
                      {lang.icon} {sol.language}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs"
                      style={{ background: theme.colors.bg.tertiary, color: theme.colors.text.muted }}>
                      {sol.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm" style={{ color: theme.colors.text.muted }}>
                    <span className="flex items-center gap-1">{sol.avatar} {sol.author}</span>
                    <span className="flex items-center gap-1"><ThumbsUp size={14} /> {sol.votes.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono" style={{ color: theme.colors.accent.success }}>{sol.speedup}</div>
                  <div className="text-xs" style={{ color: theme.colors.text.muted }}>faster</div>
                </div>
                <button className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                  style={{ background: theme.gradients.primary, color: 'white' }}>
                  View
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Languages */}
      <div>
        <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text.primary }}>
          Browse by Language
        </h2>
        <div className="flex flex-wrap gap-3">
          {languages.map((lang) => (
            <button key={lang.id}
              onClick={() => onNavigate('search')}
              className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all hover:scale-105"
              style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}` }}>
              <span className="text-2xl">{lang.icon}</span>
              <span className="font-medium" style={{ color: theme.colors.text.primary }}>{lang.name}</span>
              <div className="w-3 h-3 rounded-full" style={{ background: lang.color }} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ==================== LEADERBOARD PAGE ====================
const LeaderboardPage = () => {
  const [activeTab, setActiveTab] = useState('authors');
  const [timeRange, setTimeRange] = useState('all');

  const getRankStyle = (rank) => {
    if (rank === 1) return { bg: theme.gradients.gold, icon: Crown, color: '#fbbf24' };
    if (rank === 2) return { bg: theme.gradients.silver, icon: Medal, color: '#94a3b8' };
    if (rank === 3) return { bg: theme.gradients.bronze, icon: Medal, color: '#d97706' };
    return { bg: theme.colors.bg.elevated, icon: null, color: theme.colors.text.muted };
  };

  return (
    <div className="max-w-6xl mx-auto px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
          style={{ background: `${theme.colors.accent.warning}15`, border: `1px solid ${theme.colors.accent.warning}30` }}>
          <Trophy size={16} style={{ color: theme.colors.accent.warning }} />
          <span className="text-sm font-medium" style={{ color: theme.colors.accent.warning }}>Hall of Fame</span>
        </div>
        <h1 className="text-5xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
          <span style={{ background: theme.gradients.gold, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Leaderboard</span>
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: theme.colors.text.secondary }}>
          Лучшие авторы и решения сообщества CodeForge
        </p>
      </div>

      {/* Tabs & Filters */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: theme.colors.bg.tertiary }}>
          {[
            { id: 'authors', label: 'Авторы', icon: Users },
            { id: 'solutions', label: 'Решения', icon: Code2 },
            { id: 'categories', label: 'Категории', icon: Grid3X3 },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={{ background: activeTab === tab.id ? theme.colors.accent.primary : 'transparent', color: activeTab === tab.id ? 'white' : theme.colors.text.secondary }}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          {['all', 'month', 'week'].map((range) => (
            <button key={range} onClick={() => setTimeRange(range)}
              className="px-4 py-2 rounded-lg text-sm transition-all"
              style={{ background: timeRange === range ? theme.colors.bg.elevated : 'transparent', color: timeRange === range ? theme.colors.text.primary : theme.colors.text.muted }}>
              {range === 'all' ? 'All Time' : range === 'month' ? 'This Month' : 'This Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      {activeTab === 'authors' && (
        <div className="flex items-end justify-center gap-4 mb-12">
          {[topAuthors[1], topAuthors[0], topAuthors[2]].map((author, i) => {
            const actualRank = i === 0 ? 2 : i === 1 ? 1 : 3;
            const height = i === 1 ? 'h-48' : i === 0 ? 'h-40' : 'h-32';
            const rs = getRankStyle(actualRank);
            return (
              <div key={author.name} className="text-center">
                <div className="relative mb-4">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-2 shadow-lg"
                    style={{ background: rs.bg }}>
                    {author.avatar}
                  </div>
                  {rs.icon && (
                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: theme.colors.bg.primary, border: `2px solid ${rs.color}` }}>
                      <rs.icon size={16} style={{ color: rs.color }} />
                    </div>
                  )}
                </div>
                <div className="font-semibold mb-1" style={{ color: theme.colors.text.primary }}>@{author.name}</div>
                <div className="text-2xl font-bold font-mono mb-2" style={{ color: rs.color }}>{author.score.toLocaleString()}</div>
                <div className={`${height} w-32 rounded-t-2xl flex flex-col items-center justify-end pb-4`}
                  style={{ background: `${rs.color}20`, border: `1px solid ${rs.color}40`, borderBottom: 'none' }}>
                  <div className="text-4xl font-bold" style={{ color: rs.color }}>#{actualRank}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full List */}
      {activeTab === 'authors' && (
        <div className="space-y-3">
          {topAuthors.slice(3).map((author) => {
            const rs = getRankStyle(author.rank);
            return (
              <div key={author.name} className="flex items-center gap-6 p-5 rounded-2xl transition-all hover:scale-[1.005]"
                style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: theme.colors.bg.tertiary, color: theme.colors.text.muted }}>
                  #{author.rank}
                </div>
                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-3xl"
                  style={{ background: theme.colors.bg.tertiary }}>
                  {author.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-lg" style={{ color: theme.colors.text.primary }}>@{author.name}</span>
                    <div className="flex gap-1">
                      {author.badges.map((badge, i) => (
                        <span key={i} className="text-lg">{badge}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm" style={{ color: theme.colors.text.muted }}>
                    <span>{author.solutions} solutions</span>
                    <span>Avg: {author.avgSpeedup}</span>
                    <span className="flex items-center gap-1"><Flame size={14} style={{ color: theme.colors.accent.orange }} /> {author.streak} day streak</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono" style={{ color: theme.colors.accent.primary }}>{author.score.toLocaleString()}</div>
                  <div className="text-xs" style={{ color: theme.colors.text.muted }}>points</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'solutions' && (
        <div className="space-y-3">
          {topSolutions.map((sol, i) => {
            const lang = languages.find(l => l.name === sol.language) || { icon: '📄', color: '#888' };
            const rs = getRankStyle(i + 1);
            return (
              <div key={sol.id} className="flex items-center gap-6 p-5 rounded-2xl transition-all hover:scale-[1.005]"
                style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold"
                  style={{ background: i < 3 ? rs.bg : theme.colors.bg.tertiary, color: i < 3 ? (i === 0 ? '#000' : '#fff') : theme.colors.text.muted }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-semibold text-lg" style={{ color: theme.colors.text.primary }}>{sol.title}</span>
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                      style={{ background: `${lang.color}20`, color: lang.color }}>
                      {lang.icon} {sol.language}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm" style={{ color: theme.colors.text.muted }}>
                    <span>{sol.avatar} @{sol.author}</span>
                    <span>{sol.category}</span>
                    <span className="flex items-center gap-1"><ThumbsUp size={14} /> {sol.votes.toLocaleString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold font-mono" style={{ color: theme.colors.accent.success }}>{sol.speedup}</div>
                  <div className="text-xs" style={{ color: theme.colors.text.muted }}>faster</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'categories' && (
        <div className="grid grid-cols-2 gap-4">
          {categories.map((cat, i) => (
            <div key={cat.id} className="flex items-center gap-6 p-6 rounded-2xl"
              style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}` }}>
              <div className="w-14 h-14 rounded-xl flex items-center justify-center"
                style={{ background: `${cat.color}20` }}>
                <cat.icon size={28} style={{ color: cat.color }} />
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg mb-1" style={{ color: theme.colors.text.primary }}>{cat.name}</div>
                <div className="text-sm" style={{ color: theme.colors.text.muted }}>{cat.description}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold" style={{ color: cat.color }}>{cat.count.toLocaleString()}</div>
                <div className="text-xs" style={{ color: theme.colors.text.muted }}>solutions</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ==================== PLAYGROUND PAGE ====================
const PlaygroundPage = () => {
  const [userCode, setUserCode] = useState(`def find_duplicates(arr):
    """Find duplicates in array - O(n²) naive approach"""
    duplicates = []
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] == arr[j] and arr[i] not in duplicates:
                duplicates.append(arr[i])
    return duplicates

# Test
arr = [1, 2, 3, 2, 4, 3, 5]
print(find_duplicates(arr))`);
  
  const [optimizedCode, setOptimizedCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('python');

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    await new Promise(r => setTimeout(r, 2000));
    
    setOptimizedCode(`def find_duplicates_optimized(arr):
    """Find duplicates using Counter - O(n)"""
    from collections import Counter
    counts = Counter(arr)
    return [item for item, count in counts.items() if count > 1]

# Alternative: Set-based approach
def find_duplicates_set(arr):
    """Find duplicates using sets - O(n)"""
    seen = set()
    duplicates = set()
    for item in arr:
        if item in seen:
            duplicates.add(item)
        seen.add(item)
    return list(duplicates)`);
    
    setResults({
      speedup: '234x',
      originalTime: '2.34s',
      optimizedTime: '0.01s',
      originalComplexity: 'O(n²)',
      optimizedComplexity: 'O(n)',
      memoryChange: '+12%',
      suggestions: [
        { type: 'success', text: 'Заменены вложенные циклы на Counter' },
        { type: 'success', text: 'Сложность снижена с O(n²) до O(n)' },
        { type: 'info', text: 'Альтернатива: Set-based подход (такая же сложность)' },
      ]
    });
    
    setIsAnalyzing(false);
  };

  const lang = languages.find(l => l.id === selectedLanguage) || languages[0];

  return (
    <div className="h-[calc(100vh-73px)] flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3" style={{ background: theme.colors.bg.secondary, borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: theme.colors.bg.tertiary }}>
            <span className="text-lg">{lang.icon}</span>
            <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent border-none outline-none text-sm font-medium cursor-pointer"
              style={{ color: theme.colors.text.primary }}>
              {languages.map(l => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          <div className="h-6 w-px" style={{ background: theme.colors.border.subtle }} />
          <span className="text-sm" style={{ color: theme.colors.text.muted }}>
            Вставьте код → Нажмите "Find Better" → Получите оптимизированные варианты
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
            style={{ color: theme.colors.text.secondary }}>
            <Upload size={16} /> Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
            style={{ color: theme.colors.text.secondary }}>
            <Download size={16} /> Export
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all hover:bg-white/5"
            style={{ color: theme.colors.text.secondary }}>
            <Share size={16} /> Share
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - User Code */}
        <div className="flex-1 flex flex-col" style={{ borderRight: `1px solid ${theme.colors.border.subtle}` }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ background: theme.colors.bg.tertiary }}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
              <div className="w-3 h-3 rounded-full" style={{ background: '#27ca40' }} />
              <span className="ml-3 text-sm font-medium" style={{ color: theme.colors.text.primary }}>Your Code</span>
            </div>
            <button onClick={() => setUserCode('')} className="text-xs px-2 py-1 rounded"
              style={{ color: theme.colors.text.muted }}>Clear</button>
          </div>
          <textarea
            value={userCode}
            onChange={(e) => setUserCode(e.target.value)}
            className="flex-1 p-4 font-mono text-sm resize-none outline-none"
            style={{ background: '#0d1117', color: '#e6edf3', lineHeight: 1.6 }}
            placeholder="Paste your code here..."
          />
        </div>

        {/* Center - Action Button */}
        <div className="w-20 flex flex-col items-center justify-center gap-4" style={{ background: theme.colors.bg.tertiary }}>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !userCode.trim()}
            className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
            style={{ background: theme.gradients.primary }}
          >
            {isAnalyzing ? (
              <div className="w-6 h-6 border-2 border-transparent border-t-white rounded-full animate-spin" />
            ) : (
              <Search size={24} className="text-white" />
            )}
          </button>
          <span className="text-xs text-center font-medium" style={{ color: theme.colors.text.muted }}>
            Find<br/>Better
          </span>
        </div>

        {/* Right Panel - Optimized Code */}
        <div className="flex-1 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3" style={{ background: theme.colors.bg.tertiary }}>
            <div className="flex items-center gap-2">
              <Sparkles size={16} style={{ color: theme.colors.accent.primary }} />
              <span className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>Optimized Solution</span>
              {results && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-bold"
                  style={{ background: `${theme.colors.accent.success}20`, color: theme.colors.accent.success }}>
                  {results.speedup} faster
                </span>
              )}
            </div>
            {optimizedCode && (
              <button onClick={() => navigator.clipboard.writeText(optimizedCode)}
                className="flex items-center gap-1 text-xs px-2 py-1 rounded"
                style={{ color: theme.colors.accent.primary }}>
                <Copy size={12} /> Copy
              </button>
            )}
          </div>
          
          {optimizedCode ? (
            <pre className="flex-1 p-4 font-mono text-sm overflow-auto"
              style={{ background: '#0d1117', color: '#e6edf3', lineHeight: 1.6 }}>
              <code>{optimizedCode}</code>
            </pre>
          ) : (
            <div className="flex-1 flex items-center justify-center" style={{ background: '#0d1117' }}>
              <div className="text-center">
                <Search size={48} className="mx-auto mb-4 opacity-20" style={{ color: theme.colors.text.muted }} />
                <p className="text-sm" style={{ color: theme.colors.text.muted }}>
                  {isAnalyzing ? 'Analyzing your code...' : 'Click "Find Better" to optimize'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Panel */}
      {results && (
        <div className="px-6 py-4" style={{ background: theme.colors.bg.secondary, borderTop: `1px solid ${theme.colors.border.subtle}` }}>
          {/* Top Row: Metrics */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: `${theme.colors.accent.success}15` }}>
                <div className="text-xs uppercase tracking-wider" style={{ color: theme.colors.text.muted }}>Speedup</div>
                <div className="text-xl font-bold font-mono" style={{ color: theme.colors.accent.success }}>{results.speedup}</div>
              </div>
              
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: theme.colors.bg.tertiary }}>
                <div className="text-xs uppercase tracking-wider" style={{ color: theme.colors.text.muted }}>Time</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm line-through" style={{ color: theme.colors.accent.error }}>{results.originalTime}</span>
                  <ArrowRight size={12} style={{ color: theme.colors.text.muted }} />
                  <span className="font-mono text-sm font-bold" style={{ color: theme.colors.accent.success }}>{results.optimizedTime}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: theme.colors.bg.tertiary }}>
                <div className="text-xs uppercase tracking-wider" style={{ color: theme.colors.text.muted }}>Complexity</div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm line-through" style={{ color: theme.colors.accent.error }}>{results.originalComplexity}</span>
                  <ArrowRight size={12} style={{ color: theme.colors.text.muted }} />
                  <span className="font-mono text-sm font-bold" style={{ color: theme.colors.accent.success }}>{results.optimizedComplexity}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-4 py-2 rounded-xl" style={{ background: theme.colors.bg.tertiary }}>
                <div className="text-xs uppercase tracking-wider" style={{ color: theme.colors.text.muted }}>Memory</div>
                <div className="font-mono text-sm" style={{ color: theme.colors.accent.warning }}>{results.memoryChange}</div>
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all hover:bg-white/5"
                style={{ background: theme.colors.bg.tertiary, color: theme.colors.text.secondary }}>
                <Bookmark size={16} /> Save
              </button>
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all hover:scale-105"
                style={{ background: theme.gradients.primary, color: 'white' }}>
                <Zap size={16} /> Use This
              </button>
            </div>
          </div>
          
          {/* Bottom Row: Suggestions */}
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wider" style={{ color: theme.colors.text.muted }}>Improvements:</span>
            {results.suggestions.map((sug, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                style={{ background: sug.type === 'success' ? `${theme.colors.accent.success}15` : `${theme.colors.accent.cyan}15`, border: `1px solid ${sug.type === 'success' ? theme.colors.accent.success : theme.colors.accent.cyan}30` }}>
                <CheckCircle2 size={14} style={{ color: sug.type === 'success' ? theme.colors.accent.success : theme.colors.accent.cyan }} />
                <span className="text-sm" style={{ color: theme.colors.text.secondary }}>{sug.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== SEARCH PAGE (simplified) ====================
const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    await new Promise(r => setTimeout(r, 1200));
    setResults(mockSearchResults);
    setIsSearching(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-8 py-12">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
          Find the <span style={{ background: theme.gradients.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Best Solution</span>
        </h1>
        <p className="text-lg" style={{ color: theme.colors.text.secondary }}>
          Semantic search по 2.4M+ решений
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-3xl mx-auto mb-8">
        <div className="flex items-center rounded-2xl p-1.5 pl-6"
          style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.medium}` }}>
          <Sparkles size={22} className="mr-4" style={{ color: theme.colors.text.muted }} />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Опишите задачу..."
            className="flex-1 bg-transparent border-none outline-none text-base py-4"
            style={{ color: theme.colors.text.primary }} />
          <button onClick={handleSearch} disabled={isSearching || !query.trim()}
            className="flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-sm disabled:opacity-50"
            style={{ background: query.trim() ? theme.gradients.primary : theme.colors.bg.tertiary, color: theme.colors.text.primary }}>
            {isSearching ? <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin" /> : <Search size={18} />}
            {isSearching ? 'Поиск...' : 'Найти'}
          </button>
        </div>
      </div>

      {/* Results */}
      {hasSearched && !isSearching && (
        <div className="space-y-4">
          {results.map((result, i) => {
            const lang = languages.find(l => l.name === result.language) || { icon: '📄', color: '#888' };
            const InspirationIcon = result.inspiration.icon;
            return (
              <div key={result.id} className="p-6 rounded-2xl"
                style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.subtle}` }}>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: i === 0 ? theme.gradients.gold : i === 1 ? theme.gradients.silver : theme.gradients.bronze }}>
                    {['🥇', '🥈', '🥉'][i]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>{result.title}</h3>
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                        style={{ background: `${lang.color}20`, color: lang.color }}>{lang.icon} {result.language}</span>
                      {result.verified && <span className="px-2 py-0.5 rounded text-xs" style={{ background: `${theme.colors.accent.success}15`, color: theme.colors.accent.success }}>✓ Verified</span>}
                    </div>
                    <p className="text-sm mb-3" style={{ color: theme.colors.text.secondary }}>{result.description}</p>
                    <div className="flex items-center gap-4 text-sm" style={{ color: theme.colors.text.muted }}>
                      <span className="flex items-center gap-1">{result.author.avatar} @{result.author.name}</span>
                      <span>{result.complexity}</span>
                      <span className="flex items-center gap-1"><InspirationIcon size={14} /> {result.inspiration.name}</span>
                      <span className="flex items-center gap-1"><ThumbsUp size={14} /> {result.votes.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="px-4 py-3 rounded-xl" style={{ background: theme.gradients.primary }}>
                      <div className="text-2xl font-bold text-white font-mono">{result.speedup}</div>
                      <div className="text-xs text-white/70">faster</div>
                    </div>
                    <div className="mt-2 text-xs" style={{ color: theme.colors.accent.cyan }}>
                      vs {result.baseline.name.slice(0, 15)}...
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN APP ====================
export default function CodeForgeApp() {
  const [activePage, setActivePage] = useState('explore');

  return (
    <div className="min-h-screen" style={{ background: theme.colors.bg.primary, backgroundImage: theme.gradients.mesh }}>
      {/* Glow Effects */}
      <div className="fixed w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none animate-pulse"
        style={{ background: `${theme.colors.accent.primary}10`, top: '-200px', left: '10%' }} />
      <div className="fixed w-[500px] h-[500px] rounded-full blur-[100px] pointer-events-none animate-pulse"
        style={{ background: `${theme.colors.accent.secondary}08`, top: '40%', right: '5%', animationDelay: '2s' }} />

      <Header activePage={activePage} setActivePage={setActivePage} />

      <main>
        {activePage === 'explore' && <ExplorePage onNavigate={setActivePage} />}
        {activePage === 'search' && <SearchPage />}
        {activePage === 'leaderboard' && <LeaderboardPage />}
        {activePage === 'playground' && <PlaygroundPage />}
      </main>

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
        ::selection { background: ${theme.colors.accent.primary}40; }
        input::placeholder, textarea::placeholder { color: ${theme.colors.text.muted}; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.colors.bg.elevated}; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: ${theme.colors.accent.primary}; }
        select option { background: ${theme.colors.bg.secondary}; color: ${theme.colors.text.primary}; }
      `}</style>
    </div>
  );
}
