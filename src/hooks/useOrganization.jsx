import { useState, useEffect, createContext, useContext } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

const OrgContext = createContext(null);

export function OrganizationProvider({ children }) {
  const [currentOrgId, setCurrentOrgId] = useState(() => {
    return localStorage.getItem('currentOrgId') || null;
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: memberships = [], isLoading: isLoadingMemberships } = useQuery({
    queryKey: ['memberships', user?.email],
    queryFn: () => base44.entities.Member.filter({ user_email: user.email, status: 'active' }),
    enabled: !!user?.email,
  });

  const { data: organizations = [], isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['userOrgs', memberships],
    queryFn: async () => {
      if (memberships.length === 0) return [];
      const orgIds = memberships.map(m => m.organization_id);
      const allOrgs = await base44.entities.Organization.list();
      return allOrgs.filter(o => orgIds.includes(o.id));
    },
    enabled: memberships.length > 0,
  });

  const currentOrg = organizations.find(o => o.id === currentOrgId) || organizations[0] || null;
  const currentMembership = memberships.find(m => m.organization_id === (currentOrg?.id)) || null;

  useEffect(() => {
    if (currentOrg && currentOrg.id !== currentOrgId) {
      setCurrentOrgId(currentOrg.id);
      localStorage.setItem('currentOrgId', currentOrg.id);
    }
  }, [currentOrg, currentOrgId]);

  const switchOrg = (orgId) => {
    setCurrentOrgId(orgId);
    localStorage.setItem('currentOrgId', orgId);
  };

  const isLoading = isLoadingMemberships || isLoadingOrgs;

  return (
    <OrgContext.Provider value={{
      user,
      organizations,
      currentOrg,
      currentMembership,
      switchOrg,
      isLoading,
      hasOrgs: organizations.length > 0,
    }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrganization() {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrganization must be used within OrganizationProvider');
  return ctx;
}