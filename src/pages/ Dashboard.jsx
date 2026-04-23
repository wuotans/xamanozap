import React from 'react';
import { useOrganization } from '@/hooks/useOrganization.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Users, Phone, Clock, TrendingUp, ArrowUpRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Link } from 'react-router-dom';

function StatCard({ title, value, icon: Icon, trend, color }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="relative overflow-hidden hover:shadow-lg transition-shadow">
        <div className={`absolute top-0 right-0 w-24 h-24 rounded-full -translate-y-6 translate-x-6 opacity-10 ${color}`} />
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <p className="text-3xl font-bold mt-1">{value}</p>
              {trend && (
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUpRight className="w-3 h-3 text-primary" />
                  <span className="text-xs font-medium text-primary">{trend}</span>
                </div>
              )}
            </div>
            <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
              <Icon className="w-5 h-5 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Dashboard() {
  const { currentOrg } = useOrganization();
  const orgId = currentOrg?.id;

  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets', orgId],
    queryFn: () => base44.entities.Ticket.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', orgId],
    queryFn: () => base44.entities.Contact.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: connections = [] } = useQuery({
    queryKey: ['connections', orgId],
    queryFn: () => base44.entities.WhatsAppConnection.filter({ organization_id: orgId }),
    enabled: !!orgId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => base44.entities.Member.filter({ organization_id: orgId, status: 'active' }),
    enabled: !!orgId,
  });

  const openTickets = tickets.filter(t => t.status === 'open');
  const pendingTickets = tickets.filter(t => t.status === 'pending');
  const connectedWa = connections.filter(c => c.status === 'connected');

  const statusData = [
    { name: 'Abertos', value: openTickets.length, fill: 'hsl(var(--chart-1))' },
    { name: 'Pendentes', value: pendingTickets.length, fill: 'hsl(var(--chart-3))' },
    { name: 'Fechados', value: tickets.filter(t => t.status === 'closed').length, fill: 'hsl(var(--chart-2))' },
  ];

  if (!currentOrg) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Zap className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Bem-vindo ao XamanoZap</h2>
        <p className="text-muted-foreground text-center max-w-md">Crie sua primeira organização para começar a gerenciar seus atendimentos via WhatsApp.</p>
        <Link to="/create-organization" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors">
          Criar Organização
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground mt-1">{currentOrg.name} — Visão geral</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Atendimentos Abertos" value={openTickets.length} icon={MessageSquare} color="bg-primary" trend="+12% esta semana" />
        <StatCard title="Contatos" value={contacts.length} icon={Users} color="bg-chart-2" />
        <StatCard title="Conexões Ativas" value={`${connectedWa.length}/${connections.length}`} icon={Phone} color="bg-chart-3" />
        <StatCard title="Membros" value={members.length} icon={Users} color="bg-chart-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket Status Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Atendimentos por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent tickets */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos Atendimentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tickets.slice(0, 5).map(ticket => (
                <div key={ticket.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-primary">{ticket.contact_name?.[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ticket.contact_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{ticket.last_message || 'Sem mensagens'}</p>
                  </div>
                  <Badge variant="secondary" className="text-[10px] capitalize">{ticket.status}</Badge>
                </div>
              ))}
              {tickets.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhum atendimento ainda</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}