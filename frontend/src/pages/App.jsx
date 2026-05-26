import React from 'react';
import { ToastContainer } from 'react-toastify';
import { useAuth } from '../hooks/useAuth';

const LoginPage = React.lazy(() => import('./LoginPage'));
const AdminDashboard = React.lazy(() => import('./AdminDashboard'));
const SurveyPage = React.lazy(() => import('./SurveyPage'));
const NotFoundPage = React.lazy(() => import('./NotFoundPage'));

const isAdmin = window.location.pathname === '/gh-admin';
const isSurveyPage = window.location.pathname.startsWith('/survey');

function PageLoader() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-sm font-medium text-gray-500">Loading...</div>
    </div>
  );
}

export default function App() {
  const {
    authToken,
    currentUser,
    handleLogin,
    handleLogout,
    isAuthenticated
  } = useAuth();

  if (isAdmin && !isAuthenticated) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        <React.Suspense fallback={<PageLoader />}>
          <LoginPage onLogin={handleLogin} />
        </React.Suspense>
      </>
    );
  }

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <React.Suspense fallback={<PageLoader />}>
        {isAdmin ? <AdminDashboard authToken={authToken} currentUser={currentUser} onLogout={handleLogout} /> : isSurveyPage ? <SurveyPage /> : <NotFoundPage />}
      </React.Suspense>
    </>
  );
}
