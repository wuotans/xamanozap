import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useOrganization } from '@/hooks/useOrganization.jsx';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Building2, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreateOrganization() {
  const { user } = useOrganization();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

    const org = await base44.entities.Organization.create({
      name: name.trim(),
      slug,
      owner_email: user.email,
      phone,
      plan: 'free',
      status: 'active',
      max_users: 3,
      max_connections: 1,
      max_queues: 3,
    });

    await base44.entities.Member.create({
      organization_id: org.id,
      user_email: user.email,
      user_name: user.full_name,
      role: 'owner',
      status: 'active',
      queues: [],
    });

    await queryClient.invalidateQueries({ queryKey: ['memberships'] });
    await queryClient.invalidateQueries({ queryKey: ['userOrgs'] });

    setTimeout(() => {
      navigate('/');
    }, 500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-2xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Criar Organização</CardTitle>
            <CardDescription>Configure sua empresa para começar a atender via WhatsApp</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nome da Organização</Label>
                <Input
                  id="name"
                  placeholder="Minha Empresa"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone (opcional)</Label>
                <Input
                  id="phone"
                  placeholder="+55 11 99999-9999"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="h-11"
                />
              </div>
              <Button type="submit" className="w-full h-11 gap-2" disabled={loading || !name.trim()}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                {loading ? 'Criando...' : 'Criar Organização'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}