import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  useGetTenantUsersQuery,
  useCreateTenantUserMutation,
  useToggleTenantUserStatusMutation,
} from '../../services/tenantApi'
import Loader from '../../components/common/Loader'
import { formatDateTime } from '../../utils/formatters'
import { useToast } from '../../hooks/useToast'
import { useRole } from '../../hooks/useRole'

const schema = yup.object({
  name: yup.string().required('Name is required').max(200),
  email: yup.string().required('Email is required').email('Invalid email'),
  password: yup
    .string()
    .required('Password is required')
    .min(8, 'Minimum 8 characters')
    .matches(/[A-Z]/, 'Must contain an uppercase letter')
    .matches(/[a-z]/, 'Must contain a lowercase letter')
    .matches(/[0-9]/, 'Must contain a digit'),
})

const ROLE_COLORS = { TenantAdmin: 'primary', User: 'secondary' }

export default function TenantUsersPage() {
  const { isTenantAdmin } = useRole()
  const { showSuccess, handleError } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { data, isLoading } = useGetTenantUsersQuery()
  const [createUser, { isLoading: creating }] = useCreateTenantUserMutation()
  const [toggleStatus, { isLoading: togglingId }] = useToggleTenantUserStatusMutation()

  const users = data?.data || []

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
  })

  const openModal = () => {
    reset()
    setShowPassword(false)
    setShowModal(true)
  }

  const closeModal = () => setShowModal(false)

  const onSubmit = async (formData) => {
    try {
      await createUser(formData).unwrap()
      showSuccess('User created successfully.')
      closeModal()
    } catch (err) {
      handleError(err)
    }
  }

  const handleToggle = async (id) => {
    try {
      await toggleStatus(id).unwrap()
    } catch (err) {
      handleError(err)
    }
  }

  if (isLoading) return <Loader />

  return (
    <div>
      <div className="d-flex justify-content-between align-items-start mb-4">
        <div>
          <h4 className="fw-bold mb-1">Users</h4>
          <p className="text-muted mb-0 small">{users.length} user{users.length !== 1 ? 's' : ''} in your organisation</p>
        </div>
        {isTenantAdmin && (
          <button className="btn btn-primary" onClick={openModal}>
            <i className="bi bi-plus-lg me-1" />
            Add User
          </button>
        )}
      </div>

      <div className="card border-0 shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined</th>
                {isTenantAdmin && <th />}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="fw-semibold">{u.name}</td>
                  <td className="text-muted small">{u.email}</td>
                  <td>
                    <span className={`badge bg-${ROLE_COLORS[u.role] || 'secondary'}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'bg-success' : 'bg-secondary'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-muted small">{u.lastLogin ? formatDateTime(u.lastLogin) : 'Never'}</td>
                  <td className="text-muted small">{formatDateTime(u.createdAt)}</td>
                  {isTenantAdmin && (
                    <td className="text-end">
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-outline-danger' : 'btn-outline-success'}`}
                        onClick={() => handleToggle(u.id)}
                        disabled={!!togglingId}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={isTenantAdmin ? 7 : 6} className="text-center text-muted py-5">
                    No users yet. Add your first team member.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <>
          <div
            className="modal d-block"
            tabIndex="-1"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal() }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Add User</h5>
                  <button type="button" className="btn-close" onClick={closeModal} />
                </div>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <div className="modal-body pt-3">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Full Name <span className="text-danger">*</span></label>
                      <input
                        type="text"
                        {...register('name')}
                        className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                        placeholder="Jane Smith"
                        autoFocus
                      />
                      {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Email <span className="text-danger">*</span></label>
                      <input
                        type="email"
                        {...register('email')}
                        className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                        placeholder="jane@example.com"
                      />
                      {errors.email && <div className="invalid-feedback">{errors.email.message}</div>}
                    </div>
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Password <span className="text-danger">*</span></label>
                      <div className="input-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          {...register('password')}
                          className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                          placeholder="Min 8 chars, upper, lower, digit"
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowPassword((s) => !s)}
                          tabIndex="-1"
                        >
                          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                        {errors.password && <div className="invalid-feedback">{errors.password.message}</div>}
                      </div>
                    </div>
                    <div className="alert alert-info py-2 small mb-0">
                      <i className="bi bi-info-circle me-1" />
                      The new user will be created with the <strong>User</strong> role and can log in immediately.
                    </div>
                  </div>
                  <div className="modal-footer border-0 pt-0">
                    <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={creating}>
                      {creating && <span className="spinner-border spinner-border-sm me-2" />}
                      Create User
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      )}
    </div>
  )
}
