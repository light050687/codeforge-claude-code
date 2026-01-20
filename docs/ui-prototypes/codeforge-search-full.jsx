import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Zap, Clock, Users, ChevronRight, Copy, Check, Star, GitBranch, Play, Filter, TrendingUp, BookOpen, Code2, Cpu, ArrowRight, X, ThumbsUp, MessageSquare, Share2, Bookmark, ExternalLink, Terminal, Layers, Award, Brain, Atom, FlaskConical, ChevronDown, BarChart3, History, Globe, CheckCircle2, GitCompare, ArrowLeftRight, Info, AlertCircle, Scale, Minus, Plus, Eye, ChevronUp } from 'lucide-react';

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
    },
    text: {
      primary: '#f8fafc',
      secondary: '#94a3b8',
      muted: '#64748b',
    },
    border: {
      subtle: 'rgba(255,255,255,0.06)',
      medium: 'rgba(255,255,255,0.1)',
      accent: 'rgba(99,102,241,0.3)',
    }
  },
  gradients: {
    primary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
    mesh: `radial-gradient(at 40% 20%, rgba(99,102,241,0.08) 0px, transparent 50%),
           radial-gradient(at 80% 0%, rgba(139,92,246,0.06) 0px, transparent 50%),
           radial-gradient(at 0% 50%, rgba(168,85,247,0.05) 0px, transparent 50%)`,
  }
};

// ==================== LANGUAGES DATA ====================
const languages = [
  { id: 'python', name: 'Python', icon: '🐍', color: '#3776ab', popular: true },
  { id: 'javascript', name: 'JavaScript', icon: '⚡', color: '#f7df1e', popular: true },
  { id: 'typescript', name: 'TypeScript', icon: '📘', color: '#3178c6', popular: true },
  { id: 'go', name: 'Go', icon: '🔵', color: '#00add8', popular: true },
  { id: 'rust', name: 'Rust', icon: '🦀', color: '#dea584', popular: true },
  { id: 'cpp', name: 'C++', icon: '⚙️', color: '#00599c', popular: true },
  { id: 'java', name: 'Java', icon: '☕', color: '#ed8b00', popular: true },
  { id: 'csharp', name: 'C#', icon: '🎯', color: '#512bd4', popular: false },
  { id: 'kotlin', name: 'Kotlin', icon: '🟣', color: '#7f52ff', popular: false },
  { id: 'swift', name: 'Swift', icon: '🍎', color: '#fa7343', popular: false },
  { id: 'ruby', name: 'Ruby', icon: '💎', color: '#cc342d', popular: false },
  { id: 'php', name: 'PHP', icon: '🐘', color: '#777bb4', popular: false },
];

// ==================== MOCK DATA WITH BASELINE ====================
const mockResults = [
  {
    id: 1, rank: 1, title: 'TimSort Hybrid с адаптивным порогом',
    description: 'Комбинация merge sort и insertion sort с динамическим определением оптимального размера run',
    language: 'Python', 
    speedup: '47x',
    speedupValue: 47,
    baseline: {
      name: 'Наивная сортировка O(n²)',
      code: 'sorted() с вложенными циклами',
      time: '2.35s',
      description: 'Bubble sort / Selection sort на массиве 100K элементов'
    },
    benchmarks: {
      time: '0.05s',
      timeMs: 50,
      memory: '12.4 MB',
      memoryMb: 12.4,
      operations: '1.2M ops/sec',
      opsPerSec: 1200000,
      cacheHits: '94%',
      cacheHitPercent: 94,
    },
    complexity: 'O(n log n)', memoryUsage: 'O(n)',
    benchmarkScore: 98.7, votes: 2847, comments: 156, contributors: 23,
    inspiration: { name: 'Термодинамика', icon: Atom },
    author: { name: 'alex_perf', avatar: '🚀', rating: 4.9 },
    tags: ['sorting', 'hybrid', 'adaptive'], verified: true, trending: true,
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
    description: 'Многопоточная реализация с балансировкой нагрузки через work stealing',
    language: 'Go', 
    speedup: '32x',
    speedupValue: 32,
    baseline: {
      name: 'Однопоточный QuickSort',
      code: 'sort.Slice() стандартная библиотека',
      time: '1.6s',
      description: 'Go standard library sort на массиве 100K элементов'
    },
    benchmarks: {
      time: '0.05s',
      timeMs: 50,
      memory: '8.2 MB',
      memoryMb: 8.2,
      operations: '980K ops/sec',
      opsPerSec: 980000,
      cacheHits: '89%',
      cacheHitPercent: 89,
    },
    complexity: 'O(n log n)', memoryUsage: 'O(log n)',
    benchmarkScore: 94.2, votes: 1923, comments: 89, contributors: 15,
    inspiration: { name: 'Game Theory', icon: Brain },
    author: { name: 'parallel_ninja', avatar: '⚡', rating: 4.7 },
    tags: ['parallel', 'multithread'], verified: true, trending: false,
    code: `func parallelQuickSort(arr []int, numWorkers int) []int {
    workQueue := NewWorkStealingQueue(numWorkers)
    workQueue.Push(Task{arr, 0, len(arr) - 1})
    
    var wg sync.WaitGroup
    for i := 0; i < numWorkers; i++ {
        wg.Add(1)
        go worker(workQueue, &wg)
    }
    wg.Wait()
    return arr
}`
  },
  {
    id: 3, rank: 3, title: 'Radix Sort с кэш-оптимизацией',
    description: 'LSD Radix Sort с учётом размера кэша L1/L2',
    language: 'Rust', 
    speedup: '28x',
    speedupValue: 28,
    baseline: {
      name: 'Стандартный Radix Sort',
      code: 'Базовая LSD реализация',
      time: '1.4s',
      description: 'Non-optimized radix sort на массиве 100K элементов'
    },
    benchmarks: {
      time: '0.05s',
      timeMs: 50,
      memory: '18.6 MB',
      memoryMb: 18.6,
      operations: '850K ops/sec',
      opsPerSec: 850000,
      cacheHits: '97%',
      cacheHitPercent: 97,
    },
    complexity: 'O(nk)', memoryUsage: 'O(n+k)',
    benchmarkScore: 91.5, votes: 1456, comments: 67, contributors: 11,
    inspiration: { name: 'Нейросети', icon: FlaskConical },
    author: { name: 'cache_master', avatar: '🧠', rating: 4.8 },
    tags: ['radix', 'cache-friendly'], verified: true, trending: true,
    code: `pub fn cache_aware_radix_sort(arr: &mut [u32], bits: usize) {
    let max_val = *arr.iter().max().unwrap_or(&0);
    let mut exp = 1u32;
    
    while max_val / exp > 0 {
        let mut buckets: Vec<Vec<u32>> = 
            (0..(1 << bits)).map(|_| Vec::new()).collect();
        
        for &num in arr.iter() {
            let idx = ((num / exp) % (1 << bits)) as usize;
            buckets[idx].push(num);
        }
        
        arr.iter_mut().zip(buckets.into_iter().flatten())
            .for_each(|(a, b)| *a = b);
        exp *= 1 << bits;
    }
}`
  }
];

const suggestedQueries = [
  { text: 'быстрая сортировка строк по длине', icon: '📝' },
  { text: 'поиск дубликатов в массиве O(n)', icon: '🔍' },
  { text: 'парсинг JSON без аллокаций', icon: '⚡' },
];

// ==================== LANGUAGE SELECTOR ====================
const LanguageSelector = ({ selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLanguages = languages.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const popularLangs = filteredLanguages.filter(l => l.popular);
  const otherLangs = filteredLanguages.filter(l => !l.popular);

  const selectedLang = languages.find(l => l.id === selected);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02]"
        style={{
          background: selectedLang ? `${selectedLang.color}15` : theme.colors.bg.tertiary,
          border: `1px solid ${selectedLang ? selectedLang.color : theme.colors.border.medium}`,
          color: selectedLang ? theme.colors.text.primary : theme.colors.text.secondary,
        }}
      >
        {selectedLang ? (
          <>
            <span className="text-lg">{selectedLang.icon}</span>
            <span>{selectedLang.name}</span>
          </>
        ) : (
          <>
            <Globe size={18} />
            <span>Любой язык</span>
          </>
        )}
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 w-72 rounded-2xl overflow-hidden shadow-2xl z-[100]"
          style={{
            background: theme.colors.bg.secondary,
            border: `1px solid ${theme.colors.border.medium}`,
          }}
        >
          {/* Search */}
          <div className="p-3" style={{ borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
              style={{ background: theme.colors.bg.tertiary }}>
              <Search size={16} style={{ color: theme.colors.text.muted }} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Поиск языка..."
                className="flex-1 bg-transparent border-none outline-none text-sm"
                style={{ color: theme.colors.text.primary }}
                autoFocus
              />
            </div>
          </div>

          {/* Clear selection */}
          {selected && (
            <button
              onClick={() => { onChange(null); setIsOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-white/5"
              style={{ color: theme.colors.text.secondary, borderBottom: `1px solid ${theme.colors.border.subtle}` }}
            >
              <X size={18} />
              <span>Сбросить выбор (любой язык)</span>
            </button>
          )}

          {/* Languages list */}
          <div className="max-h-80 overflow-y-auto">
            {popularLangs.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.muted, background: theme.colors.bg.glass }}>
                  Популярные
                </div>
                {popularLangs.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => { onChange(lang.id); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-white/5"
                    style={{
                      background: selected === lang.id ? `${lang.color}15` : 'transparent',
                      color: selected === lang.id ? lang.color : theme.colors.text.primary,
                    }}
                  >
                    <span className="text-xl w-8 text-center">{lang.icon}</span>
                    <span className="flex-1 text-left font-medium">{lang.name}</span>
                    {selected === lang.id && <CheckCircle2 size={18} style={{ color: lang.color }} />}
                    <div className="w-3 h-3 rounded-full" style={{ background: lang.color }} />
                  </button>
                ))}
              </>
            )}

            {otherLangs.length > 0 && (
              <>
                <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider"
                  style={{ color: theme.colors.text.muted, background: theme.colors.bg.glass }}>
                  Другие
                </div>
                {otherLangs.map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => { onChange(lang.id); setIsOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm transition-all hover:bg-white/5"
                    style={{
                      background: selected === lang.id ? `${lang.color}15` : 'transparent',
                      color: selected === lang.id ? lang.color : theme.colors.text.primary,
                    }}
                  >
                    <span className="text-xl w-8 text-center">{lang.icon}</span>
                    <span className="flex-1 text-left font-medium">{lang.name}</span>
                    {selected === lang.id && <CheckCircle2 size={18} style={{ color: lang.color }} />}
                    <div className="w-3 h-3 rounded-full" style={{ background: lang.color }} />
                  </button>
                ))}
              </>
            )}

            {filteredLanguages.length === 0 && (
              <div className="px-4 py-8 text-center text-sm" style={{ color: theme.colors.text.muted }}>
                Язык не найден
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== BASELINE INFO POPUP ====================
const BaselinePopup = ({ baseline, speedup, isOpen, onClose }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl"
        style={{ background: theme.colors.bg.secondary, border: `1px solid ${theme.colors.border.medium}` }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg transition-all hover:bg-white/10"
          style={{ color: theme.colors.text.muted }}
        >
          <X size={20} />
        </button>
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: `${theme.colors.accent.primary}20` }}>
            <Info size={24} style={{ color: theme.colors.accent.primary }} />
          </div>
          <div>
            <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              Baseline для сравнения
            </h3>
            <p className="text-sm" style={{ color: theme.colors.text.muted }}>
              Относительно чего измерен speedup
            </p>
          </div>
        </div>
        
        {/* Baseline info */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl" style={{ background: theme.colors.bg.tertiary }}>
            <div className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
              Название baseline
            </div>
            <div className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>
              {baseline.name}
            </div>
          </div>
          
          <div className="p-4 rounded-xl" style={{ background: theme.colors.bg.tertiary }}>
            <div className="text-sm font-medium mb-1" style={{ color: theme.colors.text.secondary }}>
              Описание
            </div>
            <div className="text-sm" style={{ color: theme.colors.text.primary }}>
              {baseline.description}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl" style={{ background: `${theme.colors.accent.error}15`, border: `1px solid ${theme.colors.accent.error}30` }}>
              <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: theme.colors.accent.error }}>
                Время Baseline
              </div>
              <div className="text-2xl font-mono font-bold" style={{ color: theme.colors.accent.error }}>
                {baseline.time}
              </div>
            </div>
            
            <div className="p-4 rounded-xl" style={{ background: `${theme.colors.accent.success}15`, border: `1px solid ${theme.colors.accent.success}30` }}>
              <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: theme.colors.accent.success }}>
                Ускорение
              </div>
              <div className="text-2xl font-mono font-bold" style={{ color: theme.colors.accent.success }}>
                {speedup}
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="mt-6 pt-4 flex justify-end" style={{ borderTop: `1px solid ${theme.colors.border.subtle}` }}>
          <button 
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: theme.colors.accent.primary, color: 'white' }}
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

// ==================== COMPARISON PANEL ====================
const ComparisonPanel = ({ items, onRemove, onClear, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  if (items.length === 0) return null;

  const getComparisonColor = (value, allValues, higherIsBetter = true) => {
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    if (higherIsBetter) {
      if (value === max) return theme.colors.accent.success;
      if (value === min) return theme.colors.accent.error;
    } else {
      if (value === min) return theme.colors.accent.success;
      if (value === max) return theme.colors.accent.error;
    }
    return theme.colors.accent.warning;
  };

  const metrics = [
    { key: 'speedupValue', label: 'Speedup', unit: 'x', higherBetter: true },
    { key: 'benchmarks.timeMs', label: 'Время', unit: 'ms', higherBetter: false },
    { key: 'benchmarks.memoryMb', label: 'Память', unit: 'MB', higherBetter: false },
    { key: 'benchmarks.opsPerSec', label: 'Ops/sec', unit: '', higherBetter: true, format: (v) => `${(v/1000).toFixed(0)}K` },
    { key: 'benchmarks.cacheHitPercent', label: 'Cache Hits', unit: '%', higherBetter: true },
    { key: 'benchmarkScore', label: 'Score', unit: '', higherBetter: true },
  ];

  const getValue = (item, key) => {
    const keys = key.split('.');
    let val = item;
    for (const k of keys) val = val?.[k];
    return val;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 shadow-2xl"
      style={{ background: theme.colors.bg.secondary, borderTop: `1px solid ${theme.colors.border.medium}` }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
        <div className="flex items-center gap-4">
          <Scale size={20} style={{ color: theme.colors.accent.primary }} />
          <span className="font-semibold" style={{ color: theme.colors.text.primary }}>
            Сравнение решений
          </span>
          <span className="px-3 py-1 rounded-full text-sm"
            style={{ background: theme.colors.bg.tertiary, color: theme.colors.text.secondary }}>
            {items.length} из 3
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: theme.colors.bg.tertiary }}>
            {[{ id: 'overview', label: 'Обзор' }, { id: 'benchmarks', label: 'Бенчмарки' }, { id: 'code', label: 'Код' }].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="px-4 py-2 rounded-md text-sm font-medium transition-all"
                style={{ background: activeTab === tab.id ? theme.colors.accent.primary : 'transparent', color: activeTab === tab.id ? 'white' : theme.colors.text.secondary }}>
                {tab.label}
              </button>
            ))}
          </div>
          <button onClick={onClear} className="px-3 py-2 rounded-lg text-sm hover:bg-white/5"
            style={{ color: theme.colors.text.muted }}>Очистить</button>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5"
            style={{ color: theme.colors.text.muted }}><X size={20} /></button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 max-h-80 overflow-auto">
        {activeTab === 'overview' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map((item, idx) => {
              const langData = languages.find(l => l.name === item.language) || { icon: '📄', color: '#888' };
              return (
                <div key={item.id} className="relative">
                  <button onClick={() => onRemove(item.id)}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center z-10 hover:scale-110"
                    style={{ background: theme.colors.accent.error, color: 'white' }}>
                    <X size={14} />
                  </button>
                  
                  <div className="p-4 rounded-xl h-full"
                    style={{ background: theme.colors.bg.tertiary, border: `2px solid ${idx === 0 ? theme.colors.accent.success : theme.colors.border.subtle}` }}>
                    {idx === 0 && (
                      <div className="absolute -top-3 left-4 px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: theme.colors.accent.success, color: 'white' }}>👑 Лучший</div>
                    )}
                    
                    <div className="flex items-start gap-3 mb-4 mt-2">
                      <span className="text-2xl">{langData.icon}</span>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate" style={{ color: theme.colors.text.primary }}>{item.title}</h4>
                        <div className="text-xs mt-1" style={{ color: langData.color }}>{item.language}</div>
                      </div>
                    </div>
                    
                    <div className="text-center py-4 rounded-lg mb-4" style={{ background: `${theme.colors.accent.primary}15` }}>
                      <div className="text-3xl font-bold font-mono" style={{ color: theme.colors.accent.primary }}>{item.speedup}</div>
                      <div className="text-xs mt-1" style={{ color: theme.colors.text.muted }}>vs {item.baseline.name}</div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span style={{ color: theme.colors.text.muted }}>Время:</span>
                        <span className="font-mono" style={{ color: theme.colors.text.primary }}>{item.benchmarks.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: theme.colors.text.muted }}>Память:</span>
                        <span className="font-mono" style={{ color: theme.colors.text.primary }}>{item.benchmarks.memory}</span>
                      </div>
                      <div className="flex justify-between">
                        <span style={{ color: theme.colors.text.muted }}>Score:</span>
                        <span className="font-mono font-bold" style={{ color: theme.colors.accent.success }}>{item.benchmarkScore}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
                <th className="text-left py-3 px-4 text-sm font-medium" style={{ color: theme.colors.text.muted }}>Метрика</th>
                {items.map(item => (
                  <th key={item.id} className="text-center py-3 px-4 text-sm font-medium" style={{ color: theme.colors.text.primary }}>
                    {item.title.slice(0, 15)}...
                  </th>
                ))}
                <th className="text-center py-3 px-4 text-sm font-medium" style={{ color: theme.colors.text.muted }}>Δ</th>
              </tr>
            </thead>
            <tbody>
              {metrics.map(metric => {
                const values = items.map(item => getValue(item, metric.key));
                const max = Math.max(...values);
                const min = Math.min(...values);
                const diff = metric.higherBetter ? ((max - min) / min * 100).toFixed(0) : ((max - min) / max * 100).toFixed(0);
                
                return (
                  <tr key={metric.key} style={{ borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
                    <td className="py-3 px-4 text-sm" style={{ color: theme.colors.text.secondary }}>{metric.label}</td>
                    {items.map(item => {
                      const value = getValue(item, metric.key);
                      const color = getComparisonColor(value, values, metric.higherBetter);
                      return (
                        <td key={item.id} className="text-center py-3 px-4">
                          <span className="font-mono font-semibold text-lg" style={{ color }}>
                            {metric.format ? metric.format(value) : value}{metric.unit}
                          </span>
                        </td>
                      );
                    })}
                    <td className="text-center py-3 px-4">
                      <span className="px-2 py-1 rounded text-sm font-medium"
                        style={{ background: `${theme.colors.accent.warning}20`, color: theme.colors.accent.warning }}>
                        {diff}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {activeTab === 'code' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}>
            {items.map(item => {
              const langData = languages.find(l => l.name === item.language) || { icon: '📄', color: '#888' };
              return (
                <div key={item.id} className="rounded-xl overflow-hidden" style={{ background: '#0d1117' }}>
                  <div className="flex items-center justify-between px-4 py-2"
                    style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <span className="flex items-center gap-2 text-xs" style={{ color: theme.colors.text.muted }}>
                      <span style={{ color: langData.color }}>{langData.icon}</span> {item.language}
                    </span>
                    <span className="font-mono text-xs" style={{ color: theme.colors.accent.primary }}>{item.speedup}</span>
                  </div>
                  <pre className="p-4 text-xs overflow-auto max-h-52 font-mono" style={{ color: '#e6edf3' }}>
                    <code>{item.code}</code>
                  </pre>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== RESULT CARD ====================
const ResultCard = ({ result, index, isSelected, onToggleCompare, compareCount }) => {
  const [copied, setCopied] = useState(false);
  const [showBaseline, setShowBaseline] = useState(false);
  const [baselinePopupOpen, setBaselinePopupOpen] = useState(false);
  const InspirationIcon = result.inspiration.icon;
  const langData = languages.find(l => l.name === result.language) || { icon: '📄', color: '#888' };

  const copyCode = () => {
    navigator.clipboard.writeText(result.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rankStyles = {
    1: { bg: 'linear-gradient(135deg, #fbbf24, #f59e0b)', emoji: '🥇' },
    2: { bg: 'linear-gradient(135deg, #e2e8f0, #94a3b8)', emoji: '🥈' },
    3: { bg: 'linear-gradient(135deg, #d97706, #b45309)', emoji: '🥉' },
  };
  const rs = rankStyles[result.rank] || { bg: theme.colors.bg.elevated, emoji: `#${result.rank}` };
  const canCompare = compareCount < 3 || isSelected;

  return (
    <>
      <div className="rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
        style={{ 
          background: theme.colors.bg.secondary,
          border: `2px solid ${isSelected ? theme.colors.accent.primary : theme.colors.border.subtle}`,
          boxShadow: isSelected ? `0 0 30px ${theme.colors.accent.primary}30` : 'none',
          animation: `fadeIn 0.5s ease ${index * 0.1}s both`
        }}>
        
        {isSelected && (
          <div className="px-4 py-2 flex items-center gap-2" style={{ background: `${theme.colors.accent.primary}20` }}>
            <CheckCircle2 size={16} style={{ color: theme.colors.accent.primary }} />
            <span className="text-sm font-medium" style={{ color: theme.colors.accent.primary }}>Выбрано для сравнения</span>
          </div>
        )}
        
        {/* Header */}
        <div className="flex items-start gap-4 p-6" style={{ borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
          <button onClick={() => onToggleCompare(result)} disabled={!canCompare}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${canCompare ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-50'}`}
            style={{ background: isSelected ? theme.colors.accent.primary : theme.colors.bg.tertiary, border: `1px solid ${isSelected ? theme.colors.accent.primary : theme.colors.border.medium}` }}>
            {isSelected ? <Check size={20} style={{ color: 'white' }} /> : <Plus size={20} style={{ color: theme.colors.text.muted }} />}
          </button>
          
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: rs.bg }}>{rs.emoji}</div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h3 className="text-lg font-semibold" style={{ color: theme.colors.text.primary }}>{result.title}</h3>
              {result.verified && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
                  style={{ background: `${theme.colors.accent.success}15`, color: theme.colors.accent.success }}>
                  <Check size={12} /> Verified
                </span>
              )}
              {result.trending && (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium"
                  style={{ background: `${theme.colors.accent.pink}15`, color: theme.colors.accent.pink }}>
                  <TrendingUp size={12} /> Trending
                </span>
              )}
            </div>
            <p className="text-sm" style={{ color: theme.colors.text.secondary }}>{result.description}</p>
          </div>
          
          {/* Speedup */}
          <div className="flex-shrink-0 text-right">
            <div className="rounded-xl px-5 py-4 text-center" style={{ background: theme.gradients.primary }}>
              <div className="text-2xl font-bold text-white font-mono">{result.speedup}</div>
              <div className="text-xs text-white/70 uppercase tracking-wider">faster</div>
            </div>
            {/* Baseline info button */}
            <button 
              onClick={() => setBaselinePopupOpen(true)}
              className="mt-2 flex items-center gap-1 text-xs transition-all hover:opacity-100 opacity-70 mx-auto"
              style={{ color: theme.colors.accent.cyan }}
            >
              <Info size={12} />
              <span>vs {result.baseline.name.slice(0, 20)}...</span>
            </button>
          </div>
        </div>

        {/* Expandable baseline */}
        <button 
          onClick={() => setShowBaseline(!showBaseline)}
          className="w-full px-6 py-3 flex items-center gap-4 transition-all hover:bg-white/5"
          style={{ background: theme.colors.bg.glass, borderBottom: `1px solid ${theme.colors.border.subtle}` }}
        >
          <ArrowLeftRight size={16} style={{ color: theme.colors.accent.secondary }} />
          <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
            Сравнение с baseline: <strong style={{ color: theme.colors.text.primary }}>{result.baseline.name}</strong>
          </span>
          <ChevronDown size={16} className={`ml-auto transition-transform ${showBaseline ? 'rotate-180' : ''}`}
            style={{ color: theme.colors.text.muted }} />
        </button>

        {showBaseline && (
          <div className="px-6 py-4 grid grid-cols-2 gap-4"
            style={{ background: theme.colors.bg.glass, borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
            <div className="p-4 rounded-xl" style={{ background: `${theme.colors.accent.error}10`, border: `1px solid ${theme.colors.accent.error}30` }}>
              <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: theme.colors.accent.error }}>
                ❌ Baseline ({result.baseline.name})
              </div>
              <div className="text-2xl font-mono font-bold" style={{ color: theme.colors.accent.error }}>{result.baseline.time}</div>
              <div className="text-xs mt-2" style={{ color: theme.colors.text.muted }}>{result.baseline.description}</div>
            </div>
            <div className="p-4 rounded-xl" style={{ background: `${theme.colors.accent.success}10`, border: `1px solid ${theme.colors.accent.success}30` }}>
              <div className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: theme.colors.accent.success }}>
                ✅ Это решение
              </div>
              <div className="text-2xl font-mono font-bold" style={{ color: theme.colors.accent.success }}>{result.benchmarks.time}</div>
              <div className="text-xs mt-2" style={{ color: theme.colors.text.muted }}>На {result.speedup} быстрее baseline</div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-6 px-6 py-4 flex-wrap" 
          style={{ background: theme.colors.bg.glass, borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
          <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: `${langData.color}20`, border: `1px solid ${langData.color}50`, color: langData.color }}>
            <span className="text-base">{langData.icon}</span> {result.language}
          </span>
          <span className="flex items-center gap-2 text-sm" style={{ color: theme.colors.text.secondary }}>
            <Zap size={16} style={{ color: theme.colors.accent.warning }} /> {result.complexity}
          </span>
          <span className="flex items-center gap-2 text-sm" style={{ color: theme.colors.text.secondary }}>
            <Cpu size={16} style={{ color: theme.colors.accent.tertiary }} /> {result.memoryUsage}
          </span>
          <span className="flex items-center gap-2 text-sm" style={{ color: theme.colors.text.secondary }}>
            <BarChart3 size={16} style={{ color: theme.colors.accent.success }} /> {result.benchmarkScore}
          </span>
          <span className="flex items-center gap-2 ml-auto px-3 py-1.5 rounded-lg text-sm font-medium"
            style={{ background: `${theme.colors.accent.secondary}15`, color: theme.colors.accent.secondary }}>
            <InspirationIcon size={16} /> {result.inspiration.name}
          </span>
        </div>

        {/* Code */}
        <div className="px-6">
          <div className="my-5 rounded-xl overflow-hidden" style={{ background: '#0d1117' }}>
            <div className="flex items-center justify-between px-4 py-3"
              style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
                <div className="w-3 h-3 rounded-full" style={{ background: '#27ca40' }} />
                <span className="ml-3 flex items-center gap-2 text-xs" style={{ color: theme.colors.text.muted }}>
                  <span style={{ color: langData.color }}>{langData.icon}</span>
                  solution.{result.language === 'Python' ? 'py' : result.language === 'Go' ? 'go' : 'rs'}
                </span>
              </div>
              <button onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-all"
                style={{ background: copied ? theme.colors.accent.success : 'transparent', border: `1px solid ${copied ? theme.colors.accent.success : theme.colors.border.medium}`, color: copied ? 'white' : theme.colors.text.secondary }}>
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy</>}
              </button>
            </div>
            <pre className="p-5 text-sm overflow-auto font-mono" style={{ color: '#e6edf3', maxHeight: '180px', lineHeight: 1.6 }}>
              <code>{result.code}</code>
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 flex-wrap gap-3"
          style={{ borderTop: `1px solid ${theme.colors.border.subtle}` }}>
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                style={{ background: theme.colors.bg.elevated }}>{result.author.avatar}</div>
              <div>
                <div className="text-sm font-medium" style={{ color: theme.colors.text.primary }}>@{result.author.name}</div>
                <div className="flex items-center gap-1">
                  <Star size={12} style={{ color: theme.colors.accent.warning, fill: theme.colors.accent.warning }} />
                  <span className="text-xs" style={{ color: theme.colors.text.muted }}>{result.author.rating}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm" style={{ color: theme.colors.text.muted }}>
              <span className="flex items-center gap-1.5"><ThumbsUp size={14} /> {result.votes.toLocaleString()}</span>
              <span className="flex items-center gap-1.5"><MessageSquare size={14} /> {result.comments}</span>
              <span className="flex items-center gap-1.5"><Users size={14} /> {result.contributors}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onToggleCompare(result)} disabled={!canCompare}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm transition-all disabled:opacity-50"
              style={{ background: isSelected ? `${theme.colors.accent.primary}20` : 'transparent', border: `1px solid ${isSelected ? theme.colors.accent.primary : theme.colors.border.medium}`, color: isSelected ? theme.colors.accent.primary : theme.colors.text.secondary }}>
              <Scale size={16} /> {isSelected ? 'В сравнении' : 'Сравнить'}
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm transition-all"
              style={{ background: 'transparent', border: `1px solid ${theme.colors.border.medium}`, color: theme.colors.text.secondary }}>
              <Play size={16} /> Playground
            </button>
            <button className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: theme.gradients.primary, color: 'white' }}>
              <Zap size={16} /> Use This
            </button>
          </div>
        </div>
      </div>
      
      {/* Baseline Popup Modal */}
      <BaselinePopup 
        baseline={result.baseline} 
        speedup={result.speedup} 
        isOpen={baselinePopupOpen}
        onClose={() => setBaselinePopupOpen(false)}
      />
    </>
  );
};

// ==================== SEARCH BAR ====================
const SearchBar = ({ query, setQuery, onSearch, isSearching, selectedLanguage, onLanguageChange }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative">
        {isFocused && <div className="absolute -inset-0.5 rounded-2xl opacity-75 blur-lg" style={{ background: theme.gradients.primary }} />}
        <div className={`relative flex items-center rounded-2xl p-1.5 pl-6 transition-all duration-300 ${isFocused ? 'shadow-[0_0_40px_rgba(99,102,241,0.2)]' : ''}`}
          style={{ background: theme.colors.bg.secondary, border: `1px solid ${isFocused ? theme.colors.accent.primary : theme.colors.border.medium}` }}>
          <Sparkles size={22} className="mr-4 transition-colors flex-shrink-0" style={{ color: isFocused ? theme.colors.accent.primary : theme.colors.text.muted }} />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Опишите задачу: 'как быстро отсортировать массив'..."
            className="flex-1 bg-transparent border-none outline-none text-base py-4 min-w-0"
            style={{ color: theme.colors.text.primary }} />
          {query && (
            <button onClick={() => setQuery('')} className="p-2 opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
              style={{ color: theme.colors.text.muted }}><X size={18} /></button>
          )}
          
          {/* Language Selector */}
          <div className="mx-2 flex-shrink-0">
            <LanguageSelector selected={selectedLanguage} onChange={onLanguageChange} />
          </div>
          
          <button onClick={onSearch} disabled={isSearching || !query.trim()}
            className="flex items-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-sm transition-all disabled:opacity-50 flex-shrink-0"
            style={{ background: query.trim() ? theme.gradients.primary : theme.colors.bg.tertiary, color: theme.colors.text.primary }}>
            {isSearching ? <><div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin" /> Поиск...</> : <><Search size={18} /> Найти</>}
          </button>
        </div>
      </div>
      
      {/* Selected language indicator */}
      {selectedLanguage && (
        <div className="flex justify-center mt-4">
          {(() => {
            const lang = languages.find(l => l.id === selectedLanguage);
            return lang ? (
              <div className="flex items-center gap-2 px-4 py-2 rounded-full text-sm"
                style={{ background: `${lang.color}15`, border: `1px solid ${lang.color}40` }}>
                <span className="text-lg">{lang.icon}</span>
                <span style={{ color: lang.color }}>Поиск решений на {lang.name}</span>
                <button onClick={() => onLanguageChange(null)} className="ml-2 opacity-60 hover:opacity-100">
                  <X size={14} style={{ color: lang.color }} />
                </button>
              </div>
            ) : null;
          })()}
        </div>
      )}
    </div>
  );
};

// ==================== MAIN ====================
export default function CodeForgeSearch() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [compareItems, setCompareItems] = useState([]);
  const [showComparePanel, setShowComparePanel] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    setHasSearched(true);
    await new Promise(r => setTimeout(r, 1200));
    setResults(mockResults);
    setIsSearching(false);
  };

  const toggleCompare = (item) => {
    if (compareItems.find(i => i.id === item.id)) {
      setCompareItems(compareItems.filter(i => i.id !== item.id));
    } else if (compareItems.length < 3) {
      setCompareItems([...compareItems, item]);
      setShowComparePanel(true);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: theme.colors.bg.primary, backgroundImage: theme.gradients.mesh }}>
      {/* Glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full blur-[80px] pointer-events-none animate-pulse"
        style={{ background: `${theme.colors.accent.primary}15`, top: '-200px', left: '10%' }} />
      <div className="absolute w-[500px] h-[500px] rounded-full blur-[80px] pointer-events-none animate-pulse"
        style={{ background: `${theme.colors.accent.secondary}10`, top: '30%', right: '5%', animationDelay: '2s' }} />

      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl px-8 py-4"
        style={{ background: `${theme.colors.bg.primary}dd`, borderBottom: `1px solid ${theme.colors.border.subtle}` }}>
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: theme.gradients.primary }}>
              <Zap size={22} className="text-white" />
            </div>
            <span className="text-xl font-bold" style={{ color: theme.colors.text.primary }}>
              CodeForge <span style={{ color: theme.colors.accent.primary }}>Cloud</span>
            </span>
          </div>
          <nav className="flex items-center gap-1">
            {['Explore', 'Search', 'Leaderboard', 'Playground'].map((item, i) => (
              <button key={i} className="px-4 py-2 rounded-lg text-sm transition-all"
                style={{ background: item === 'Search' ? theme.colors.bg.elevated : 'transparent', color: item === 'Search' ? theme.colors.text.primary : theme.colors.text.secondary, fontWeight: item === 'Search' ? 600 : 400 }}>{item}</button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            {compareItems.length > 0 && (
              <button onClick={() => setShowComparePanel(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                style={{ background: `${theme.colors.accent.primary}20`, border: `1px solid ${theme.colors.accent.primary}`, color: theme.colors.accent.primary }}>
                <Scale size={18} /> Сравнить ({compareItems.length})
              </button>
            )}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold text-white cursor-pointer"
              style={{ background: theme.gradients.primary }}>JD</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-8 py-16 relative z-10" style={{ paddingBottom: compareItems.length > 0 && showComparePanel ? '400px' : '64px' }}>
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-6"
            style={{ background: `${theme.colors.accent.primary}15`, border: `1px solid ${theme.colors.accent.primary}30` }}>
            <Sparkles size={16} style={{ color: theme.colors.accent.primary }} />
            <span className="text-sm font-medium" style={{ color: theme.colors.accent.primary }}>AI-Powered Code Discovery</span>
          </div>
          <h1 className="text-5xl font-bold mb-4" style={{ color: theme.colors.text.primary }}>
            Find the <span style={{ background: theme.gradients.primary, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Best Solution</span>
          </h1>
          <p className="text-lg max-w-xl mx-auto" style={{ color: theme.colors.text.secondary }}>
            2.4M+ решений • Сравнивайте варианты side-by-side • Понятный baseline
          </p>
        </div>

        {/* Search */}
        <SearchBar query={query} setQuery={setQuery} onSearch={handleSearch} isSearching={isSearching}
          selectedLanguage={selectedLanguage} onLanguageChange={setSelectedLanguage} />

        {/* Suggestions */}
        {!hasSearched && (
          <>
            <div className="flex flex-wrap gap-2.5 justify-center mt-6">
              {suggestedQueries.map((item, i) => (
                <button key={i} onClick={() => { setQuery(item.text); setTimeout(handleSearch, 100); }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm transition-all hover:scale-105"
                  style={{ background: theme.colors.bg.glass, border: `1px solid ${theme.colors.border.subtle}`, color: theme.colors.text.secondary }}>
                  <span>{item.icon}</span> {item.text}
                </button>
              ))}
            </div>
            
            {/* Quick language select */}
            <div className="flex flex-wrap gap-2 justify-center mt-8 max-w-2xl mx-auto">
              <span className="text-xs uppercase tracking-wider w-full text-center mb-2" style={{ color: theme.colors.text.muted }}>
                Выберите язык
              </span>
              {languages.filter(l => l.popular).map(lang => (
                <button key={lang.id} onClick={() => setSelectedLanguage(selectedLanguage === lang.id ? null : lang.id)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105"
                  style={{ background: selectedLanguage === lang.id ? `${lang.color}20` : theme.colors.bg.tertiary, border: `1px solid ${selectedLanguage === lang.id ? lang.color : theme.colors.border.subtle}`, color: selectedLanguage === lang.id ? lang.color : theme.colors.text.secondary }}>
                  <span className="text-lg">{lang.icon}</span> {lang.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Results */}
        {hasSearched && (
          <div className="mt-12">
            <div className="flex items-center gap-3 p-4 rounded-xl mb-6"
              style={{ background: `${theme.colors.accent.cyan}10`, border: `1px solid ${theme.colors.accent.cyan}30` }}>
              <Info size={20} style={{ color: theme.colors.accent.cyan }} />
              <span className="text-sm" style={{ color: theme.colors.text.secondary }}>
                <strong style={{ color: theme.colors.accent.cyan }}>Совет:</strong> Нажмите <strong>[+]</strong> чтобы добавить решения для сравнения. Нажмите <strong>[ℹ️ vs ...]</strong> чтобы узнать baseline.
              </span>
            </div>

            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm"
                style={{ background: theme.colors.bg.tertiary, border: `1px solid ${theme.colors.border.subtle}`, color: theme.colors.text.secondary }}>
                <Filter size={16} /> Filters <ChevronDown size={16} />
              </button>
              <LanguageSelector selected={selectedLanguage} onChange={setSelectedLanguage} />
              <span className="ml-auto text-sm" style={{ color: theme.colors.text.muted }}>
                Найдено <strong style={{ color: theme.colors.accent.primary }}>{results.length}</strong> решений
              </span>
            </div>

            {isSearching ? (
              <div className="text-center py-20">
                <div className="w-14 h-14 mx-auto mb-6 border-3 border-transparent rounded-full animate-spin"
                  style={{ borderTopColor: theme.colors.accent.primary }} />
                <p style={{ color: theme.colors.text.secondary }}>Поиск...</p>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {results.map((r, i) => (
                  <ResultCard key={r.id} result={r} index={i}
                    isSelected={compareItems.some(item => item.id === r.id)}
                    onToggleCompare={toggleCompare} compareCount={compareItems.length} />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Compare Panel */}
      {showComparePanel && (
        <ComparisonPanel items={compareItems}
          onRemove={(id) => setCompareItems(compareItems.filter(i => i.id !== id))}
          onClear={() => { setCompareItems([]); setShowComparePanel(false); }}
          onClose={() => setShowComparePanel(false)} />
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: system-ui, -apple-system, sans-serif; }
        ::selection { background: ${theme.colors.accent.primary}40; }
        input::placeholder { color: ${theme.colors.text.muted}; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${theme.colors.bg.elevated}; border-radius: 3px; }
      `}</style>
    </div>
  );
}
