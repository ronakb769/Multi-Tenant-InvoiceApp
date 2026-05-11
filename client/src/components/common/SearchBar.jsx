import { useState, useCallback } from 'react'

export default function SearchBar({ value, onChange, placeholder = 'Search...', debounce = 400 }) {
  const [local, setLocal] = useState(value || '')
  let timer

  const handleChange = (e) => {
    const v = e.target.value
    setLocal(v)
    clearTimeout(timer)
    timer = setTimeout(() => onChange(v), debounce)
  }

  const handleClear = () => {
    setLocal('')
    onChange('')
  }

  return (
    <div className="input-group">
      <span className="input-group-text bg-white border-end-0">
        <i className="bi bi-search text-muted" />
      </span>
      <input
        type="text"
        className="form-control border-start-0 ps-0"
        placeholder={placeholder}
        value={local}
        onChange={handleChange}
      />
      {local && (
        <button className="btn btn-outline-secondary" type="button" onClick={handleClear}>
          <i className="bi bi-x" />
        </button>
      )}
    </div>
  )
}
