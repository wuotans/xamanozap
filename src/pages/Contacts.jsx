import React, { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Contact, Plus, Search, Phone, Mail, Loader2, Trash2 } from 'lucide-react';
import NoOrganization from '@/components/NoOrganization';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Contacts() {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' });
  const [loading, setLoading] = useState(false);

  const orgId = currentOrg?.id;

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', orgId],
    queryFn: () => base44.entities.Contact.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const filtered = contacts.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search)
  );

  const handleCreate = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    setLoading(true);
    await base44.entities.Contact.create({
      organization_id: orgId,
      ...form,
    });
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    toast.success('Contato adicionado!');
    setDialogOpen(false);
    setForm({ name: '', phone: '', email: '', notes: '' });
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Contact.delete(id);
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    toast.success('Contato removido');
  };

  if (!currentOrg) return <NoOrganization />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contatos</h1>
          <p className="text-muted-foreground mt-1">Base de contatos da organização</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Contato</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Contato</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input placeholder="Nome completo" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Telefone *</Label>
                <Input placeholder="+55 11 99999-9999" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input placeholder="email@exemplo.com" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input placeholder="Notas sobre o contato" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={loading || !form.name.trim() || !form.phone.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Adicionar Contato
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:w-72">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar contato..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Carregando...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhum contato encontrado</TableCell></TableRow>
              ) : (
                filtered.map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{contact.name?.[0]?.toUpperCase()}</span>
                        </div>
                        <span className="font-medium text-sm">{contact.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{contact.phone}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{contact.email || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(contact.id)} className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
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