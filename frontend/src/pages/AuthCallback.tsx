import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleAuthCallback, useAuth } from '../context/AuthContext'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { checkAuth } = useAuth()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = handleAuthCallback()

    if (token) {
      // Token stored, fetch user info
      checkAuth().then(() => {
        navigate('/', { replace: true })
      })
    } else {
      // Check if there's an error in URL
      const params = new URLSearchParams(window.location.search)
      const errorMsg = params.get('error')

      if (errorMsg) {
        setError(errorMsg)
      } else {
        // No token and no error - redirect to home
        navigate('/', { replace: true })
      }
    }
  }, [navigate, checkAuth])

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">Authentication Failed</div>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Return Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Signing you in...</p>
      </div>
    </div>
  )
}
