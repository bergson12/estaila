"use client";

/**
 * <Icon name="Sofa" /> — render a Lucide icon by string name.
 *
 * Tree-shakeable: only icons actually used in this file's REGISTRY are
 * included in the final bundle. Add new ones here as needed.
 */

import {
  Armchair,
  Baby,
  Bath,
  Bed,
  Briefcase,
  Building2,
  ChefHat,
  Circle,
  Factory,
  Flower2,
  Gem,
  Heart,
  Home,
  House,
  Laptop,
  Leaf,
  Monitor,
  Mountain,
  Palmtree,
  Smile,
  Sofa,
  Sparkles,
  Sunset,
  Trees,
  TrendingUp,
  Users,
  Utensils,
  Waves,
  type LucideIcon,
} from "lucide-react";

const REGISTRY: Record<string, LucideIcon> = {
  Armchair,
  Baby,
  Bath,
  Bed,
  Briefcase,
  Building2,
  ChefHat,
  Circle,
  Factory,
  Flower2,
  Gem,
  Heart,
  Home,
  House,
  Laptop,
  Leaf,
  Monitor,
  Mountain,
  Palmtree,
  Smile,
  Sofa,
  Sparkles,
  Sunset,
  Trees,
  TrendingUp,
  Users,
  Utensils,
  Waves,
};

export function Icon({
  name,
  className,
  strokeWidth = 1.75,
}: {
  name: string;
  className?: string;
  strokeWidth?: number;
}) {
  const Comp = REGISTRY[name] ?? Circle;
  return <Comp className={className} strokeWidth={strokeWidth} />;
}
