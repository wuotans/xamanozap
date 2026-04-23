import React, { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Zap, Plus, Loader2, Trash2, Pencil, Copy } from 'lucide-react';
import NoOrganization from '@/components/NoOrganization';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function QuickMessages() {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ shortcut: '', message: '' });
  const [loading, setLoading] = useState(false);

  const orgId = currentOrg?.id;

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['quickMessages', orgId],
    queryFn: () => base44.entities.QuickMessage.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const handleSave = async () => {
    if (!form.shortcut.trim() || !form.message.trim()) return;
    setLoading(true);
    if (editing) {
      await base44.entities.QuickMessage.update(editing.id, form);
      toast.success('Mensagem atualizada!');
    } else {
      await base44.entities.QuickMessage.create({ organization_id: orgId, ...form });
      toast.success('Mensagem criada!');
    }
    queryClient.invalidateQueries({ queryKey: ['quickMessages'] });
    setDialogOpen(false);
    setEditing(null);
    setForm({ shortcut: '', message: '' });
    setLoading(false);
  };

  const handleEdit = (msg) => {
    setEditing(msg);
    setForm({ shortcut: msg.shortcut, message: msg.message });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    await base44.entities.QuickMessage.delete(id);
    queryClient.invalidateQueries({ queryKey: ['quickMessages'] });
    toast.success('Mensagem removida');
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado!');
  };

  if (!currentOrg) return <NoOrganization />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mensagens Rápidas</h1>
          <p className="text-muted-foreground mt-1">Atalhos para respostas frequentes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) { setEditing(null); setForm({ shortcut: '', message: '' }); } }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Mensagem</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar Mensagem' : 'Nova Mensagem Rápida'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Atalho</Label>
                <Input placeholder="/saudacao" value={form.shortcut} onChange={e => setForm({...form, shortcut: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Mensagem</Label>
                <Textarea placeholder="Olá! Seja bem-vindo. Como posso ajudar?" value={form.message} onChange={e => setForm({...form, message: e.target.value})} className="min-h-[100px]" />
              </div>
              <Button onClick={handleSave} className="w-full" disabled={loading || !form.shortcut.trim() || !form.message.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editing ? 'Salvar' : 'Criar Mensagem'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Carregando...</div>
        ) : messages.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Zap className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhuma mensagem rápida configurada</p>
            </CardContent>
          </Card>
        ) : (
          messages.map((msg, i) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <code className="text-sm font-mono bg-primary/10 text-primary px-2 py-1 rounded">{msg.shortcut}</code>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(msg.message)}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(msg)}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(msg.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{msg.message}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}