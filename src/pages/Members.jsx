import React, { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { UserPlus, MoreVertical, Shield, User, Eye, Crown, Loader2, Mail } from 'lucide-react';
import NoOrganization from '@/components/NoOrganization';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const roleConfig = {
  owner: { label: 'Proprietário', icon: Crown, color: 'bg-amber-100 text-amber-700' },
  admin: { label: 'Administrador', icon: Shield, color: 'bg-primary/10 text-primary' },
  agent: { label: 'Agente', icon: User, color: 'bg-blue-100 text-blue-700' },
  viewer: { label: 'Visualizador', icon: Eye, color: 'bg-muted text-muted-foreground' },
};

const statusConfig = {
  active: { label: 'Ativo', color: 'bg-primary/10 text-primary' },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  suspended: { label: 'Suspenso', color: 'bg-destructive/10 text-destructive' },
};

export default function Members() {
  const { currentOrg, currentMembership } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('agent');
  const [inviteName, setInviteName] = useState('');
  const [loading, setLoading] = useState(false);

  const orgId = currentOrg?.id;
  const canManage = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['allMembers', orgId],
    queryFn: () => base44.entities.Member.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setLoading(true);
    
    const existing = members.find(m => m.user_email === inviteEmail);
    if (existing) {
      toast.error('Este email já é membro da organização');
      setLoading(false);
      return;
    }

    await base44.entities.Member.create({
      organization_id: orgId,
      user_email: inviteEmail.trim(),
      user_name: inviteName.trim() || inviteEmail.split('@')[0],
      role: inviteRole,
      status: 'pending',
      queues: [],
    });

    await base44.integrations.Core.SendEmail({
      to: inviteEmail.trim(),
      subject: `Convite para ${currentOrg.name} — XamanoZap`,
      body: `<h2>Você foi convidado!</h2><p><strong>${currentOrg.name}</strong> convidou você para participar como <strong>${roleConfig[inviteRole].label}</strong> na plataforma XamanoZap.</p><p>Acesse a plataforma para aceitar o convite.</p>`,
    });

    queryClient.invalidateQueries({ queryKey: ['allMembers'] });
    toast.success('Convite enviado com sucesso!');
    setDialogOpen(false);
    setInviteEmail('');
    setInviteName('');
    setInviteRole('agent');
    setLoading(false);
  };

  const handleRoleChange = async (memberId, newRole) => {
    await base44.entities.Member.update(memberId, { role: newRole });
    queryClient.invalidateQueries({ queryKey: ['allMembers'] });
    toast.success('Permissão atualizada');
  };

  const handleStatusChange = async (memberId, newStatus) => {
    await base44.entities.Member.update(memberId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['allMembers'] });
    toast.success('Status atualizado');
  };

  const handleRemove = async (memberId) => {
    await base44.entities.Member.delete(memberId);
    queryClient.invalidateQueries({ queryKey: ['allMembers'] });
    toast.success('Membro removido');
  };

  if (!currentOrg) return <NoOrganization />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Membros</h1>
          <p className="text-muted-foreground mt-1">Gerencie a equipe da organização</p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="w-4 h-4" />
                Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Membro</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input placeholder="Nome do membro" value={inviteName} onChange={e => setInviteName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input placeholder="email@exemplo.com" type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Permissão</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="agent">Agente</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} className="w-full gap-2" disabled={loading || !inviteEmail.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                  Enviar Convite
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Membro</TableHead>
                <TableHead>Permissão</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
                ) : members.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum membro encontrado</TableCell></TableRow>
                ) : (
                  members.map(member => {
                    const role = roleConfig[member.role] || roleConfig.agent;
                    const status = statusConfig[member.status] || statusConfig.pending;
                    const RoleIcon = role.icon;
                    return (
                      <motion.tr key={member.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="border-b last:border-0">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">{member.user_name?.[0]?.toUpperCase() || member.user_email?.[0]?.toUpperCase()}</span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{member.user_name || 'Sem nome'}</p>
                              <p className="text-xs text-muted-foreground">{member.user_email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={`gap-1 ${role.color}`}>
                            <RoleIcon className="w-3 h-3" />
                            {role.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={status.color}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {canManage && member.role !== 'owner' && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'admin')}>Tornar Admin</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'agent')}>Tornar Agente</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRoleChange(member.id, 'viewer')}>Tornar Visualizador</DropdownMenuItem>
                                {member.status === 'suspended' ? (
                                  <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'active')}>Reativar</DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem onClick={() => handleStatusChange(member.id, 'suspended')}>Suspender</DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => handleRemove(member.id)} className="text-destructive">Remover</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </TableCell>
                      </motion.tr>
                    );
                  })
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}