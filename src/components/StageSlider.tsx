import React from "react"

type StageSliderProps = {
  value: number
  onChange: (value: number) => void
}

const ticks = [-3, -2, -1, 0, 1, 2, 3]

const StageSlider: React.FC<StageSliderProps> = ({ value, onChange }) => {
  const snap = (n: number) => Math.round(n)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(snap(Number(event.target.value)))
  }

  const handleSnap = (event: React.SyntheticEvent<HTMLInputElement>) => {
    onChange(snap(Number(event.currentTarget.value)))
  }

  const stepDown = () => onChange(Math.max(-3, value - 1))
  const stepUp = () => onChange(Math.min(3, value + 1))

  return (
    <div className="pointer-events-auto w-full max-w-3xl rounded-full border border-white/25 bg-black/45 px-4 py-4 shadow-sm backdrop-blur-lg">
      <div className="flex items-center gap-4">
        <button
          className="flex h-10 w-10 items-center justify-center rounded-none border border-white/30 text-white/80 transition hover:border-white hover:text-white"
          type="button"
          onClick={stepDown}
          aria-label="Previous stage"
        >
          ←
        </button>

        <div className="flex-1">
          <input
            aria-label="Stage slider"
            type="range"
            min={-3}
            max={3}
            step={1}
            value={value}
            onChange={handleChange}
            onPointerUp={handleSnap}
            onMouseUp={handleSnap}
            onTouchEnd={handleSnap}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
          />

          <div className="mt-3 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.35em] text-white/60">
            {ticks.map((tick) => (
              <div key={tick} className="flex flex-col items-center gap-1">
                <span
                  className={`h-2 w-[2px] rounded-full ${
                    tick === value ? "bg-white" : "bg-white/40"
                  }`}
                />
                <span className={tick === value ? "text-white" : ""}>
                  {tick}
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-none border border-white/30 text-white/80 transition hover:border-white hover:text-white"
          type="button"
          onClick={stepUp}
          aria-label="Next stage"
        >
          →
        </button>
      </div>
    </div>
  )
}

export default StageSlider
