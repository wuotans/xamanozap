import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const OrganizationContext = createContext();

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }) => {
  const [organization, setOrganization] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await base44.get('/organizations');
      setOrganizations(response.data);
      if (response.data.length > 0 && !organization) {
        setOrganization(response.data[0]);
      }
    } catch (err) {
      console.error('Erro ao buscar organizações:', err);
      setError(err.message);
      // Dados mockados para teste
      const mockOrganizations = [
        { id: 1, name: 'Empresa A', status: 'active' },
        { id: 2, name: 'Empresa B', status: 'active' },
      ];
      setOrganizations(mockOrganizations);
      setOrganization(mockOrganizations[0]);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = (org) => {
    setOrganization(org);
    localStorage.setItem('selectedOrganization', JSON.stringify(org));
  };

  const value = {
    organization,
    organizations,
    loading,
    error,
    switchOrganization,
    fetchOrganizations,
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};