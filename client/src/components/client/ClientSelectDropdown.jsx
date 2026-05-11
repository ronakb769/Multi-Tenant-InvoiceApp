import { useGetClientsQuery } from '../../services/clientApi'

export default function ClientSelectDropdown({ value, onChange, error }) {
  const { data, isLoading } = useGetClientsQuery({ limit: 100, isActive: true })
  const clients = data?.data?.items || []

  return (
    <div>
      <select
        className={`form-select ${error ? 'is-invalid' : ''}`}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
      >
        <option value="">— Select a client —</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
        ))}
      </select>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  )
}
