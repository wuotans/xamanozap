import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Plus, Loader2, Check, Users, Phone, List } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function AdminPlans() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    key: 'starter',
    price_monthly: 0,
    max_users: 5,
    max_connections: 2,
    max_queues: 5,
    features: [],
  });
  const [featureInput, setFeatureInput] = useState('');

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => base44.entities.Plan.list(),
  });

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    await base44.entities.Plan.create({ ...form, is_active: true });
    queryClient.invalidateQueries({ queryKey: ['plans'] });
    toast.success('Plano criado!');
    setDialogOpen(false);
    setForm({ name: '', key: 'starter', price_monthly: 0, max_users: 5, max_connections: 2, max_queues: 5, features: [] });
    setLoading(false);
  };

  const addFeature = () => {
    if (!featureInput.trim()) return;
    setForm({...form, features: [...form.features, featureInput.trim()]});
    setFeatureInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground mt-1">Gerencie os planos da plataforma</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Plano</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Novo Plano</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input placeholder="Starter" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Chave</Label>
                  <Select value={form.key} onValueChange={v => setForm({...form, key: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="starter">Starter</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Preço Mensal (R$)</Label>
                <Input type="number" value={form.price_monthly} onChange={e => setForm({...form, price_monthly: Number(e.target.value)})} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Max Usuários</Label>
                  <Input type="number" value={form.max_users} onChange={e => setForm({...form, max_users: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Max Conexões</Label>
                  <Input type="number" value={form.max_connections} onChange={e => setForm({...form, max_connections: Number(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Max Filas</Label>
                  <Input type="number" value={form.max_queues} onChange={e => setForm({...form, max_queues: Number(e.target.value)})} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Funcionalidades</Label>
                <div className="flex gap-2">
                  <Input placeholder="Ex: Chatbot IA" value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} />
                  <Button type="button" variant="outline" onClick={addFeature}>Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {form.features.map((f, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 cursor-pointer" onClick={() => setForm({...form, features: form.features.filter((_, j) => j !== i)})}>
                      {f} ×
                    </Badge>
                  ))}
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full" disabled={loading || !form.name.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Criar Plano
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">Carregando...</div>
        ) : plans.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <CreditCard className="w-12 h-12 text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">Nenhum plano cadastrado</p>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan, i) => (
            <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="hover:shadow-xl transition-all relative overflow-hidden">
                {plan.key === 'professional' && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
                )}
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>{plan.name}</CardTitle>
                    <Badge variant="outline" className="capitalize">{plan.key}</Badge>
                  </div>
                  <CardDescription>
                    <span className="text-3xl font-bold text-foreground">R${plan.price_monthly}</span>
                    <span className="text-sm">/mês</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span>{plan.max_users} usuários</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{plan.max_connections} conexões</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <List className="w-4 h-4 text-muted-foreground" />
                      <span>{plan.max_queues} filas</span>
                    </div>
                  </div>
                  {plan.features?.length > 0 && (
                    <div className="space-y-2 pt-3 border-t">
                      {plan.features.map((f, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm">
                          <Check className="w-3.5 h-3.5 text-primary" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}