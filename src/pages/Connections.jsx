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
import { Phone, Plus, Wifi, WifiOff, Loader2, Trash2, RefreshCw } from 'lucide-react';
import NoOrganization from '@/components/NoOrganization';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const statusConfig = {
  connected: { label: 'Conectado', color: 'bg-primary/10 text-primary', icon: Wifi },
  disconnected: { label: 'Desconectado', color: 'bg-muted text-muted-foreground', icon: WifiOff },
  pending: { label: 'Pendente', color: 'bg-amber-100 text-amber-700', icon: RefreshCw },
  error: { label: 'Erro', color: 'bg-destructive/10 text-destructive', icon: WifiOff },
};

const typeLabels = {
  official_api: 'API Oficial',
  unofficial: 'API Não Oficial',
  hub: 'HUB',
};

export default function Connections() {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('official_api');
  const [loading, setLoading] = useState(false);

  const orgId = currentOrg?.id;

  const { data: connections = [], isLoading } = useQuery({
    queryKey: ['connections', orgId],
    queryFn: () => base44.entities.WhatsAppConnection.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    await base44.entities.WhatsAppConnection.create({
      organization_id: orgId,
      name: name.trim(),
      phone_number: phone,
      type,
      status: 'disconnected',
    });
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    toast.success('Conexão criada!');
    setDialogOpen(false);
    setName('');
    setPhone('');
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.WhatsAppConnection.delete(id);
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    toast.success('Conexão removida');
  };

  const handleToggle = async (conn) => {
    const newStatus = conn.status === 'connected' ? 'disconnected' : 'connected';
    await base44.entities.WhatsAppConnection.update(conn.id, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['connections'] });
    toast.success(newStatus === 'connected' ? 'Conectado!' : 'Desconectado');
  };

  if (!currentOrg) return <NoOrganization />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Conexões WhatsApp</h1>
          <p className="text-muted-foreground mt-1">Gerencie seus canais de atendimento</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Conexão</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Conexão WhatsApp</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="WhatsApp Comercial" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Número</Label>
                <Input placeholder="+55 11 99999-9999" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="official_api">API Oficial</SelectItem>
                    <SelectItem value="unofficial">API Não Oficial</SelectItem>
                    <SelectItem value="hub">HUB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={loading || !name.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Conexão
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Carregando...</div>
        ) : connections.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Phone className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhuma conexão configurada</p>
            </CardContent>
          </Card>
        ) : (
          connections.map((conn, i) => {
            const status = statusConfig[conn.status] || statusConfig.disconnected;
            const StatusIcon = status.icon;
            return (
              <motion.div key={conn.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                          <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{conn.name}</h3>
                          <p className="text-xs text-muted-foreground">{conn.phone_number || 'Sem número'}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={`gap-1 ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-[10px]">{typeLabels[conn.type]}</Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleToggle(conn)}>
                          {conn.status === 'connected' ? 'Desconectar' : 'Conectar'}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(conn.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}