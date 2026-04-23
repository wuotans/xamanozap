import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground font-medium">Carregando XamanoZap...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <OrganizationProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/queues" element={<Queues />} />
          <Route path="/quick-messages" element={<QuickMessages />} />
          <Route path="/members" element={<Members />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/create-organization" element={<CreateOrganization />} />
          <Route path="/admin/organizations" element={<AdminOrganizations />} />
          <Route path="/admin/plans" element={<AdminPlans />} />
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </OrganizationProvider>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App