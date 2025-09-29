import React, { useEffect, useState } from 'react'
import tanksSeed from './tanks.json'

function TankCard({ tank, onAdd, onForecast, busy }) {
  const last = tank.readings[tank.readings.length - 1]
  return (
    <div className="card">
      <h3>{tank.name}</h3>
      <p className="small">Capacitate: {tank.capacity_l.toLocaleString()} L · Volum curent: {tank.volume_l.toLocaleString()} L</p>
      <p>Ultima citire: {last ? `${last.date} · ${last.brix ?? '—'}°Brix · ${last.temp ?? '—'}°C` : '—'}</p>
      <form onSubmit={(e)=>{ e.preventDefault(); const fd=new FormData(e.currentTarget); onAdd(tank.id, {date: fd.get('date'), brix: parseFloat(fd.get('brix')), temp: parseFloat(fd.get('temp'))}); e.currentTarget.reset(); }}>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8}}>
          <div><label>Data</label><input name="date" type="date" required /></div>
          <div><label>Brix</label><input name="brix" type="number" step="0.1" required /></div>
          <div><label>Temp °C</label><input name="temp" type="number" step="0.1" required /></div>
        </div>
        <div style={{display:'flex', gap:8, marginTop:10}}>
          <button type="submit" className="secondary">Adaugă citire</button>
          <button type="button" onClick={()=>onForecast(tank)} disabled={busy}>{busy?'Se analizează…':'AI: Prognoză'}</button>
        </div>
      </form>
    </div>
  )
}

export default function App() {
  const [tanks, setTanks] = useState([])
  const [forecast, setForecast] = useState('')
  const [busyId, setBusyId] = useState(null)

  useEffect(()=>{
    // Load from localStorage or seed
    const saved = localStorage.getItem('vinetrack_tanks')
    setTanks(saved ? JSON.parse(saved) : tanksSeed)
  }, [])

  useEffect(()=>{
    localStorage.setItem('vinetrack_tanks', JSON.stringify(tanks))
  }, [tanks])

  const addReading = (tankId, reading) => {
    setTanks(prev => prev.map(t => t.id===tankId ? {...t, readings:[...t.readings, reading]} : t))
  }

  const runForecast = async (tank) => {
    setBusyId(tank.id)
    setForecast('')
    try {
      const res = await fetch('/.netlify/functions/forecast', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ tankName: tank.name, readings: tank.readings })
      })
      const data = await res.json()
      setForecast(data.forecast || JSON.stringify(data))
    } catch (e) {
      setForecast('Eroare la apelul AI: ' + e.message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <header><h1>VineTrack Pro – MVP</h1></header>
      <div className="container">
        <div className="grid">
          {tanks.map(t => (
            <TankCard key={t.id} tank={t} onAdd={addReading} onForecast={runForecast} busy={busyId===t.id}/>
          ))}
        </div>
        <div className="card" style={{marginTop:16}}>
          <h3>Prognoză AI / Alerte</h3>
          <div className="forecast">{forecast || 'Apasă „AI: Prognoză” pe un rezervor pentru analiză.'}</div>
          <p className="small">Notă: dacă variabila OPENAI_API_KEY nu este setată pe Netlify, funcția rulează în mod demo.</p>
        </div>
      </div>
    </>
  )
}
