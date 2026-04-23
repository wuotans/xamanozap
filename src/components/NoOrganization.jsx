import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

export default function NoOrganization() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Building2 className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold">Nenhuma organização encontrada</h2>
      <p className="text-muted-foreground text-center max-w-md">
        Crie ou aguarde o convite para uma organização antes de acessar esta página.
      </p>
      <Link
        to="/create-organization"
        className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
      >
        Criar Organização
      </Link>
    </div>
  );
}