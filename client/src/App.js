import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';

import CustomerLogin from './pages/customer/CustomerLogin';
import CustomerRegister from './pages/customer/CustomerRegister';
import CustomerForgotPassword from './pages/customer/ForgotPassword';
import CustomerResetPassword from './pages/customer/ResetPassword';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import Services from './pages/customer/Services';
import ServiceDetail from './pages/customer/ServiceDetail';
import BookService from './pages/customer/BookService';
import Bookings from './pages/customer/Bookings';
import BookingDetail from './pages/customer/BookingDetail';
import Review from './pages/customer/Review';
import Profile from './pages/customer/Profile';
import MyContracts from './pages/customer/MyContracts';
import MyRecurringPackages from './pages/customer/MyRecurringPackages';

import AdminLogin from './pages/admin/AdminLogin';
import AdminForgotPassword from './pages/admin/ForgotPassword';
import AdminResetPassword from './pages/admin/ResetPassword';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProfile from './pages/admin/AdminProfile';
import AdminServices from './pages/admin/Services';
import AdminEmployees from './pages/admin/Employees';
import AdminBookings from './pages/admin/Bookings';
import AdminEmployeeRequests from './pages/admin/EmployeeRequests';
import SystemUsers from './pages/admin/SystemUsers';
import EmployeeLogin from './pages/employee/EmployeeLogin';
import EmployeeForgotPassword from './pages/employee/ForgotPassword';
import EmployeeResetPassword from './pages/employee/ResetPassword';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeeJobs from './pages/employee/EmployeeJobs';

// Manager Pages
import ManagerLogin from './pages/manager/ManagerLogin';
import ManagerForgotPassword from './pages/manager/ForgotPassword';
import ManagerResetPassword from './pages/manager/ResetPassword';
import ManagerDashboard from './pages/manager/ManagerDashboard';
import BookingAssignment from './pages/manager/BookingAssignment';
import AssignBooking from './pages/manager/AssignBooking';
import ManagerEmployees from './pages/manager/Employees';
import ManagerProfile from './pages/manager/ManagerProfile';
import ManagerEmployeeRequests from './pages/manager/EmployeeRequests';
import ManagerBookings from './pages/manager/Bookings';
import PendingBookings from './pages/manager/PendingBookings';
import ActiveBookings from './pages/manager/ActiveBookings';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />

            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/register" element={<CustomerRegister />} />
            <Route path="/customer/forgot-password" element={<CustomerForgotPassword />} />
            <Route path="/customer/reset-password" element={<CustomerResetPassword />} />
            <Route path="/customer/dashboard" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <CustomerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/customer/services" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Services />
              </ProtectedRoute>
            } />
            <Route path="/customer/services/:id" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <ServiceDetail />
              </ProtectedRoute>
            } />
            <Route path="/customer/book-service" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookService />
              </ProtectedRoute>
            } />
            <Route path="/customer/bookings" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Bookings />
              </ProtectedRoute>
            } />
            <Route path="/customer/bookings/:id" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <BookingDetail />
              </ProtectedRoute>
            } />
            <Route path="/customer/review/:bookingId" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Review />
              </ProtectedRoute>
            } />
            <Route path="/customer/profile" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <Profile />
              </ProtectedRoute>
            } />
            <Route path="/customer/contracts" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MyContracts />
              </ProtectedRoute>
            } />
            <Route path="/customer/recurring-packages" element={
              <ProtectedRoute allowedRoles={['customer']}>
                <MyRecurringPackages />
              </ProtectedRoute>
            } />

            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
            <Route path="/admin/reset-password" element={<AdminResetPassword />} />
            <Route path="/admin/dashboard" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="/admin/services" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminServices />
              </ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEmployees />
              </ProtectedRoute>
            } />
            <Route path="/admin/employee-requests" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminEmployeeRequests />
              </ProtectedRoute>
            } />
            <Route path="/admin/bookings" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminBookings />
              </ProtectedRoute>
            } />
            <Route path="/admin/system-users" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <SystemUsers />
              </ProtectedRoute>
            } />
            <Route path="/admin/profile" element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminProfile />
              </ProtectedRoute>
            } />

            <Route path="/employee/login" element={<EmployeeLogin />} />
            <Route path="/employee/forgot-password" element={<EmployeeForgotPassword />} />
            <Route path="/employee/reset-password" element={<EmployeeResetPassword />} />
            <Route path="/employee/dashboard" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeDashboard />
              </ProtectedRoute>
            } />
            <Route path="/employee/profile" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeProfile />
              </ProtectedRoute>
            } />
            <Route path="/employee/jobs" element={
              <ProtectedRoute allowedRoles={['employee']}>
                <EmployeeJobs />
              </ProtectedRoute>
            } />

            <Route path="/manager/login" element={<ManagerLogin />} />
            <Route path="/manager/forgot-password" element={<ManagerForgotPassword />} />
            <Route path="/manager/reset-password" element={<ManagerResetPassword />} />
            <Route path="/manager/dashboard" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerDashboard />
              </ProtectedRoute>
            } />
            <Route path="/manager/booking-assignment" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <BookingAssignment />
              </ProtectedRoute>
            } />
            <Route path="/manager/bookings/:id/assign" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <AssignBooking />
              </ProtectedRoute>
            } />
            <Route path="/manager/bookings/pending" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <PendingBookings />
              </ProtectedRoute>
            } />
            <Route path="/manager/bookings/active" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ActiveBookings />
              </ProtectedRoute>
            } />
            <Route path="/manager/employees" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerEmployees />
              </ProtectedRoute>
            } />
            <Route path="/manager/bookings" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerBookings />
              </ProtectedRoute>
            } />
            <Route path="/manager/employee-requests" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerEmployeeRequests />
              </ProtectedRoute>
            } />
            <Route path="/manager/profile" element={
              <ProtectedRoute allowedRoles={['manager']}>
                <ManagerProfile />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
