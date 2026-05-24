import { Info, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getAppSettings } from "@/lib/app-settings";

const STYLES = {
  INFO: {
    bg: "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",
    icon: Info,
  },
  WARN: {
    bg: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
    icon: AlertTriangle,
  },
  SUCCESS: {
    bg: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    icon: CheckCircle2,
  },
};

export async function AnnouncementBanner() {
  const s = await getAppSettings();
  if (!s.bannerActive || !s.bannerMessage) return null;
  const cfg = STYLES[s.bannerType];
  const Icon = cfg.icon;
  return (
    <div
      className={`relative z-10 flex items-center gap-2 border-b px-4 py-2 text-sm ${cfg.bg}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <p className="flex-1 text-center text-xs font-medium md:text-sm">
        {s.bannerMessage}
      </p>
    </div>
  );
}
