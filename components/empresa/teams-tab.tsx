"use client";

/**
 * Teams Tab — Microsoft Teams-style sub-team management.
 *
 * Layout:
 *  - Left rail: list of teams (icon + name + member count)
 *  - Right pane: selected team details (members + actions)
 *  - "+ Crear equipo" button (gated by plan)
 */

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  Briefcase,
  Crown,
  Edit3,
  Globe,
  Heart,
  Home,
  Lock,
  MapPin,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Star,
  Trash2,
  UserPlus,
  Users,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn, initials } from "@/lib/utils";
import { PLAN_MAX_TEAMS, type PlanKey } from "@/lib/billing-config";

// Icon registry — limited to known Lucide names
const TEAM_ICONS: Record<string, LucideIcon> = {
  Users,
  Home,
  Briefcase,
  Globe,
  MapPin,
  Heart,
  Sparkles,
  Star,
  Wrench,
  ShieldCheck,
};

const TEAM_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
  "#EC4899", "#06B6D4", "#84CC16", "#F97316", "#6366F1",
];

type MemberLite = {
  id: string;
  userId: string | null;
  invitedEmail: string | null;
  role: string;
  acceptedAt: string | null;
  user: { id: string; name: string; email: string; image: string | null } | null;
};

type TeamMemberRow = {
  memberId: string;
  role: string;
  member: MemberLite;
};

type TeamRow = {
  id: string;
  name: string;
  slug: string;
  color: string;
  icon: string;
  description: string | null;
  members: TeamMemberRow[];
};

export function TeamsTab({
  orgId,
  plan,
  teams,
  members,
  canEdit,
}: {
  orgId: string;
  plan: string;
  teams: TeamRow[];
  members: MemberLite[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(teams[0]?.id ?? null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!activeId && teams[0]) setActiveId(teams[0].id);
  }, [teams, activeId]);

  const maxTeams = PLAN_MAX_TEAMS[plan as PlanKey] ?? 0;
  const canCreate = canEdit && teams.length < maxTeams;
  const planUpgradeNeeded = maxTeams <= 1;

  const active = teams.find((t) => t.id === activeId) ?? null;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
      {/* === LEFT RAIL === */}
      <aside className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
              Equipos
            </p>
            <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
              {teams.length} / {maxTeams === 999 ? "∞" : maxTeams}
            </p>
          </div>
        </div>

        <div className="space-y-1">
          {teams.length === 0 && !creating && (
            <div className="rounded-xl border border-dashed border-border bg-card/40 p-4 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">
                Sin equipos creados
              </p>
            </div>
          )}

          <AnimatePresence>
            {teams.map((t) => {
              const Icon = TEAM_ICONS[t.icon] ?? Users;
              const isActive = activeId === t.id;
              return (
                <motion.button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveId(t.id)}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition-all",
                    isActive
                      ? "border-foreground/15 bg-card shadow-sm"
                      : "border-transparent bg-card/40 hover:bg-card"
                  )}
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-white shadow-sm"
                    style={{ backgroundColor: t.color }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{t.name}</p>
                    <p className="font-mono text-[10px] tabular-nums text-muted-foreground">
                      {t.members.length} {t.members.length === 1 ? "miembro" : "miembros"}
                    </p>
                  </div>
                  {isActive && (
                    <motion.span
                      layoutId="team-rail-indicator"
                      className="absolute inset-y-2 left-0 w-[3px] rounded-r-full bg-primary"
                    />
                  )}
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        {canCreate && !creating && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setCreating(true)}
            className="w-full justify-start border-dashed"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Crear equipo
          </Button>
        )}

        {!canCreate && canEdit && planUpgradeNeeded && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/[0.05] p-3 text-xs">
            <p className="font-medium text-amber-700 dark:text-amber-500">
              Sub-equipos en plan Business
            </p>
            <p className="mt-1 text-muted-foreground">
              Sube a Business o Agency para crear múltiples equipos.
            </p>
          </div>
        )}

        {!canCreate && !planUpgradeNeeded && canEdit && (
          <p className="px-2 text-[11px] text-muted-foreground">
            Has alcanzado el límite de {maxTeams} equipos de tu plan.
          </p>
        )}
      </aside>

      {/* === RIGHT PANE === */}
      <section className="min-w-0">
        <AnimatePresence mode="wait">
          {creating ? (
            <motion.div
              key="creating"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <TeamCreateForm
                orgId={orgId}
                onCreated={() => {
                  setCreating(false);
                  startTransition(() => router.refresh());
                }}
                onCancel={() => setCreating(false)}
              />
            </motion.div>
          ) : active ? (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
            >
              <TeamDetail
                team={active}
                orgMembers={members}
                canEdit={canEdit}
                onAfterChange={() => startTransition(() => router.refresh())}
                pending={pending}
                setPending={setPending}
              />
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/30 text-center"
            >
              <Users className="mb-3 h-10 w-10 text-muted-foreground/40" strokeWidth={1.5} />
              <p className="font-medium">Selecciona un equipo</p>
              <p className="mt-1 max-w-[40ch] text-xs text-muted-foreground">
                {canCreate
                  ? "O crea tu primer equipo para organizar a tu gente por zona, función o cliente."
                  : "Sube de plan para crear sub-equipos."}
              </p>
              {canCreate && (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCreating(true)}
                  className="mt-4"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Crear primer equipo
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}

// ============================================================
// TEAM CREATE FORM
// ============================================================

function TeamCreateForm({
  orgId,
  onCreated,
  onCancel,
}: {
  orgId: string;
  onCreated: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [icon, setIcon] = useState("Users");
  const [description, setDescription] = useState("");
  const [pending, setPending] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    setPending(true);
    try {
      const { createTeam } = await import("@/lib/actions/team");
      await createTeam(orgId, { name: name.trim(), color, icon, description });
      toast.success(`Equipo «${name}» creado`);
      onCreated();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-base font-semibold">
          <Plus className="h-4 w-4 text-primary" />
          Nuevo equipo
        </h3>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-lg text-white shadow-md"
            style={{ backgroundColor: color }}
          >
            {(() => {
              const Icon = TEAM_ICONS[icon] ?? Users;
              return <Icon className="h-5 w-5" strokeWidth={2} />;
            })()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">
              {name || "Nombre del equipo"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground">
              {description || "Descripción opcional"}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Nombre <span className="text-destructive">*</span>
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Equipo Norte"
            maxLength={60}
            autoFocus
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Descripción
          </label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="¿De qué se encarga este equipo?"
            maxLength={240}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Color
          </label>
          <div className="flex flex-wrap gap-1.5">
            {TEAM_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn(
                  "h-7 w-7 rounded-full transition-all hover:scale-110",
                  color === c &&
                    "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                )}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Ícono
          </label>
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
            {Object.entries(TEAM_ICONS).map(([key, Icon]) => {
              const active = icon === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIcon(key)}
                  className={cn(
                    "flex h-9 w-full items-center justify-center rounded-md border transition-colors",
                    active
                      ? "border-foreground/40 bg-foreground text-background"
                      : "border-border bg-card text-muted-foreground hover:text-foreground"
                  )}
                  title={key}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || pending}>
            <Plus className="mr-1.5 h-4 w-4" />
            Crear equipo
          </Button>
        </div>
      </div>
    </Card>
  );
}

// ============================================================
// TEAM DETAIL
// ============================================================

function TeamDetail({
  team,
  orgMembers,
  canEdit,
  onAfterChange,
  pending,
  setPending,
}: {
  team: TeamRow;
  orgMembers: MemberLite[];
  canEdit: boolean;
  onAfterChange: () => void;
  pending: boolean;
  setPending: (v: boolean) => void;
}) {
  const Icon = TEAM_ICONS[team.icon] ?? Users;

  const memberIds = useMemo(() => new Set(team.members.map((m) => m.memberId)), [
    team.members,
  ]);
  const available = orgMembers.filter(
    (m) => !memberIds.has(m.id) && m.acceptedAt
  );

  const [showAddMember, setShowAddMember] = useState(false);

  async function handleAdd(memberId: string, role: "MEMBER" | "LEAD") {
    setPending(true);
    try {
      const { addMemberToTeam } = await import("@/lib/actions/team");
      await addMemberToTeam({ teamId: team.id, memberId, role });
      toast.success("Miembro agregado");
      setShowAddMember(false);
      onAfterChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleRemove(memberId: string) {
    setPending(true);
    try {
      const { removeMemberFromTeam } = await import("@/lib/actions/team");
      await removeMemberFromTeam({ teamId: team.id, memberId });
      toast.success("Miembro removido del equipo");
      onAfterChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el equipo «${team.name}»? Los miembros se desasocian del equipo.`)) return;
    setPending(true);
    try {
      const { deleteTeam } = await import("@/lib/actions/team");
      await deleteTeam(team.id);
      toast.success("Equipo eliminado");
      onAfterChange();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header card */}
      <Card className="overflow-hidden p-0">
        <div
          className="h-24 bg-gradient-to-br"
          style={{
            backgroundImage: `linear-gradient(135deg, ${team.color}, ${team.color}aa)`,
          }}
        />
        <div className="relative px-6 pb-5">
          <div className="-mt-9 flex items-end justify-between gap-3">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-xl text-white shadow-lg ring-4 ring-background"
              style={{ backgroundColor: team.color }}
            >
              <Icon className="h-7 w-7" strokeWidth={2} />
            </div>
            {canEdit && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={pending}
                >
                  <Trash2 className="mr-1 h-3.5 w-3.5" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{team.name}</h2>
              <span className="font-mono text-[10px] text-muted-foreground">
                #{team.slug}
              </span>
            </div>
            {team.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {team.description}
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* Members */}
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold">
              <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
              Miembros
              <span className="font-mono text-[10px] text-muted-foreground">
                {team.members.length}
              </span>
            </h3>
          </div>
          {canEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowAddMember((v) => !v)}
              disabled={available.length === 0}
            >
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              {available.length === 0 ? "Sin más miembros" : "Agregar"}
            </Button>
          )}
        </div>

        {team.members.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sin miembros en este equipo.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {team.members.map((tm) => (
              <li
                key={tm.memberId}
                className="flex items-center gap-3 rounded-lg border border-border bg-card/40 p-2.5"
              >
                <Avatar className="h-8 w-8 ring-1 ring-border">
                  {tm.member.user?.image && (
                    <AvatarImage src={tm.member.user.image} alt={tm.member.user.name} />
                  )}
                  <AvatarFallback className="bg-muted text-[10px] font-semibold">
                    {tm.member.user ? initials(tm.member.user.name) : "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {tm.member.user?.name ?? tm.member.invitedEmail ?? "—"}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground">
                    {tm.member.user?.email ?? tm.member.invitedEmail}
                  </p>
                </div>
                {tm.role === "LEAD" && (
                  <Badge variant="outline" className="border-amber-500/40 text-[9px] text-amber-600">
                    <Crown className="mr-0.5 h-2.5 w-2.5" /> Lead
                  </Badge>
                )}
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRemove(tm.memberId)}
                    disabled={pending}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Add member picker */}
        <AnimatePresence>
          {showAddMember && available.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="rounded-lg border border-dashed border-border bg-card/30 p-3">
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Agregar al equipo
                </p>
                <ul className="space-y-1">
                  {available.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-center gap-3 rounded-md p-1.5 transition-colors hover:bg-card"
                    >
                      <Avatar className="h-7 w-7">
                        {m.user?.image && <AvatarImage src={m.user.image} alt={m.user.name} />}
                        <AvatarFallback className="bg-muted text-[9px] font-semibold">
                          {m.user ? initials(m.user.name) : "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {m.user?.name ?? m.invitedEmail}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-[11px]"
                        onClick={() => handleAdd(m.id, "MEMBER")}
                        disabled={pending}
                      >
                        Member
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px]"
                        onClick={() => handleAdd(m.id, "LEAD")}
                        disabled={pending}
                      >
                        <Crown className="mr-1 h-3 w-3" />
                        Lead
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </div>
  );
}
