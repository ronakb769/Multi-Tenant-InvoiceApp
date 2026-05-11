import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useGetClientsQuery } from '../../services/clientApi'
import ClientCard from '../../components/client/ClientCard'
import Loader from '../../components/common/Loader'
import Pagination from '../../components/common/Pagination'
import SearchBar from '../../components/common/SearchBar'
import EmptyState from '../../components/common/EmptyState'
import { useRole } from '../../hooks/useRole'

export default function ClientListPage() {
  const { isTenantAdmin } = useRole()
  const [filters, setFilters] = useState({ page: 1, limit: 12, search: '', isActive: undefined })

  const { data, isLoading, isFetching } = useGetClientsQuery(filters)
  const result = data?.data
  const clients = result?.items || []

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Clients</h4>
          <p className="text-muted mb-0 small">Manage your client directory</p>
        </div>
        {isTenantAdmin && (
          <Link to="/clients/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2" />Add Client
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-6">
              <SearchBar
                value={filters.search}
                onChange={(v) => setFilters((f) => ({ ...f, search: v, page: 1 }))}
                placeholder="Search by name or email..."
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => setFilters((f) => ({
                  ...f,
                  isActive: e.target.value === '' ? undefined : e.target.value === 'true',
                  page: 1,
                }))}
              >
                <option value="">All clients</option>
                <option value="true">Active only</option>
                <option value="false">Inactive only</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Client grid */}
      {isLoading || isFetching ? (
        <Loader />
      ) : clients.length === 0 ? (
        <EmptyState
          icon="bi-people"
          title="No clients yet"
          description="Add your first client to start creating invoices."
          action={isTenantAdmin && <Link to="/clients/new" className="btn btn-primary">Add Client</Link>}
        />
      ) : (
        <>
          <div className="row g-3">
            {clients.map((client) => (
              <div key={client.id} className="col-md-6 col-lg-4">
                <ClientCard client={client} />
              </div>
            ))}
          </div>
          <div className="mt-4">
            <Pagination
              page={result?.page || 1}
              totalPages={result?.totalPages || 1}
              totalCount={result?.totalCount || 0}
              limit={filters.limit}
              onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
            />
          </div>
        </>
      )}
    </div>
  )
}
