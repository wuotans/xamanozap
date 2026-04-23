import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Building2, Users, Phone } from 'lucide-react';
import { format } from 'date-fns';

const planColors = {
  free: 'bg-muted text-muted-foreground',
  starter: 'bg-blue-100 text-blue-700',
  professional: 'bg-primary/10 text-primary',
  enterprise: 'bg-amber-100 text-amber-700',
};

const statusColors = {
  active: 'bg-primary/10 text-primary',
  suspended: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-muted text-muted-foreground',
};

export default function AdminOrganizations() {
  const { data: organizations = [], isLoading } = useQuery({
    queryKey: ['adminOrgs'],
    queryFn: () => base44.entities.Organization.list('-created_date'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organizações</h1>
        <p className="text-muted-foreground mt-1">Todas as organizações da plataforma</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10"><Building2 className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{organizations.length}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10"><Building2 className="w-5 h-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{organizations.filter(o => o.status === 'active').length}</p>
              <p className="text-xs text-muted-foreground">Ativas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-100"><Building2 className="w-5 h-5 text-amber-700" /></div>
            <div>
              <p className="text-2xl font-bold">{organizations.filter(o => o.plan !== 'free').length}</p>
              <p className="text-xs text-muted-foreground">Pagas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organização</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Proprietário</TableHead>
                <TableHead>Criada em</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : organizations.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhuma organização</TableCell></TableRow>
              ) : (
                organizations.map(org => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{org.name}</p>
                          <p className="text-[10px] text-muted-foreground">{org.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`capitalize ${planColors[org.plan]}`}>{org.plan}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`capitalize ${statusColors[org.status]}`}>{org.status === 'active' ? 'Ativa' : org.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{org.owner_email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{format(new Date(org.created_date), 'dd/MM/yyyy')}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}