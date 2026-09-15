import { useState, useEffect } from 'react'

function App() {
  const [url, setUrl] = useState('')
  const [showAlias, setShowAlias] = useState(false)
  const [alias, setAlias] = useState('')
  const [aliasStatus, setAliasStatus] = useState(null)
  const [shortUrl, setShortUrl] = useState('')
  const [shortCode, setShortCode] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check alias availability as the user types
  useEffect(() => {
    if (!alias) {
      setAliasStatus(null)
      return
    }

    setAliasStatus('checking')

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `http://127.0.0.1:8000/check-alias/${encodeURIComponent(alias)}`
        )

        const data = await res.json()

        if (!data.available) {
          setAliasStatus(
            data.reason === 'invalid' ? 'invalid' : 'taken'
          )
        } else {
          setAliasStatus('available')
        }
      } catch {
        setAliasStatus(null)
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [alias])

  const resetResult = () => {
    setShortUrl('')
    setShortCode('')
    setShowQR(false)
    setCopied(false)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        'http://127.0.0.1:8000/shorten',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            original_url: url,
            custom_alias: alias || null,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setError(
          data.detail ||
            'Something went wrong. Please try again.'
        )
        return
      }

      const generatedShortUrl =
        `http://127.0.0.1:8000/${data.short_code}`

      setShortUrl(generatedShortUrl)
      setShortCode(data.short_code)

      setUrl('')
      setAlias('')
      setShowAlias(false)
    } catch (err) {
      setError(
        'Unable to connect to the server. Make sure your backend is running.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl)
      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setError('Could not copy the link.')
    }
  }

  const handleDownloadQR = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/qrcode/${shortCode}`
      )

      if (!response.ok) {
        throw new Error('QR code request failed')
      }

      const blob = await response.blob()

      const blobUrl = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = blobUrl
      link.download = `${shortCode}-qrcode.png`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(blobUrl)
    } catch {
      setError('Could not download the QR code.')
    }
  }

  const handleCreateAnother = () => {
    resetResult()
  }

  return (
    <div className="min-h-screen bg-[#08090D] text-[#F5F7FA] relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#7C5CFF] opacity-[0.12] blur-[120px] rounded-full" />

      <div className="relative max-w-2xl mx-auto px-6 pt-24 pb-16">

        {/* Logo */}
        <div className="text-center mb-4">
          <span className="text-xl font-semibold tracking-tight">
            <span className="text-[#7C5CFF]">✦</span>{' '}
            Linksy
          </span>
        </div>
{/* Hero */}
<div className="text-center mb-10">
  <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
    Shorten.{' '}
    <span className="bg-gradient-to-r from-[#7C5CFF] to-[#9278FF] bg-clip-text text-transparent">
      Share.
    </span>{' '}
    Done.
  </h1>

  <p className="text-[#9299A8] mt-5 text-lg">
    Turn long URLs into short, shareable links in seconds.
  </p>
</div>


        {/* Main card */}
        <div className="bg-[rgba(17,20,27,0.8)] border border-[rgba(255,255,255,0.08)] rounded-2xl p-6 sm:p-8 shadow-2xl">

          {!shortUrl ? (
            <form onSubmit={handleSubmit}>

              {/* URL Input */}
              <input
                type="url"
                placeholder="Paste your long URL here..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="w-full bg-[#0D0F14] border border-[rgba(255,255,255,0.08)] rounded-xl px-5 py-5 text-lg placeholder:text-[#5C6270] focus:outline-none focus:border-[#7C5CFF] focus:ring-2 focus:ring-[#7C5CFF]/30 transition-all"
              />

              {/* Custom Alias Toggle */}
              {!showAlias ? (
                <button
                  type="button"
                  onClick={() => setShowAlias(true)}
                  className="mt-3 text-sm text-[#9299A8] hover:text-[#F5F7FA] transition-colors"
                >
                  + Add custom alias
                </button>
              ) : (
                <div className="mt-4">

                  <label className="text-sm text-[#9299A8] block mb-2">
                    Custom alias
                  </label>

                  <div className="flex items-center bg-[#0D0F14] border border-[rgba(255,255,255,0.08)] rounded-lg overflow-hidden focus-within:border-[#7C5CFF] focus-within:ring-2 focus-within:ring-[#7C5CFF]/30 transition-all">

                    <span className="pl-4 pr-1 text-[#5C6270]">
                      linksy/
                    </span>

                    <input
                      type="text"
                      placeholder="my-portfolio"
                      value={alias}
                      onChange={(e) => setAlias(e.target.value)}
                      className="flex-1 bg-transparent py-3 pr-4 focus:outline-none"
                    />
                  </div>

                  {/* Alias Status */}
                  {aliasStatus === 'checking' && (
                    <p className="text-xs text-[#9299A8] mt-1">
                      Checking availability...
                    </p>
                  )}

                  {aliasStatus === 'available' && (
                    <p className="text-xs text-[#35D07F] mt-1">
                      ✓ Alias available
                    </p>
                  )}

                  {aliasStatus === 'taken' && (
                    <p className="text-xs text-red-400 mt-1">
                      That alias is already taken.
                    </p>
                  )}

                  {aliasStatus === 'invalid' && (
                    <p className="text-xs text-red-400 mt-1">
                      3-20 characters: letters, numbers, hyphens only.
                    </p>
                  )}

                  {!alias && (
                    <p className="text-xs text-[#5C6270] mt-1">
                      Create a custom link instead of a random code.
                    </p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  loading ||
                  aliasStatus === 'taken' ||
                  aliasStatus === 'invalid'
                }
                className="w-full mt-4 py-4 bg-gradient-to-r from-[#7C5CFF] to-[#9278FF] rounded-xl font-medium text-lg hover:shadow-lg hover:shadow-[#7C5CFF]/30 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading
                  ? 'Creating your link...'
                  : 'Shorten →'}
              </button>

              {/* Error */}
              {error && (
                <p className="text-sm text-red-400 mt-3 text-center">
                  {error}
                </p>
              )}
            </form>
          ) : (
            <div>

              {/* Success Header */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#35D07F]">
                  ✓
                </span>

                <span className="text-[#F5F7FA] font-medium">
                  Link created
                </span>
              </div>

              <p className="text-[#9299A8] text-sm mb-4">
                Your short link is ready to share.
              </p>

              {/* Short URL */}
              <div className="flex items-center justify-between bg-[#0D0F14] border border-[rgba(255,255,255,0.08)] rounded-xl px-5 py-4">

                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#F5F7FA] font-medium hover:text-[#9278FF] transition-colors break-all"
                >
                  {shortUrl.replace(
                    'http://127.0.0.1:8000/',
                    'linksy/'
                  )}
                </a>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="ml-4 shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>

              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">

                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  className="flex-1 py-3 border border-[rgba(255,255,255,0.08)] rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  {showQR
                    ? 'Hide QR Code'
                    : 'QR Code'}
                </button>

                <button
                  type="button"
                  onClick={handleCreateAnother}
                  className="flex-1 py-3 border border-[rgba(255,255,255,0.08)] rounded-lg hover:bg-[rgba(255,255,255,0.04)] transition-colors"
                >
                  Create another
                </button>

              </div>

              {/* QR Code */}
              {showQR && (
                <div className="mt-6 flex flex-col items-center bg-[#0D0F14] border border-[rgba(255,255,255,0.08)] rounded-xl p-6">

                  <img
                    src={`http://127.0.0.1:8000/qrcode/${shortCode}`}
                    alt="QR code for shortened URL"
                    className="w-40 h-40 rounded-lg bg-white p-2"
                  />

                  <p className="text-sm text-[#9299A8] mt-3 mb-4 text-center">
                    Scan to open your Linksy link instantly.
                  </p>

                  <button
                    type="button"
                    onClick={handleDownloadQR}
                    className="px-5 py-2.5 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] rounded-lg text-sm font-medium transition-colors"
                  >
                    Download QR
                  </button>

                </div>
              )}

              {/* Error after result */}
              {error && (
                <p className="text-sm text-red-400 mt-3 text-center">
                  {error}
                </p>
              )}

            </div>
          )}
        </div>

        {/* Feature strip */}
        <div className="flex flex-wrap justify-center gap-6 mt-8 text-sm text-[#5C6270]">
          <span> Fast redirects</span>
          <span> Custom aliases</span>
          <span> Instant QR codes</span>
        </div>

      </div>
    </div>
  )
}

export default App
