import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import PageLoader from './components/common/PageLoader.jsx';

// Lazy Load Pages
const Login = lazy(() => import('./pages/Login'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminSettings = lazy(() => import('./pages/AdminSettings'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const TeacherAttendance = lazy(() => import('./pages/TeacherAttendance'));
const TeacherMarks = lazy(() => import('./pages/TeacherMarks'));
const TeacherSettings = lazy(() => import('./pages/TeacherSettings'));
const HODDashboard = lazy(() => import('./pages/HODDashboard')); // New
const HODDepartment = lazy(() => import('./pages/HODDepartment')); // New
const HODReports = lazy(() => import('./pages/HODReports')); // New
const ParentDashboard = lazy(() => import('./pages/ParentDashboard')); // New
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const ParentAttendance = lazy(() => import('./pages/ParentAttendance'));
const ParentPerformance = lazy(() => import('./pages/ParentPerformance'));
const StudentPerformance = lazy(() => import('./pages/StudentPerformance'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                {/* Common Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'teacher', 'hod', 'student', 'parent']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/change-password" element={<ChangePassword />} />
                  </Route>
                </Route>

                {/* Admin Routes */}
                {/* ... existing admin routes ... */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/settings" element={<AdminSettings />} />
                    <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Route>
                </Route>

                {/* HOD Routes */}
                <Route element={<ProtectedRoute allowedRoles={['hod']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/hod/dashboard" element={<HODDashboard />} />
                    <Route path="/hod/department" element={<HODDepartment />} />
                    <Route path="/hod/reports" element={<HODReports />} />
                    <Route path="/hod/*" element={<Navigate to="/hod/dashboard" replace />} />
                  </Route>
                </Route>

                {/* Parent Routes */}
                <Route element={<ProtectedRoute allowedRoles={['parent']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/parent/dashboard" element={<ParentDashboard />} />
                    <Route path="/parent/attendance" element={<ParentAttendance />} />
                    <Route path="/parent/performance" element={<ParentPerformance />} />
                    <Route path="/parent/*" element={<Navigate to="/parent/dashboard" replace />} />
                  </Route>
                </Route>

                {/* Teacher Routes - Accessible by Teacher AND HOD */}
                <Route element={<ProtectedRoute allowedRoles={['teacher', 'hod']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
                    <Route path="/teacher/attendance" element={<TeacherAttendance />} />
                    <Route path="/teacher/marks" element={<TeacherMarks />} />
                    <Route path="/teacher/settings" element={<TeacherSettings />} />
                    <Route path="/teacher/*" element={<Navigate to="/teacher/dashboard" replace />} />
                  </Route>
                </Route>

                {/* Student Routes */}
                <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/attendance" element={<StudentAttendance />} />
                    <Route path="/student/marks" element={<StudentPerformance />} />
                    <Route path="/student/*" element={<Navigate to="/student/dashboard" replace />} />
                  </Route>
                </Route>

                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </Suspense>
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
