import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Customer API
export const customerAPI = {
  register: (data) => api.post('/customers/register', data),
  login: (data) => api.post('/customers/login', data),
  logout: () => api.post('/customers/logout'),
  getProfile: () => api.get('/customers/profile'),
  updateProfile: (data) => api.post('/customers/profile/update', data),
  changePassword: (data) => api.post('/customers/change-password', data),
  getServices: () => api.get('/customers/services'),
  viewServiceDetail: (id) => api.get(`/customers/services/${id}`),
  bookService: (data) => api.post('/customers/book', data),
  createTrialBooking: (data) => api.post('/customers/book/trial', data),
  rebookFromHistory: (bookingId, data = {}) => api.post(`/customers/book/rebook/${bookingId}`, data),
  getBookings: () => api.get('/customers/bookings'),
  getDashboardSummary: () => api.get('/customers/dashboard-summary'),
  getServiceProfile: () => api.get('/customers/service-profile'),
  upsertServiceProfile: (data) => api.put('/customers/service-profile', data),
  getAccessProfile: () => api.get('/customers/service-profile/access'),
  upsertAccessProfile: (data) => api.put('/customers/service-profile/access', data),
  convertTrialToRecurring: (data) => api.post('/customers/recurring-packages/convert-from-trial', data),
  getRecurringPackages: () => api.get('/customers/recurring-packages'),
  updateRecurringPackageStatus: (packageId, data) => api.patch(`/customers/recurring-packages/${packageId}/status`, data),
  skipRecurringSession: (packageId) => api.post(`/customers/recurring-packages/${packageId}/skip`),
  rescheduleRecurringSession: (packageId, data) => api.post(`/customers/recurring-packages/${packageId}/reschedule`, data),
  generateRecurringContract: (packageId) => api.post(`/customers/contracts/recurring/${packageId}/generate`),
  getMyContracts: () => api.get('/customers/contracts'),
  addReview: (data) => api.post('/customers/review', data),
  getMyReviews: () => api.get('/customers/reviews/my'),
  getReviewByBooking: (bookingId) => api.get(`/customers/reviews/booking/${bookingId}`),
  getReviewsByService: (serviceId) => api.get(`/customers/reviews/service/${serviceId}`),
  getServiceRating: (serviceId) => api.get(`/customers/reviews/service/${serviceId}/rating`),
  forgotPassword: (data) => api.post('/customers/forgot-password', data),
  resetPassword: (data) => api.post('/customers/reset-password', data),
};

// Admin API
export const adminAPI = {
  login: (data) => api.post('/admin/login', data),
  logout: () => api.post('/admin/logout'),
  getProfile: () => api.get('/admin/profile'),
  changePassword: (data) => api.post('/admin/change-password', data),
  forgotPassword: (data) => api.post('/admin/forgot-password', data),
  resetPassword: (data) => api.post('/admin/reset-password', data),
  getDashboard: () => api.get('/admin/dashboard'),
  getAllServices: () => api.get('/admin/services'),
  createService: (data) => api.post('/admin/services', data),
  updateService: (id, data) => api.put(`/admin/services/${id}`, data),
  deleteService: (id) => api.delete(`/admin/services/${id}`),
  getAllEmployees: () => api.get('/admin/employees'),
  createEmployee: (data) => api.post('/admin/employees', data),
  updateEmployee: (id, data) => api.put(`/admin/employees/${id}`, data),
  deleteEmployee: (id) => api.delete(`/admin/employees/${id}`),
  getAllBookings: () => api.get('/admin/bookings'),
  updateBookingStatus: (id, data) => api.put(`/admin/bookings/${id}/status`, data),
  updatePaymentStatus: (id, data) => api.put(`/admin/bookings/${id}/payment`, data),
  // Employee Requests
  getAllEmployeeRequests: (status) => api.get('/admin/employee-requests', { params: { status } }),
  getEmployeeRequestDetail: (id) => api.get(`/admin/employee-requests/${id}`),
  getEmployeeRequestStats: () => api.get('/admin/employee-requests/stats'),
  approveEmployeeRequest: (id, data) => api.post(`/admin/employee-requests/${id}/approve`, data),
  rejectEmployeeRequest: (id, data) => api.post(`/admin/employee-requests/${id}/reject`, data),
  // System Users Management
  createManager: (data) => api.post('/admin/managers', data),
  createAdmin: (data) => api.post('/admin/invite', data),
};

// Employee API
export const employeeAPI = {
  login: (data) => api.post('/employees/login', data),
  logout: () => api.post('/employees/logout'),
  forgotPassword: (data) => api.post('/employees/forgot-password', data),
  resetPassword: (data) => api.post('/employees/reset-password', data),
  getProfile: () => api.get('/employees/profile'),
  updateProfile: (data) => api.post('/employees/profile/update', data),
  changePassword: (data) => api.post('/employees/change-password', data),
  viewAssignedJobs: () => api.get('/employees/jobs'),
  updateJobStatus: (data) => api.post('/employees/jobs/update-status', data),
  checkInJob: (bookingId) => api.post(`/employees/jobs/${bookingId}/check-in`),
  checkOutJob: (bookingId) => api.post(`/employees/jobs/${bookingId}/check-out`),
  getJobAccess: (bookingId) => api.get(`/employees/jobs/${bookingId}/access`),
};

// Manager API
export const managerAPI = {
  login: (data) => api.post('/managers/login', data),
  logout: () => api.post('/managers/logout'),
  forgotPassword: (data) => api.post('/managers/forgot-password', data),
  resetPassword: (data) => api.post('/managers/reset-password', data),
  getProfile: () => api.get('/managers/profile'),
  updateProfile: (data) => api.put('/managers/profile/update', data),
  changePassword: (data) => api.post('/managers/change-password', data),
  getDashboard: () => api.get('/managers/dashboard'),
  getAllBookings: () => api.get('/managers/bookings'),
  getPendingBookings: () => api.get('/managers/bookings/pending'),
  getActiveBookings: () => api.get('/managers/bookings/active'),
  getBookingsByDate: (date) => api.get('/managers/bookings/by-date', { params: { date } }),
  getBookingDetail: (id) => api.get(`/managers/bookings/${id}`),
  assignEmployee: (id, data) => api.post(`/managers/bookings/${id}/assign`, data),
  semiAutoAssign: (id) => api.post(`/managers/bookings/${id}/semi-auto-assign`),
  updateBookingStatus: (id, data) => api.put(`/managers/bookings/${id}/status`, data),
  getAllEmployees: () => api.get('/managers/employees'),
  getAvailableEmployees: () => api.get('/managers/employees/available'),
  getEmployeeSchedule: (employeeId, startDate, endDate) =>
    api.get(`/managers/employees/${employeeId}/schedule`, { params: { startDate, endDate } }),
  suggestEmployees: (bookingId) => api.get(`/managers/bookings/${bookingId}/suggest-employees`),
  // Employee Requests
  createEmployeeRequest: (data) => api.post('/managers/employee-requests', data),
  getMyEmployeeRequests: () => api.get('/managers/employee-requests'),
  getEmployeeRequestDetail: (id) => api.get(`/managers/employee-requests/${id}`),
  updateEmployeeRequest: (id, data) => api.put(`/managers/employee-requests/${id}`, data),
  cancelEmployeeRequest: (id) => api.delete(`/managers/employee-requests/${id}/cancel`),
  updateEmployeeArea: (id, data) => api.put(`/managers/employees/${id}/area`, data),
};

export default api;


