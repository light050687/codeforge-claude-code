export function StatSkeleton() {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 text-center animate-pulse">
      <div className="h-8 bg-bg-tertiary rounded w-20 mx-auto mb-2" />
      <div className="h-4 bg-bg-tertiary rounded w-16 mx-auto" />
    </div>
  )
}

export function CategorySkeleton() {
  return (
    <div className="flex flex-col items-center p-6 bg-bg-secondary border border-bg-tertiary rounded-xl animate-pulse">
      <div className="w-12 h-12 bg-bg-tertiary rounded-full mb-2" />
      <div className="h-4 bg-bg-tertiary rounded w-20 mb-1" />
      <div className="h-3 bg-bg-tertiary rounded w-16" />
    </div>
  )
}

export function SolutionCardSkeleton() {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="h-5 bg-bg-tertiary rounded w-20" />
        <div className="h-5 bg-bg-tertiary rounded w-16" />
      </div>
      <div className="h-6 bg-bg-tertiary rounded w-3/4 mb-2" />
      <div className="h-4 bg-bg-tertiary rounded w-full mb-4" />
      <div className="flex justify-between">
        <div className="h-4 bg-bg-tertiary rounded w-24" />
        <div className="h-4 bg-bg-tertiary rounded w-16" />
      </div>
    </div>
  )
}

export function SearchResultSkeleton() {
  return (
    <div className="bg-bg-secondary border border-bg-tertiary rounded-xl p-6 animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="h-6 bg-bg-tertiary rounded w-64 mb-2" />
          <div className="h-4 bg-bg-tertiary rounded w-32" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-bg-tertiary rounded w-16" />
          <div className="h-6 bg-bg-tertiary rounded w-20" />
        </div>
      </div>
      <div className="h-24 bg-bg-primary rounded-lg mb-3" />
      <div className="flex justify-between">
        <div className="h-4 bg-bg-tertiary rounded w-24" />
        <div className="h-4 bg-bg-tertiary rounded w-16" />
      </div>
    </div>
  )
}

export function LeaderboardRowSkeleton() {
  return (
    <tr className="animate-pulse">
      <td className="px-6 py-4">
        <div className="h-4 bg-bg-tertiary rounded w-8" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-bg-tertiary rounded-full" />
          <div className="h-4 bg-bg-tertiary rounded w-24" />
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-bg-tertiary rounded w-16" />
      </td>
      <td className="px-6 py-4">
        <div className="h-4 bg-bg-tertiary rounded w-12" />
      </td>
    </tr>
  )
}

export function PlaygroundResultSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex items-center gap-4 p-4 bg-bg-secondary border border-bg-tertiary rounded-xl">
        <div className="h-12 w-16 bg-bg-tertiary rounded" />
        <div>
          <div className="h-5 bg-bg-tertiary rounded w-24 mb-1" />
          <div className="h-4 bg-bg-tertiary rounded w-32" />
        </div>
      </div>
      <div className="h-48 bg-bg-secondary border border-bg-tertiary rounded-xl" />
      <div className="p-4 bg-bg-secondary border border-bg-tertiary rounded-xl">
        <div className="h-4 bg-bg-tertiary rounded w-40 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-bg-tertiary rounded w-full" />
          <div className="h-3 bg-bg-tertiary rounded w-3/4" />
          <div className="h-3 bg-bg-tertiary rounded w-5/6" />
        </div>
      </div>
    </div>
  )
}
