import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import { OrganizationProvider } from '@/hooks/useOrganization.jsx';

import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import CreateOrganization from '@/pages/CreateOrganization';
import Members from '@/pages/Members';
import Tickets from '@/pages/Tickets';
import Connections from '@/pages/Connections';
import Contacts from '@/pages/Contacts';
import Queues from '@/pages/Queues';
import QuickMessages from '@/pages/QuickMessages';
import Settings from '@/pages/Settings';
import AdminOrganizations from '@/pages/admin/Organizations';
import AdminPlans from '@/pages/admin/Plans';
import Login from '@/pages/Login';

// Componente para rotas protegidas
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, isLoadingAuth } = useAuth();
  
  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Carregando...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Componente que engloba as rotas com OrganizationProvider
const AppRoutesWithProvider = () => {
  return (
    <OrganizationProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<AppLayout />}>
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/tickets" element={
            <ProtectedRoute>
              <Tickets />
            </ProtectedRoute>
          } />
          <Route path="/contacts" element={
            <ProtectedRoute>
              <Contacts />
            </ProtectedRoute>
          } />
          <Route path="/connections" element={
            <ProtectedRoute>
              <Connections />
            </ProtectedRoute>
          } />
          <Route path="/queues" element={
            <ProtectedRoute>
              <Queues />
            </ProtectedRoute>
          } />
          <Route path="/quick-messages" element={
            <ProtectedRoute>
              <QuickMessages />
            </ProtectedRoute>
          } />
          <Route path="/members" element={
            <ProtectedRoute>
              <Members />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/create-organization" element={
            <ProtectedRoute>
              <CreateOrganization />
            </ProtectedRoute>
          } />
          
          {/* Rotas administrativas */}
          <Route path="/admin/organizations" element={
            <ProtectedRoute adminOnly={true}>
              <AdminOrganizations />
            </ProtectedRoute>
          } />
          <Route path="/admin/plans" element={
            <ProtectedRoute adminOnly={true}>
              <AdminPlans />
            </ProtectedRoute>
          } />
        </Route>
        
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </OrganizationProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <Router>
        <AuthProvider>
          <AppRoutesWithProvider />
        </AuthProvider>
      </Router>
      <Toaster />
    </QueryClientProvider>
  )
}

export default App