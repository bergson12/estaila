"use client";

/**
 * Tag + SmartList Manager Dialog
 * CRUD tags y smart lists del usuario. Abre desde sidebar.
 */

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Tag as TagIcon,
  List,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CONTACT_TYPES, labelFor } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";

const TAG_COLORS = [
  "#EF4444", "#F97316", "#F59E0B", "#EAB308", "#84CC16",
  "#22C55E", "#10B981", "#14B8A6", "#06B6D4", "#0EA5E9",
  "#3B82F6", "#6366F1", "#8B5CF6", "#A855F7", "#D946EF",
  "#EC4899", "#F43F5E", "#64748B",
] as const;

type Tag = { id: string; name: string; color: string; count?: number };
type SmartList = {
  id: string;
  name: string;
  color: string;
  icon: string;
  filters: Record<string, unknown>;
  pinned: boolean;
};

export function TagListManagerDialog({
  open,
  onOpenChange,
  tags,
  smartLists,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  tags: Tag[];
  smartLists: SmartList[];
}) {
  const { t } = useT();
  const [activeTab, setActiveTab] = useState<"tags" | "lists">("tags");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        aria-describedby={undefined}
        className="sm:max-w-[560px] p-0 gap-0"
      >
        <DialogHeader className="border-b border-border px-5 py-4">
          <DialogTitle className="flex items-center gap-2 text-base">
            {t.contactos.managerTitle}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {t.contactos.managerSrDesc}
          </DialogDescription>
        </DialogHeader>

        {/* Tab toggle */}
        <div className="flex border-b border-border bg-card/30">
          <TabButton
            label={t.contactos.tags}
            count={tags.length}
            icon={TagIcon}
            active={activeTab === "tags"}
            onClick={() => setActiveTab("tags")}
          />
          <TabButton
            label={t.contactos.smartLists}
            count={smartLists.length}
            icon={List}
            active={activeTab === "lists"}
            onClick={() => setActiveTab("lists")}
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-5">
          {activeTab === "tags" ? (
            <TagsPanel tags={tags} />
          ) : (
            <SmartListsPanel smartLists={smartLists} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// TAB BUTTON
// ============================================================

function TabButton({
  label,
  count,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  count: number;
  icon: typeof TagIcon;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      {label}
      <span className="font-mono text-[10px] tabular-nums opacity-60">
        {count}
      </span>
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-[2px] bg-primary" />
      )}
    </button>
  );
}

// ============================================================
// TAGS PANEL
// ============================================================

function TagsPanel({ tags }: { tags: Tag[] }) {
  const router = useRouter();
  const { t } = useT();
  const [pending, startTransition] = useTransition();
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<string>(TAG_COLORS[10]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState<string>("");

  async function handleCreate() {
    if (!newName.trim()) return;
    try {
      const { createTag } = await import("@/lib/actions/contact-polish");
      await createTag({ name: newName.trim(), color: newColor });
      toast.success(`${t.contactos.toastTagCreatedPre} «${newName}» ${t.contactos.toastTagCreatedPost}`);
      setNewName("");
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(t.contactos.confirmDeleteTag.replace("{name}", name))) return;
    try {
      const { deleteTag } = await import("@/lib/actions/contact-polish");
      await deleteTag(id);
      toast.success(t.contactos.toastTagDeleted);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim()) return;
    try {
      const { createTag } = await import("@/lib/actions/contact-polish");
      // createTag uses upsert by name — easier path: delete + create with new name.
      // For simple color update keep same name (upsert).
      await createTag({ name: editName.trim(), color: editColor });
      toast.success(t.contactos.toastTagUpdated);
      setEditingId(null);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  function startEdit(t: Tag) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditColor(t.color);
  }

  return (
    <div className="space-y-4">
      {/* Create new */}
      <div className="rounded-xl border border-dashed border-border bg-card/40 p-3">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t.contactos.newTag}
        </p>
        <div className="flex items-center gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder={t.contactos.tagNamePlaceholder}
            className="flex-1 rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            maxLength={40}
          />
          <Button size="sm" onClick={handleCreate} disabled={!newName.trim() || pending}>
            <Plus className="mr-1 h-3 w-3" />
            {t.contactos.create}
          </Button>
        </div>
        <ColorPicker value={newColor} onChange={setNewColor} />
      </div>

      {/* Existing tags */}
      {tags.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t.contactos.tagsEmpty}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {tags.map((t) => {
            const isEditing = editingId === t.id;
            return (
              <li
                key={t.id}
                className={cn(
                  "rounded-lg border bg-card/40 p-2.5 transition-colors",
                  isEditing && "border-primary/40 bg-primary/[0.03]"
                )}
              >
                {isEditing ? (
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 shrink-0 rounded-full"
                        style={{ backgroundColor: editColor }}
                      />
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveEdit(t.id)}
                        className="flex-1 rounded-md border bg-background px-2.5 py-1 text-sm focus:border-primary focus:outline-none"
                        autoFocus
                      />
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-emerald-600" onClick={() => handleSaveEdit(t.id)}>
                        <Check className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <ColorPicker value={editColor} onChange={setEditColor} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
                      style={{
                        color: t.color,
                        borderColor: `${t.color}40`,
                        backgroundColor: `${t.color}10`,
                      }}
                    >
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </span>
                    {t.count !== undefined && (
                      <Badge variant="outline" className="text-[10px]">
                        {t.count}
                      </Badge>
                    )}
                    <span className="ml-auto flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(t)}>
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(t.id, t.name)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {TAG_COLORS.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          className={cn(
            "h-5 w-5 rounded-full transition-all hover:scale-110",
            value === c && "ring-2 ring-foreground ring-offset-2 ring-offset-background"
          )}
          style={{ backgroundColor: c }}
          aria-label={`Color ${c}`}
        />
      ))}
    </div>
  );
}

// ============================================================
// SMART LISTS PANEL
// ============================================================

function SmartListsPanel({ smartLists }: { smartLists: SmartList[] }) {
  const router = useRouter();
  const { t, locale } = useT();
  const [pending, startTransition] = useTransition();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(TAG_COLORS[10]);
  const [filterType, setFilterType] = useState<string>("");
  const [filterFavorite, setFilterFavorite] = useState(false);
  const [filterDays, setFilterDays] = useState<string>("");
  const [pinned, setPinned] = useState(false);

  async function handleCreate() {
    if (!name.trim()) return;
    try {
      const { createSmartList } = await import("@/lib/actions/contact-polish");
      const filters: Record<string, unknown> = {};
      if (filterType) filters.type = filterType;
      if (filterFavorite) filters.favorite = true;
      if (filterDays) filters.daysSinceContact = parseInt(filterDays, 10);
      await createSmartList({ name: name.trim(), color, filters, pinned });
      toast.success(`${t.contactos.toastListCreatedPre} «${name}» ${t.contactos.toastListCreatedPost}`);
      setCreating(false);
      setName("");
      setFilterType("");
      setFilterFavorite(false);
      setFilterDays("");
      setPinned(false);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function handleDelete(id: string, listName: string) {
    if (!confirm(t.contactos.confirmDeleteList.replace("{name}", listName))) return;
    try {
      const { deleteSmartList } = await import("@/lib/actions/contact-polish");
      await deleteSmartList(id);
      toast.success(t.contactos.toastListDeleted);
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function togglePin(id: string, current: boolean) {
    try {
      const { updateSmartList } = await import("@/lib/actions/contact-polish");
      await updateSmartList(id, { pinned: !current });
      startTransition(() => router.refresh());
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="space-y-4">
      {/* Create new */}
      {creating ? (
        <div className="rounded-xl border border-primary/30 bg-primary/[0.03] p-3 space-y-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
            {t.contactos.newSmartList}
          </p>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.contactos.listNamePlaceholder}
            className="w-full rounded-md border bg-background px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            maxLength={60}
            autoFocus
          />

          <div>
            <p className="mb-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {t.contactos.filters}
            </p>
            <div className="space-y-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs focus:border-primary focus:outline-none"
              >
                <option value="">{t.contactos.anyType}</option>
                {CONTACT_TYPES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {labelFor(CONTACT_TYPES, c.value, locale)}
                  </option>
                ))}
              </select>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={filterFavorite}
                  onChange={(e) => setFilterFavorite(e.target.checked)}
                  className="accent-primary"
                />
                {t.contactos.onlyFavorites}
              </label>

              <div className="flex items-center gap-2 text-xs">
                <span>{t.contactos.noContactFor}</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={filterDays}
                  onChange={(e) => setFilterDays(e.target.value)}
                  placeholder="N"
                  className="w-16 rounded-md border bg-background px-2 py-0.5 font-mono text-xs tabular-nums focus:border-primary focus:outline-none"
                />
                <span>{t.contactos.daysOptional}</span>
              </div>

              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="accent-primary"
                />
                {t.contactos.pinToSidebar}
              </label>
            </div>
          </div>

          <ColorPicker value={color} onChange={setColor} />

          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleCreate} disabled={!name.trim() || pending} className="flex-1">
              <Plus className="mr-1 h-3 w-3" /> {t.contactos.create}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
              {t.contactos.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          className="w-full border-dashed"
          onClick={() => setCreating(true)}
        >
          <Plus className="mr-1.5 h-3 w-3" />
          {t.contactos.createSmartList}
        </Button>
      )}

      {/* Existing lists */}
      {smartLists.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          {t.contactos.smartListsEmpty}
        </p>
      ) : (
        <ul className="space-y-1.5">
          {smartLists.map((sl) => (
            <li
              key={sl.id}
              className="flex items-center gap-2 rounded-lg border border-border bg-card/40 px-3 py-2.5"
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: sl.color }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{sl.name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {summarizeFilters(sl.filters, t, locale)}
                </p>
              </div>
              {sl.pinned && (
                <Badge variant="outline" className="text-[9px]">
                  {t.contactos.pinnedBadge}
                </Badge>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => togglePin(sl.id, sl.pinned)}
                title={sl.pinned ? t.contactos.unpin : t.contactos.pin}
              >
                {sl.pinned ? "📌" : "📍"}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(sl.id, sl.name)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function summarizeFilters(
  f: Record<string, unknown>,
  t: ReturnType<typeof useT>["t"],
  locale: "es" | "en"
): string {
  const parts: string[] = [];
  if (f.type) parts.push(`${t.contactos.type}: ${labelFor(CONTACT_TYPES, String(f.type), locale)}`);
  if (f.favorite) parts.push(t.contactos.favorites);
  if (f.tagIds && Array.isArray(f.tagIds) && f.tagIds.length)
    parts.push(`${f.tagIds.length} tag${f.tagIds.length > 1 ? "s" : ""}`);
  if (f.daysSinceContact)
    parts.push(`+${f.daysSinceContact}d ${t.contactos.filterNoContactSuffix}`);
  return parts.length > 0 ? parts.join(" · ") : t.contactos.filterNone;
}

// ============================================================
// URL-aware wrapper: open from ?manage=tags
// ============================================================

export function TagListManagerUrlGate({
  tags,
  smartLists,
}: {
  tags: Tag[];
  smartLists: SmartList[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const manage = sp.get("manage");
  const open = manage === "tags" || manage === "lists";

  function handleOpenChange(v: boolean) {
    if (!v) {
      const params = new URLSearchParams(sp);
      params.delete("manage");
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname);
    }
  }

  // Hydration guard
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return (
    <TagListManagerDialog
      open={open}
      onOpenChange={handleOpenChange}
      tags={tags}
      smartLists={smartLists}
    />
  );
}
