import React, { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const OrganizationContext = createContext();

export const useOrganization = () => {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
};

export const OrganizationProvider = ({ children }) => {
  const { user } = useAuth();
  const [organization, setOrganization] = useState(null);
  const [currentOrg, setCurrentOrg] = useState(null); // Adicionado para o Sidebar
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Buscando organizações...');
      const response = await base44.get('/organizations');
      console.log('📦 Organizações recebidas:', response.data);
      
      setOrganizations(response.data);
      
      if (response.data.length > 0) {
        // Verificar se tem organização salva no localStorage
        const savedOrg = localStorage.getItem('selectedOrganization');
        let selectedOrg = null;
        
        if (savedOrg) {
          selectedOrg = JSON.parse(savedOrg);
          const exists = response.data.find(o => o.id === selectedOrg.id);
          if (exists) {
            setOrganization(exists);
            setCurrentOrg(exists);
          } else {
            setOrganization(response.data[0]);
            setCurrentOrg(response.data[0]);
          }
        } else {
          setOrganization(response.data[0]);
          setCurrentOrg(response.data[0]);
        }
      } else {
        setOrganization(null);
        setCurrentOrg(null);
      }
    } catch (err) {
      console.error('❌ Erro ao buscar organizações:', err);
      setError(err.message);
      setOrganizations([]);
      setOrganization(null);
      setCurrentOrg(null);
    } finally {
      setLoading(false);
    }
  };

  const switchOrganization = (org) => {
    setOrganization(org);
    setCurrentOrg(org);
    localStorage.setItem('selectedOrganization', JSON.stringify(org));
    
    // Atualizar o usuário com a nova organização no backend
    if (user?.id) {
      base44.put(`/users/${user.id}`, { organization_id: org.id }).catch(console.error);
    }
    
    // Recarregar a página para atualizar todos os dados
    window.location.reload();
  };

  const switchOrg = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    if (org) {
      switchOrganization(org);
    }
  };

  const value = {
    organization,
    currentOrg, // Adicionado para o Sidebar
    organizations,
    loading,
    error,
    switchOrganization,
    switchOrg, // Adicionado para compatibilidade
    fetchOrganizations,
    user, // Passar o user também
  };

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
};