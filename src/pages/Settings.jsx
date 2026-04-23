import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/hooks/useOrganization.jsx';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Settings as SettingsIcon, Building2, Clock, CreditCard, Save, Loader2 } from 'lucide-react';
import NoOrganization from '@/components/NoOrganization';
import { toast } from 'sonner';

export default function Settings() {
  const { currentOrg, currentMembership } = useOrganization();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    business_hours_enabled: false,
    business_hours_start: '08:00',
    business_hours_end: '18:00',
  });

  const canManage = currentMembership?.role === 'owner' || currentMembership?.role === 'admin';

  useEffect(() => {
    if (currentOrg) {
      setForm({
        name: currentOrg.name || '',
        phone: currentOrg.phone || '',
        business_hours_enabled: currentOrg.business_hours_enabled || false,
        business_hours_start: currentOrg.business_hours_start || '08:00',
        business_hours_end: currentOrg.business_hours_end || '18:00',
      });
    }
  }, [currentOrg]);

  const handleSave = async () => {
    setLoading(true);
    await base44.entities.Organization.update(currentOrg.id, form);
    queryClient.invalidateQueries({ queryKey: ['userOrgs'] });
    toast.success('Configurações salvas!');
    setLoading(false);
  };

  if (!currentOrg) return <NoOrganization />;

  const planLabels = {
    free: 'Gratuito',
    starter: 'Starter',
    professional: 'Profissional',
    enterprise: 'Enterprise',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Configurações da organização</p>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Geral</CardTitle>
          </div>
          <CardDescription>Informações básicas da organização</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Nome da Organização</Label>
            <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} disabled={!canManage} />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} disabled={!canManage} />
          </div>
        </CardContent>
      </Card>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Horário de Atendimento</CardTitle>
          </div>
          <CardDescription>Defina o horário de funcionamento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Ativar horário de atendimento</Label>
            <Switch checked={form.business_hours_enabled} onCheckedChange={v => setForm({...form, business_hours_enabled: v})} disabled={!canManage} />
          </div>
          {form.business_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Início</Label>
                <Input type="time" value={form.business_hours_start} onChange={e => setForm({...form, business_hours_start: e.target.value})} disabled={!canManage} />
              </div>
              <div className="space-y-2">
                <Label>Fim</Label>
                <Input type="time" value={form.business_hours_end} onChange={e => setForm({...form, business_hours_end: e.target.value})} disabled={!canManage} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">Plano Atual</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 rounded-xl bg-muted">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">{planLabels[currentOrg.plan] || 'Gratuito'}</h3>
                <Badge variant="secondary" className="capitalize">{currentOrg.status}</Badge>
              </div>
              <div className="flex gap-6 mt-2 text-sm text-muted-foreground">
                <span>{currentOrg.max_users || 3} usuários</span>
                <span>{currentOrg.max_connections || 1} conexões</span>
                <span>{currentOrg.max_queues || 3} filas</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {canManage && (
        <Button onClick={handleSave} className="gap-2" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar Configurações
        </Button>
      )}
    </div>
  );
}