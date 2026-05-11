import { toast } from 'react-toastify'

export const useToast = () => ({
  showSuccess: (msg) => toast.success(msg),
  showError: (msg) => toast.error(msg),
  showInfo: (msg) => toast.info(msg),
  showWarning: (msg) => toast.warning(msg),
  handleError: (error) => {
    const msg = error?.data?.message || error?.message || 'An unexpected error occurred.'
    toast.error(msg)
  },
})
