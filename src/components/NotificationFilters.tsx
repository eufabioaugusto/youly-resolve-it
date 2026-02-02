import { Button } from '@/components/ui/button';
import { 
  Bell, 
  Briefcase, 
  MessageSquare, 
  DollarSign, 
  Wallet 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type NotificationFilter = 'todos' | 'job' | 'negociacao' | 'pagamento' | 'saque' | 'sistema';

interface NotificationFiltersProps {
  activeFilter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  counts?: Record<NotificationFilter, number>;
}

const FILTERS: { value: NotificationFilter; label: string; icon: React.ElementType }[] = [
  { value: 'todos', label: 'Todas', icon: Bell },
  { value: 'job', label: 'Trabalhos', icon: Briefcase },
  { value: 'negociacao', label: 'Negociações', icon: MessageSquare },
  { value: 'pagamento', label: 'Pagamentos', icon: DollarSign },
  { value: 'saque', label: 'Saques', icon: Wallet },
  { value: 'sistema', label: 'Sistema', icon: Bell },
];

const NotificationFilters = ({ 
  activeFilter, 
  onFilterChange,
  counts 
}: NotificationFiltersProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {FILTERS.map(({ value, label, icon: Icon }) => {
        const count = counts?.[value] || 0;
        const isActive = activeFilter === value;
        
        return (
          <Button
            key={value}
            variant={isActive ? "default" : "outline"}
            size="sm"
            className={cn(
              "shrink-0 gap-2",
              isActive && "shadow-md"
            )}
            onClick={() => onFilterChange(value)}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            {count > 0 && value !== 'todos' && (
              <span className={cn(
                "text-xs px-1.5 py-0.5 rounded-full",
                isActive ? "bg-white/20" : "bg-primary/10 text-primary"
              )}>
                {count}
              </span>
            )}
          </Button>
        );
      })}
    </div>
  );
};

export default NotificationFilters;
