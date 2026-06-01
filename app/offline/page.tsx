"use client";

export default function OfflinePage() {
  return (
    <html className="dark">
      <body className="bg-[#0a0a0a] min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-[#111111] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-6">
            <svg className="text-neutral-600 w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M6.343 17.657a9 9 0 010-12.728m2.829 2.829a5 5 0 000 7.072M12 12h.01" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">You are offline</h1>
          <p className="text-sm text-neutral-500 mb-8 max-w-xs mx-auto">
            No internet connection. Check your network and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-500 text-white h-10 px-6 rounded-lg text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
