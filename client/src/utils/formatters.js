export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount)
}

export const formatDate = (date) => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date))
}

export const formatDateTime = (date) => {
  if (!date) return 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export const truncate = (str, maxLength = 50) => {
  if (!str) return ''
  return str.length > maxLength ? str.substring(0, maxLength) + '...' : str
}

export const getDaysOverdue = (dueDate) => {
  const due = new Date(dueDate)
  const now = new Date()
  const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2)
}
