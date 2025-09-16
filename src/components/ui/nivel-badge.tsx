import { Badge } from "@/components/ui/badge";
import { Crown, Star, Award, Medal, Trophy } from "lucide-react";

interface NivelBadgeProps {
  nivel: string;
  isPremium?: boolean;
  className?: string;
}

const nivelConfig = {
  Bronze: {
    color: "bg-amber-700 text-white",
    icon: Medal,
    label: "Bronze"
  },
  Silver: {
    color: "bg-gray-400 text-white",
    icon: Medal,
    label: "Silver"
  },
  Gold: {
    color: "bg-yellow-500 text-white",
    icon: Award,
    label: "Gold"
  },
  Platinum: {
    color: "bg-slate-600 text-white",
    icon: Star,
    label: "Platinum"
  },
  Hero: {
    color: "bg-gradient-to-r from-purple-600 to-pink-600 text-white",
    icon: Trophy,
    label: "Hero"
  }
};

export function NivelBadge({ nivel, isPremium, className = "" }: NivelBadgeProps) {
  const config = nivelConfig[nivel as keyof typeof nivelConfig] || nivelConfig.Bronze;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
      {isPremium && (
        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white flex items-center gap-1">
          <Crown className="w-3 h-3" />
          Premium
        </Badge>
      )}
    </div>
  );
}