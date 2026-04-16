export default function Loading() {
  return (
    <div className="flex-1 min-h-screen bg-[#EAE0FB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-4">
        <div className="h-12 w-64 rounded-2xl border-2 border-black bg-white/70 shadow-brutal-sm animate-pulse" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {Array.from({ length: 3 }).map((_, columnIndex) => (
          <div
            key={columnIndex}
            className="min-h-[420px] rounded-[32px] bg-white/60 border-2 border-black/40 p-4 shadow-brutal-sm"
          >
            <div className="h-8 w-32 rounded-full border-2 border-black bg-white animate-pulse" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((__, cardIndex) => (
                <div
                  key={cardIndex}
                  className="h-24 rounded-2xl border-2 border-black bg-white animate-pulse"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
