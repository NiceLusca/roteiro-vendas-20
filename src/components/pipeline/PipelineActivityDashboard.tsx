import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, subDays, startOfDay, endOfDay, startOfYesterday, endOfYesterday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDistanceToNow } from 'date-fns';
import {
  ArrowRight, MessageSquare, UserPlus, UserMinus, Paperclip, Trash2,
  GitBranch, Archive, PlusCircle, Pencil, CalendarX, History,
  CalendarIcon, Loader2, ChevronDown, Filter, User, Activity, Users,
  BarChart3, Eye, EyeOff
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const PAGE_SIZE = 50;

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(262, 80%, 50%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(0, 84%, 60%)',
  'hsl(199, 89%, 48%)',
  'hsl(330, 81%, 60%)',
  'hsl(173, 58%, 39%)',
];

type PeriodFilter = 'today' | 'yesterday' | '7days' | '30days' | 'custom';

interface ActivityRow {
  id: string;
  lead_id: string;
  pipeline_entry_id: string | null;
  activity_type: string;
  details: Record<string, any> | null;
  performed_by: string | null;
  performed_by_name: string | null;
  created_at: string;
  lead_name?: string;
}

const activityIcons: Record<string, { icon: typeof ArrowRight; color: string }> = {
  stage_change: { icon: ArrowRight, color: 'bg-primary/10 text-primary' },
  note_added: { icon: MessageSquare, color: 'bg-purple-500/10 text-purple-600' },
  attachment_added: { icon: Paperclip, color: 'bg-blue-500/10 text-blue-600' },
  attachment_deleted: { icon: Trash2, color: 'bg-destructive/10 text-destructive' },
  responsible_added: { icon: UserPlus, color: 'bg-green-500/10 text-green-600' },
  responsible_removed: { icon: UserMinus, color: 'bg-orange-500/10 text-orange-600' },
  inscription: { icon: PlusCircle, color: 'bg-green-500/10 text-green-600' },
  archive: { icon: Archive, color: 'bg-muted text-muted-foreground' },
  transfer: { icon: GitBranch, color: 'bg-orange-500/10 text-orange-600' },
  lead_created: { icon: PlusCircle, color: 'bg-green-500/10 text-green-600' },
  lead_updated: { icon: Pencil, color: 'bg-muted text-muted-foreground' },
  appointment_deleted: { icon: CalendarX, color: 'bg-destructive/10 text-destructive' },
};

function getActivityLabel(type: string): string {
  const labels: Record<string, string> = {
    stage_change: 'Movimentação',
    note_added: 'Comentário',
    attachment_added: 'Anexo adicionado',
    attachment_deleted: 'Anexo removido',
    responsible_added: 'Responsável adicionado',
    responsible_removed: 'Responsável removido',
    inscription: 'Inscrição',
    archive: 'Arquivamento',
    transfer: 'Transferência',
    lead_created: 'Lead criado',
    lead_updated: 'Atualização',
    appointment_deleted: 'Agendamento deletado',
  };
  return labels[type] || type;
}

function formatDescription(activity: ActivityRow): string {
  const d = activity.details || {};
  switch (activity.activity_type) {
    case 'stage_change':
      return `Moveu para "${d.to_stage || '?'}"${d.from_stage ? ` (de "${d.from_stage}")` : ''}`;
    case 'note_added': {
      const preview = d.note_preview || d.note_text || '';
      return preview.length > 80 ? `Comentou: "${preview.substring(0, 80)}..."` : `Comentou: "${preview}"`;
    }
    case 'attachment_added':
      return `Anexou "${d.file_name || 'arquivo'}"`;
    case 'attachment_deleted':
      return `Removeu anexo "${d.file_name || 'arquivo'}"`;
    case 'responsible_added':
      return `Adicionou responsável: ${d.responsible_name || '?'}`;
    case 'responsible_removed':
      return `Removeu responsável: ${d.responsible_name || '?'}`;
    case 'inscription':
      return `Inscreveu em "${d.stage_name || d.pipeline_name || '?'}"`;
    case 'archive':
      return `Arquivou${d.reason ? `: ${d.reason}` : ''}`;
    case 'transfer':
      return `Transferiu para "${d.to_pipeline || '?'}"`;
    case 'lead_created':
      return `Lead criado${d.origem ? ` via ${d.origem}` : ''}`;
    case 'lead_updated': {
      const fields = d.fields_changed || [];
      return `Atualizou ${fields.length > 0 ? fields.slice(0, 3).join(', ') : 'dados'}`;
    }
    case 'appointment_deleted': {
      const aptDate = d.data_hora ? new Date(d.data_hora).toLocaleDateString('pt-BR') : '';
      return `Deletou agendamento${aptDate ? ` de ${aptDate}` : ''}${d.titulo ? `: "${d.titulo}"` : ''}`;
    }
    default:
      return 'Ação registrada';
  }
}

function getDateRange(period: PeriodFilter, customFrom?: Date, customTo?: Date): { from: string; to: string } {
  const now = new Date();
  switch (period) {
    case 'today':
      return { from: startOfDay(now).toISOString(), to: endOfDay(now).toISOString() };
    case 'yesterday':
      return { from: startOfYesterday().toISOString(), to: endOfYesterday().toISOString() };
    case '7days':
      return { from: startOfDay(subDays(now, 7)).toISOString(), to: endOfDay(now).toISOString() };
    case '30days':
      return { from: startOfDay(subDays(now, 30)).toISOString(), to: endOfDay(now).toISOString() };
    case 'custom':
      return {
        from: customFrom ? startOfDay(customFrom).toISOString() : startOfDay(subDays(now, 7)).toISOString(),
        to: customTo ? endOfDay(customTo).toISOString() : endOfDay(now).toISOString(),
      };
  }
}

interface Props {
  pipelineId: string;
}

export function PipelineActivityDashboard({ pipelineId }: Props) {
  const [activities, setActivities] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [period, setPeriod] = useState<PeriodFilter>('7days');
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const [selectedUser, setSelectedUser] = useState('all');
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);
  const [entryIds, setEntryIds] = useState<string[]>([]);

  // 1. Fetch all pipeline entry IDs for this pipeline
  useEffect(() => {
    if (!pipelineId) return;
    let cancelled = false;

    const fetchEntries = async () => {
      const allIds: string[] = [];
      let from = 0;
      const PAGE = 1000;
      while (true) {
        const { data } = await supabase
          .from('lead_pipeline_entries')
          .select('id')
          .eq('pipeline_id', pipelineId)
          .range(from, from + PAGE - 1);
        if (!data || data.length === 0) break;
        data.forEach(d => allIds.push(d.id));
        if (data.length < PAGE) break;
        from += PAGE;
      }
      if (!cancelled) setEntryIds(allIds);
    };

    fetchEntries();
    return () => { cancelled = true; };
  }, [pipelineId]);

  // 2. Fetch unique users from activities
  useEffect(() => {
    if (entryIds.length === 0) return;
    let cancelled = false;

    const fetchUsers = async () => {
      // Get distinct performed_by from activity log for these entries
      const CHUNK = 100;
      const userMap = new Map<string, string>();
      
      for (let i = 0; i < entryIds.length; i += CHUNK) {
        const chunk = entryIds.slice(i, i + CHUNK);
        const { data } = await supabase
          .from('lead_activity_log')
          .select('performed_by, performed_by_name')
          .in('pipeline_entry_id', chunk)
          .not('performed_by', 'is', null);
        
        if (data) {
          data.forEach(d => {
            if (d.performed_by && !userMap.has(d.performed_by)) {
              userMap.set(d.performed_by, d.performed_by_name || 'Usuário');
            }
          });
        }
      }

      if (!cancelled) {
        setUsers(Array.from(userMap.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)));
      }
    };

    fetchUsers();
    return () => { cancelled = true; };
  }, [entryIds]);

  // 3. Fetch activities with filters
  const fetchActivities = useCallback(async (offset: number = 0) => {
    if (entryIds.length === 0) {
      setActivities([]);
      setLoading(false);
      return;
    }

    if (offset === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const { from: dateFrom, to: dateTo } = getDateRange(period, customFrom, customTo);
      
      // Query in chunks since entryIds can be large
      const CHUNK = 100;
      let allResults: ActivityRow[] = [];

      for (let i = 0; i < entryIds.length; i += CHUNK) {
        const chunk = entryIds.slice(i, i + CHUNK);
        let query = supabase
          .from('lead_activity_log')
          .select('id, lead_id, pipeline_entry_id, activity_type, details, performed_by, performed_by_name, created_at')
          .in('pipeline_entry_id', chunk)
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo)
          .order('created_at', { ascending: false });

        if (selectedUser !== 'all') {
          query = query.eq('performed_by', selectedUser);
        }

        const { data } = await query;
        if (data) {
          allResults.push(...(data as ActivityRow[]));
        }
      }

      // Sort all results by created_at descending
      allResults.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Now fetch lead names for these activities
      const uniqueLeadIds = [...new Set(allResults.map(a => a.lead_id))];
      const leadNames = new Map<string, string>();

      for (let i = 0; i < uniqueLeadIds.length; i += CHUNK) {
        const chunk = uniqueLeadIds.slice(i, i + CHUNK);
        const { data } = await supabase
          .from('leads')
          .select('id, nome')
          .in('id', chunk);
        if (data) data.forEach(l => leadNames.set(l.id, l.nome));
      }

      allResults = allResults.map(a => ({
        ...a,
        details: (a.details || {}) as Record<string, any>,
        lead_name: leadNames.get(a.lead_id) || 'Lead desconhecido',
      }));

      // Apply client-side pagination
      const paginated = allResults.slice(0, offset + PAGE_SIZE);
      setHasMore(allResults.length > offset + PAGE_SIZE);

      if (offset === 0) {
        setActivities(paginated);
      } else {
        setActivities(allResults.slice(0, offset + PAGE_SIZE));
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [entryIds, period, customFrom, customTo, selectedUser]);

  useEffect(() => {
    fetchActivities(0);
  }, [fetchActivities]);

  const periodLabel: Record<PeriodFilter, string> = {
    today: 'Hoje',
    yesterday: 'Ontem',
    '7days': 'Últimos 7 dias',
    '30days': 'Últimos 30 dias',
    custom: 'Personalizado',
  };

  const [showDashboard, setShowDashboard] = useState(true);

  // Derived metrics
  const metrics = useMemo(() => {
    const uniqueUsers = new Set(activities.map(a => a.performed_by).filter(Boolean));
    const stageChanges = activities.filter(a => a.activity_type === 'stage_change').length;
    const comments = activities.filter(a => a.activity_type === 'note_added').length;
    return {
      total: activities.length,
      activeUsers: uniqueUsers.size,
      stageChanges,
      comments,
    };
  }, [activities]);

  // Daily volume chart data
  const dailyChartData = useMemo(() => {
    const map = new Map<string, number>();
    activities.forEach(a => {
      const day = format(new Date(a.created_at), 'dd/MM');
      map.set(day, (map.get(day) || 0) + 1);
    });
    const entries = Array.from(map.entries()).map(([name, total]) => ({ name, total }));
    return entries.reverse();
  }, [activities]);

  // Activity type distribution
  const typeChartData = useMemo(() => {
    const map = new Map<string, number>();
    activities.forEach(a => {
      const label = getActivityLabel(a.activity_type);
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [activities]);

  return (
    <div className="flex flex-col h-full">
      {/* Filters bar */}
      <div className="flex-shrink-0 flex flex-wrap items-center gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          Filtros:
        </div>

        {/* User filter */}
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className={cn('w-48 h-9', selectedUser !== 'all' && 'border-primary text-primary font-medium')}>
            <User className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Todos os usuários" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">Todos os usuários</SelectItem>
            {users.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Period filter */}
        <Select value={period} onValueChange={(v) => setPeriod(v as PeriodFilter)}>
          <SelectTrigger className={cn('w-48 h-9', period !== '7days' && 'border-primary text-primary font-medium')}>
            <CalendarIcon className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7days">Últimos 7 dias</SelectItem>
            <SelectItem value="30days">Últimos 30 dias</SelectItem>
            <SelectItem value="custom">Personalizado</SelectItem>
          </SelectContent>
        </Select>

        {/* Custom date pickers */}
        {period === 'custom' && (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {customFrom ? format(customFrom, 'dd/MM/yyyy') : 'Início'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customFrom}
                  onSelect={setCustomFrom}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <span className="text-muted-foreground text-sm">até</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {customTo ? format(customTo, 'dd/MM/yyyy') : 'Fim'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={customTo}
                  onSelect={setCustomTo}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        )}

        <div className="flex-1" />

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDashboard(!showDashboard)}
          className="gap-2 text-xs"
        >
          {showDashboard ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          {showDashboard ? 'Ocultar resumo' : 'Ver resumo'}
        </Button>

        <Badge variant="secondary" className="text-xs">
          {activities.length} atividade{activities.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Visual Dashboard */}
      {showDashboard && !loading && activities.length > 0 && (
        <div className="flex-shrink-0 mb-6 space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Activity className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{metrics.total}</p>
                  <p className="text-xs text-muted-foreground">Total de atividades</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Users className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{metrics.activeUsers}</p>
                  <p className="text-xs text-muted-foreground">Usuários ativos</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <ArrowRight className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{metrics.stageChanges}</p>
                  <p className="text-xs text-muted-foreground">Movimentações</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{metrics.comments}</p>
                  <p className="text-xs text-muted-foreground">Comentários</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bar chart - daily volume */}
            {dailyChartData.length > 1 && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Atividades por dia</p>
                  </div>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--popover))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: 'hsl(var(--popover-foreground))',
                          }}
                          formatter={(value: number) => [`${value} atividades`, 'Total']}
                        />
                        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Type breakdown - clear list */}
            {typeChartData.length > 0 && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-foreground">Tipos de atividade</p>
                  </div>
                  <div className="space-y-2">
                    {typeChartData.map((item, index) => {
                      const percentage = metrics.total > 0 ? ((item.value / metrics.total) * 100).toFixed(0) : '0';
                      const color = CHART_COLORS[index % CHART_COLORS.length];
                      return (
                        <div key={item.name} className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm text-foreground flex-1 truncate">{item.name}</span>
                          <span className="text-sm font-semibold text-foreground tabular-nums">{item.value}</span>
                          <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">{percentage}%</span>
                          <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${percentage}%`, backgroundColor: color }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Activity feed */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex gap-4 items-start p-3">
                <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <History className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma atividade encontrada</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Ajuste os filtros ou período para ver mais resultados
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {activities.map((activity) => {
              const iconConfig = activityIcons[activity.activity_type] || activityIcons.lead_updated;
              const Icon = iconConfig.icon;

              return (
                <div
                  key={activity.id}
                  className="flex gap-3 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {/* Icon */}
                  <div className={cn('flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center', iconConfig.color)}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-foreground">
                        {activity.performed_by_name || 'Sistema'}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {getActivityLabel(activity.activity_type)}
                      </Badge>
                      <span className="text-xs text-muted-foreground/70">
                        •
                      </span>
                      <span className="text-xs font-medium text-primary/80 truncate">
                        {activity.lead_name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {formatDescription(activity)}
                    </p>
                    <span className="text-xs text-muted-foreground/60 mt-0.5 block">
                      {format(new Date(activity.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      {' · '}
                      {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: ptBR })}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Load more */}
            {hasMore && (
              <div className="flex justify-center py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchActivities(activities.length)}
                  disabled={loadingMore}
                  className="gap-2"
                >
                  {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronDown className="h-4 w-4" />}
                  Carregar mais
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
