import { useState } from 'react'
import axios from 'axios'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

interface Candidate {
  handle: string
  match_score: number
  reasoning: string
}

function App() {
  const [roleTitle, setRoleTitle] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState('')
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const addKeyword = () => {
    setKeywords([...keywords, ''])
  }

  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...keywords]
    newKeywords[index] = value
    setKeywords(newKeywords)
  }

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const scout = async () => {
    setLoading(true)
    setError('')
    try {
      const resp = await axios.post<Candidate[]>(`${API_URL}/scout`, {
        role_title: roleTitle,
        keywords: keywords.filter(k => k.trim()),
        location_filter: locationFilter || undefined
      })
      setCandidates(resp.data)
    } catch (e) {
      setError('Error scouting: ' + (e as Error).message)
    }
    setLoading(false)
  }

  const scoreData = candidates.map(c => ({ name: c.handle.slice(1), score: c.match_score }))

  return (
    <div className="App">
      <h1>TalentScout X</h1>
      <div className="form">
        <input
          placeholder="Role Title (e.g., Backend Engineer)"
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
          style={{width: '100%', padding: '8px', marginBottom: '10px'}}
        />
        <div className="keywords">
          <h3>Keywords (e.g., FastAPI)</h3>
          {keywords.map((k, i) => (
            <div key={i} style={{display: 'flex', marginBottom: '5px'}}>
              <input 
                value={k} 
                onChange={(e) => updateKeyword(i, e.target.value)} 
                placeholder="Keyword" 
                style={{flex: 1, padding: '5px'}}
              />
              <button onClick={() => removeKeyword(i)} style={{marginLeft: '5px'}}>Remove</button>
            </div>
          ))}
          <button onClick={addKeyword} style={{marginBottom: '10px'}}>Add Keyword</button>
        </div>
        <input
          placeholder="Location Filter (e.g., US, optional)"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          style={{width: '100%', padding: '8px', marginBottom: '10px'}}
        />
        <button onClick={scout} disabled={loading || !roleTitle || keywords.filter(k => k.trim()).length === 0} style={{width: '100%', padding: '10px', background: '#007bff', color: 'white'}}>
          {loading ? 'Scouting...' : 'Scout Talent (Grok AI ~5-10s)'}
        </button>
      </div>
      {error && <p style={{color: 'red'}}>Error: {error}</p>}
      {loading && <p>Loading profiles & Grok ranking...</p>}
      {candidates.length > 0 && (
        <div className="results">
          <h3>Ranked Candidates ({candidates.length})</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={scoreData}>
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="score" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
          <ul>
            {candidates.sort((a, b) => b.match_score - a.match_score).map((c, i) => (
              <li key={i} style={{marginBottom: '10px', border: '1px solid #ccc', padding: '10px'}}>
                <strong>{c.handle} ({c.match_score}%)</strong>: {c.reasoning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default App
