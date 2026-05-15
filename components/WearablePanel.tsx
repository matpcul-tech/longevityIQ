'use client'

import { useEffect, useState } from 'react'

type Vitals = {
  hr: number
  hrv: number
  spo2: number
  steps: number
  sleepHours: number
  recovery: number
}

const SEED: Vitals = { hr: 58, hrv: 78, spo2: 98, steps: 8420, sleepHours: 7.6, recovery: 84 }

export default function WearablePanel() {
  const [connected, setConnected] = useState(false)
  const [vitals, setVitals] = useState<Vitals>(SEED)

  useEffect(() => {
    const id = setInterval(() => {
      setVitals((v) => ({
        hr: clamp(v.hr + drift(2), 48, 90),
        hrv: clamp(v.hrv + drift(3), 35, 110),
        spo2: clamp(v.spo2 + drift(1), 92, 99),
        steps: v.steps + Math.max(0, Math.round(drift(40) + 20)),
        sleepHours: clamp(v.sleepHours + drift(0.05), 5.5, 9),
        recovery: clamp(v.recovery + drift(2), 35, 99),
      }))
    }, 2500)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="space-y-8">
      <div className="card flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="heading-ui text-gold">Connection Status</p>
          <p className="heading-display mt-2 text-2xl text-bone">
            {connected ? 'Apple Health linked' : 'Simulated live vitals'}
          </p>
          <p className="mt-1 text-xs text-mist">
            {connected
              ? 'Streaming from your authorized device. Disconnect anytime in Settings.'
              : 'Connect a device to replace the simulator with your live HR, HRV, SpO2 and sleep data.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setConnected((c) => !c)}
            className={connected ? 'btn-ghost' : 'btn-gold'}
          >
            {connected ? 'Disconnect' : 'Connect Apple Health'}
          </button>
          <button
            type="button"
            onClick={() => setConnected((c) => !c)}
            className="btn-ghost"
          >
            {connected ? 'Switch Source' : 'Connect Google Fit'}
          </button>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <Tile label="Resting HR" value={`${vitals.hr.toFixed(0)} bpm`} accent="gold" />
        <Tile label="HRV" value={`${vitals.hrv.toFixed(0)} ms`} accent="teal" />
        <Tile label="SpO2" value={`${vitals.spo2.toFixed(0)} %`} accent="amber" />
        <Tile label="Steps Today" value={vitals.steps.toLocaleString()} accent="gold" />
        <Tile label="Sleep Last Night" value={`${vitals.sleepHours.toFixed(1)} h`} accent="teal" />
        <Tile label="Recovery Score" value={`${vitals.recovery.toFixed(0)} / 100`} accent="amber" />
      </div>
    </div>
  )
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent: 'gold' | 'amber' | 'teal'
}) {
  const tone = accent === 'gold' ? 'text-gold' : accent === 'amber' ? 'text-amber' : 'text-teal'
  return (
    <div className="card p-6">
      <p className={`heading-ui ${tone}`}>{label}</p>
      <p className="heading-display mt-3 text-4xl text-bone">{value}</p>
    </div>
  )
}

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v))
}

function drift(scale: number) {
  return (Math.random() - 0.5) * 2 * scale
}
