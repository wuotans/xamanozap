import React, { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { List, Plus, Loader2, Trash2, Pencil } from 'lucide-react';
import NoOrganization from '@/components/NoOrganization';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function Queues() {
  const { currentOrg, currentMembership } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState(null);
  const [form, setForm] = useState({ name: '', color: COLORS[0], greeting_message: '' });
  const [loading, setLoading] = useState(false);

  const orgId = currentOrg?.id;
  const canManage = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

  const { data: queues = [], isLoading } = useQuery({
    queryKey: ['queues', orgId],
    queryFn: () => base44.entities.Queue.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    if (editingQueue) {
      await base44.entities.Queue.update(editingQueue.id, form);
      toast.success('Fila atualizada!');
    } else {
      await base44.entities.Queue.create({ organization_id: orgId, ...form, is_active: true });
      toast.success('Fila criada!');
    }
    queryClient.invalidateQueries({ queryKey: ['queues'] });
    setDialogOpen(false);
    setEditingQueue(null);
    setForm({ name: '', color: COLORS[0], greeting_message: '' });
    setLoading(false);
  };

  const handleEdit = (queue) => {
    setEditingQueue(queue);
    setForm({ name: queue.name, color: queue.color || COLORS[0], greeting_message: queue.greeting_message || '' });
    setDialogOpen(true);
  };

  const handleToggle = async (queue) => {
    await base44.entities.Queue.update(queue.id, { is_active: !queue.is_active });
    queryClient.invalidateQueries({ queryKey: ['queues'] });
  };

  const handleDelete = async (id) => {
    await base44.entities.Queue.delete(id);
    queryClient.invalidateQueries({ queryKey: ['queues'] });
    toast.success('Fila removida');
  };

  if (!currentOrg) return <NoOrganization />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Filas</h1>
          <p className="text-muted-foreground mt-1">Organize os setores de atendimento</p>
        </div>
        {canManage && (
          <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditingQueue(null); setForm({ name: '', color: COLORS[0], greeting_message: '' }); } }}>
            <DialogTrigger asChild>
              <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Fila</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingQueue ? 'Editar Fila' : 'Nova Fila'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input placeholder="Ex: Suporte, Vendas..." value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Cor</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setForm({...form, color: c})}
                        className={`w-8 h-8 rounded-lg transition-all ${form.color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Mensagem de Saudação</Label>
                  <Input placeholder="Olá! Como posso ajudar?" value={form.greeting_message} onChange={e => setForm({...form, greeting_message: e.target.value})} />
                </div>
                <Button onClick={handleSave} className="w-full" disabled={loading || !form.name.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  {editingQueue ? 'Salvar' : 'Criar Fila'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Carregando...</div>
        ) : queues.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <List className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhuma fila configurada</p>
            </CardContent>
          </Card>
        ) : (
          queues.map((queue, i) => (
            <motion.div key={queue.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-10 rounded-full" style={{ backgroundColor: queue.color || COLORS[0] }} />
                      <div>
                        <h3 className="font-semibold">{queue.name}</h3>
                        {queue.greeting_message && <p className="text-xs text-muted-foreground mt-0.5">{queue.greeting_message}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={queue.is_active !== false} onCheckedChange={() => handleToggle(queue)} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant={queue.is_active !== false ? 'default' : 'secondary'}>
                      {queue.is_active !== false ? 'Ativa' : 'Inativa'}
                    </Badge>
                    {canManage && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(queue)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(queue.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}