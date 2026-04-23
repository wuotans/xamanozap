import React, { useState } from 'react';
import { useOrganization } from '@/hooks/useOrganization.jsx';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Search, Clock, CheckCircle2, AlertCircle, User } from 'lucide-react';
import NoOrganization from '@/components/NoOrganization';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusIcons = {
  open: <AlertCircle className="w-3.5 h-3.5" />,
  pending: <Clock className="w-3.5 h-3.5" />,
  closed: <CheckCircle2 className="w-3.5 h-3.5" />,
};

const statusColors = {
  open: 'bg-primary/10 text-primary border-primary/20',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  closed: 'bg-muted text-muted-foreground border-border',
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-destructive/10 text-destructive',
};

export default function Tickets() {
  const { currentOrg } = useOrganization();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const orgId = currentOrg?.id;

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', orgId],
    queryFn: () => base44.entities.Ticket.filter({ organization_id: orgId }, '-created_date'),
    enabled: !!orgId,
  });

  const filtered = tickets.filter(t => {
    const matchSearch = !search || t.contact_name?.toLowerCase().includes(search.toLowerCase()) || t.last_message?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const counts = {
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    pending: tickets.filter(t => t.status === 'pending').length,
    closed: tickets.filter(t => t.status === 'closed').length,
  };

  const handleStatusChange = async (ticketId, newStatus) => {
    await base44.entities.Ticket.update(ticketId, { status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  };

  if (!currentOrg) return <NoOrganization />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Atendimentos</h1>
        <p className="text-muted-foreground mt-1">Gerencie conversas e tickets de suporte</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Tabs value={statusFilter} onValueChange={setStatusFilter}>
          <TabsList>
            <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
            <TabsTrigger value="open">Abertos ({counts.open})</TabsTrigger>
            <TabsTrigger value="pending">Pendentes ({counts.pending})</TabsTrigger>
            <TabsTrigger value="closed">Fechados ({counts.closed})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar atendimento..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Carregando...</div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16">
                <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Nenhum atendimento encontrado</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((ticket, i) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{ticket.contact_name?.[0]?.toUpperCase()}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">{ticket.contact_name}</h3>
                          {ticket.contact_phone && <span className="text-xs text-muted-foreground">{ticket.contact_phone}</span>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{ticket.last_message || 'Sem mensagens'}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge variant="outline" className={`gap-1 text-[10px] ${statusColors[ticket.status]}`}>
                            {statusIcons[ticket.status]}
                            {ticket.status === 'open' ? 'Aberto' : ticket.status === 'pending' ? 'Pendente' : 'Fechado'}
                          </Badge>
                          {ticket.priority && (
                            <Badge variant="secondary" className={`text-[10px] ${priorityColors[ticket.priority]}`}>
                              {ticket.priority === 'low' ? 'Baixa' : ticket.priority === 'medium' ? 'Média' : ticket.priority === 'high' ? 'Alta' : 'Urgente'}
                            </Badge>
                          )}
                          {ticket.assigned_to && (
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <User className="w-2.5 h-2.5" />
                              {ticket.assigned_to.split('@')[0]}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-muted-foreground">
                          {ticket.last_message_at ? format(new Date(ticket.last_message_at), 'dd/MM HH:mm') : format(new Date(ticket.created_date), 'dd/MM HH:mm')}
                        </p>
                        <Select value={ticket.status} onValueChange={(v) => handleStatusChange(ticket.id, v)}>
                          <SelectTrigger className="h-7 text-xs mt-2 w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Aberto</SelectItem>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="closed">Fechado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}