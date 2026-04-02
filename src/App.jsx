import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage     from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import BoardPage     from './pages/BoardPage';
import SignupPage from "./pages/SignupPage";
import { ActivityProvider } from './context/ActivityContext';
function App() {
  return (
    <ActivityProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/"       element={<Navigate to="/login" replace />} />
              <Route path="/login"  element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              
              <Route path="/dashboard" element={
                <ProtectedRoute><DashboardPage /></ProtectedRoute>
              } />

              <Route path="/boards/:boardId" element={
                <ProtectedRoute><BoardPage /></ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ActivityProvider> 
  );
}

export default App;
