"use client";

import {
  Plus,
  Search,
  Star,
  X,
  LayoutGrid,
  KeyRound,
  UserCheck,
  Users,
  Scale,
  Handshake,
  Wrench,
  Zap,
  HardHat,
  Briefcase,
  Plug,
  Filter,
  Download,
  Columns3,
  Phone,
  Mail,
  MessageCircle,
  MoreHorizontal,
  ArrowUpDown,
  Pencil,
  Trash2,
  ExternalLink,
  type LucideIcon,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  ContactDialog,
  type ContactDialogValue,
} from "./contact-dialog";
import { WhatsAppDialog } from "./whatsapp-dialog";
import { DuplicatesBanner } from "./duplicates-banner";
import { TagListManagerUrlGate } from "./tag-list-manager";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/shared/empty-state";
import { cn, initials } from "@/lib/utils";
import { CONTACT_TYPES, labelFor } from "@/lib/constants";
import { useT } from "@/lib/i18n/provider";
import {
  deleteContact,
  toggleContactFavorite,
} from "@/lib/actions/contact";

const TYPE_ICONS: Record<string, LucideIcon> = {
  PROPIETARIO: KeyRound,
  CLIENTE: UserCheck,
  INQUILINO: Users,
  ABOGADO: Scale,
  COLEGA_INMOBILIARIO: Handshake,
  PLOMERO: Wrench,
  ELECTRICISTA: Zap,
  CONTRATISTA: HardHat,
  EMPRESA: Briefcase,
  UTILITY: Plug,
};

const TYPE_COLOR: Record<string, string> = {
  PROPIETARIO:
    "bg-emerald-500/15 text-emerald-500 ring-emerald-500/30",
  CLIENTE: "bg-blue-500/15 text-blue-500 ring-blue-500/30",
  INQUILINO: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
  ABOGADO: "bg-violet-500/15 text-violet-500 ring-violet-500/30",
  COLEGA_INMOBILIARIO: "bg-cyan-500/15 text-cyan-500 ring-cyan-500/30",
  PLOMERO: "bg-stone-500/15 text-stone-400 ring-stone-500/30",
  ELECTRICISTA: "bg-amber-500/15 text-amber-500 ring-amber-500/30",
  CONTRATISTA: "bg-orange-500/15 text-orange-500 ring-orange-500/30",
  EMPRESA: "bg-indigo-500/15 text-indigo-500 ring-indigo-500/30",
  UTILITY: "bg-slate-500/15 text-slate-400 ring-slate-500/30",
};

type ContactTagLite = { id: string; name: string; color: string; icon: string | null };

type Contact = {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  location: string | null;
  rnc: string | null;
  reference: string | null;
  notes: string | null;
  favorite: boolean;
  ratings: string;
  profession: string;
  updatedAt?: Date | string | null;
  lastContactedAt?: Date | string | null;
  tags?: ContactTagLite[];
};

type Owner = {
  name: string;
  image: string | null;
};

type Tag = { id: string; name: string; color: string; icon: string | null; count: number };
type SmartList = {
  id: string;
  name: string;
  icon: string;
  color: string;
  filters: Record<string, unknown>;
  pinned: boolean;
};

export function ContactsClient({
  contacts,
  counts,
  owner,
  tags = [],
  smartLists = [],
}: {
  contacts: Contact[];
  counts: { total: number; favs: number; byType: Record<string, number>; stale60?: number };
  owner: Owner;
  tags?: Tag[];
  smartLists?: SmartList[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const { t, locale } = useT();
  const [, startTransition] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ContactDialogValue | undefined>();
  const [sortKey, setSortKey] = useState<"name" | "type" | "updatedAt">(
    "updatedAt"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Column visibility (persisted)
  type ColKey = "datos" | "tipo" | "ubicacion" | "asignado";
  const ALL_COLS: { key: ColKey; label: string }[] = [
    { key: "datos", label: t.contactos.colDataLong },
    { key: "tipo", label: t.contactos.colType },
    { key: "ubicacion", label: t.contactos.colLocationRef },
    { key: "asignado", label: t.contactos.colAssignedTo },
  ];
  const [cols, setCols] = useState<Record<ColKey, boolean>>({
    datos: true,
    tipo: true,
    ubicacion: true,
    asignado: true,
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("contacts:cols");
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Record<ColKey, boolean>>;
        setCols((c) => ({ ...c, ...parsed }));
      }
    } catch {}
  }, []);
  function toggleCol(key: ColKey, v: boolean) {
    setCols((c) => {
      const next = { ...c, [key]: v };
      try {
        localStorage.setItem("contacts:cols", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const q = sp.get("q") ?? "";
  const type = sp.get("type") ?? "";
  const favs = sp.get("favs") === "1";
  const [search, setSearch] = useState(q);

  useEffect(() => {
    const newQ = sp.get("new");
    const editId = sp.get("edit");
    if (newQ === "1") {
      setEditing(undefined);
      setDialogOpen(true);
    } else if (editId) {
      const c = contacts.find((x) => x.id === editId);
      if (c) {
        setEditing(c);
        setDialogOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search === q) return;
      const params = new URLSearchParams(sp);
      if (search) params.set("q", search);
      else params.delete("q");
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(sp);
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function openCreate() {
    setEditing(undefined);
    setDialogOpen(true);
  }

  function openEdit(id: string) {
    const c = contacts.find((x) => x.id === id);
    if (!c) return;
    setEditing(c);
    setDialogOpen(true);
  }

  function handleDialogChange(open: boolean) {
    setDialogOpen(open);
    if (!open) {
      const params = new URLSearchParams(sp);
      params.delete("new");
      params.delete("edit");
      const s = params.toString();
      router.replace(`${pathname}${s ? "?" + s : ""}`);
    }
  }

  // Sort
  // Smart list / tag filter (URL params)
  const activeListId = sp.get("list") ?? "";
  const activeTagId = sp.get("tag") ?? "";

  const visible = useMemo(() => {
    let arr = contacts;
    if (activeListId) {
      if (activeListId === "favorites") arr = arr.filter((c) => c.favorite);
      else if (activeListId === "stale60") {
        const cutoff = Date.now() - 60 * 24 * 60 * 60 * 1000;
        arr = arr.filter(
          (c) =>
            !c.lastContactedAt ||
            new Date(c.lastContactedAt).getTime() < cutoff
        );
      } else if (activeListId.startsWith("type:")) {
        arr = arr.filter((c) => c.type === activeListId.slice(5));
      } else {
        const sl = smartLists.find((s) => s.id === activeListId);
        if (sl?.filters) {
          const f = sl.filters as {
            type?: string;
            tagIds?: string[];
            favorite?: boolean;
            daysSinceContact?: number;
          };
          if (f.type) arr = arr.filter((c) => c.type === f.type);
          if (f.favorite) arr = arr.filter((c) => c.favorite);
          if (f.tagIds?.length)
            arr = arr.filter((c) => c.tags?.some((t) => f.tagIds!.includes(t.id)));
          if (f.daysSinceContact) {
            const cutoff = Date.now() - f.daysSinceContact * 24 * 60 * 60 * 1000;
            arr = arr.filter(
              (c) => !c.lastContactedAt || new Date(c.lastContactedAt).getTime() < cutoff
            );
          }
        }
      }
    }
    if (activeTagId) {
      arr = arr.filter((c) => c.tags?.some((t) => t.id === activeTagId));
    }
    return arr;
  }, [contacts, activeListId, activeTagId, smartLists]);

  const sorted = useMemo(() => {
    const arr = [...visible];
    arr.sort((a, b) => {
      const fav = (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0);
      if (fav !== 0) return fav;
      let av: string | number = "";
      let bv: string | number = "";
      if (sortKey === "name") {
        av = a.name;
        bv = b.name;
      } else if (sortKey === "type") {
        av = a.type;
        bv = b.type;
      } else if (sortKey === "updatedAt") {
        av = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        bv = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [visible, sortKey, sortDir]);

  function toggleSort(key: typeof sortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === sorted.length) setSelected(new Set());
    else setSelected(new Set(sorted.map((c) => c.id)));
  }

  const hasFilters = !!(q || type || favs);

  // CSV export (visible rows + visible columns)
  function handleExport() {
    const cells = (c: Contact) => {
      const row: string[] = [c.name];
      if (cols.datos) row.push(c.email ?? "", c.phone ?? "", c.whatsapp ?? "");
      if (cols.tipo) row.push(labelFor(CONTACT_TYPES, c.type, locale));
      if (cols.ubicacion) row.push(c.location ?? "", c.reference ?? "");
      if (cols.asignado) row.push(owner.name);
      return row;
    };
    const headers: string[] = [t.contactos.csvName];
    if (cols.datos) headers.push(t.contactos.csvEmail, t.contactos.csvPhone, t.contactos.csvWhatsapp);
    if (cols.tipo) headers.push(t.contactos.csvType);
    if (cols.ubicacion) headers.push(t.contactos.csvLocation, t.contactos.csvReference);
    if (cols.asignado) headers.push(t.contactos.csvAssignedTo);

    const esc = (v: string) =>
      /[",\n;]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
    const csv = [headers, ...sorted.map(cells)]
      .map((r) => r.map((v) => esc(v ?? "")).join(","))
      .join("\n");

    const blob = new Blob(["﻿" + csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contactos-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`${sorted.length} ${t.contactos.toastExported}`);
  }

  function setListParam(id: string) {
    const params = new URLSearchParams(sp);
    if (id) params.set("list", id);
    else params.delete("list");
    params.delete("tag"); // clear tag when switching list
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }
  function setTagParam(id: string) {
    const params = new URLSearchParams(sp);
    if (id) params.set("tag", id);
    else params.delete("tag");
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <>
      {/* Quick filter pills — horizontal command bar */}
      <QuickFilterBar
        tags={tags}
        smartLists={smartLists}
        activeListId={activeListId}
        activeTagId={activeTagId}
        counts={counts}
        onSelectList={setListParam}
        onSelectTag={setTagParam}
      />

      {/* Filters bar */}
      <div className="mb-4 flex flex-col gap-2 rounded-xl border border-border bg-card/40 p-3 backdrop-blur-md sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full sm:max-w-md sm:flex-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.contactos.searchPlaceholder}
            className="h-9 pl-9"
          />
          {search && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearch("")}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              {t.contactos.type}
              {type && (
                <span className="ml-1.5 inline-flex h-4 items-center rounded-full bg-primary/15 px-1.5 text-[10px] text-primary">
                  {labelFor(CONTACT_TYPES, type, locale)}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => setParam("type", "")}>
              <LayoutGrid className="mr-2 h-3.5 w-3.5" />
              {t.contactos.all}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {CONTACT_TYPES.map((c) => {
              const Icon = TYPE_ICONS[c.value];
              const n = counts.byType[c.value] ?? 0;
              return (
                <DropdownMenuItem
                  key={c.value}
                  onClick={() => setParam("type", c.value)}
                >
                  {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                  {labelFor(CONTACT_TYPES, c.value, locale)}
                  <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
                    {n}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant={favs ? "default" : "outline"}
          size="sm"
          onClick={() => setParam("favs", favs ? "" : "1")}
          className={cn(
            favs && "bg-amber-500 text-white hover:bg-amber-500/90"
          )}
        >
          <Star
            className={cn("mr-1.5 h-3.5 w-3.5", favs && "fill-current")}
          />
          {t.contactos.favorites}
          <span
            className={cn(
              "ml-1.5 font-mono text-[10px] tabular-nums",
              favs ? "text-white/80" : "text-muted-foreground"
            )}
          >
            {counts.favs}
          </span>
        </Button>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={() => {
              setSearch("");
              startTransition(() => router.push(pathname));
            }}
          >
            {t.contactos.clear}
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden sm:inline-flex"
              >
                <Columns3 className="mr-1.5 h-3.5 w-3.5" />
                {t.contactos.columns}
                <span className="ml-1.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                  {Object.values(cols).filter(Boolean).length}/{ALL_COLS.length}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.contactos.showColumns}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {ALL_COLS.map((c) => (
                <DropdownMenuCheckboxItem
                  key={c.key}
                  checked={cols[c.key]}
                  onCheckedChange={(v) => toggleCol(c.key, !!v)}
                  onSelect={(e) => e.preventDefault()}
                >
                  {c.label}
                </DropdownMenuCheckboxItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() =>
                  setCols({ datos: true, tipo: true, ubicacion: true, asignado: true })
                }
              >
                {t.contactos.showAllColumns}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
            onClick={handleExport}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            {t.contactos.export}
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t.contactos.newContact}
          </Button>
        </div>
      </div>

      {/* Duplicates banner — lazy fetch on mount */}
      <DuplicatesBanner />

      {/* Result count */}
      <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
        <p>
          {t.contactos.showing}{" "}
          <span className="font-mono font-semibold text-foreground tabular-nums">
            {sorted.length}
          </span>{" "}
          {t.contactos.of}{" "}
          <span className="font-mono font-semibold text-foreground tabular-nums">
            {counts.total}
          </span>{" "}
          {t.contactos.contactsWord}
        </p>
        {selected.size > 0 && (
          <span className="rounded-md bg-primary/15 px-2 py-0.5 font-mono text-[11px] tabular-nums text-primary">
            {selected.size} {t.contactos.selected}
          </span>
        )}
      </div>

      {sorted.length === 0 ? (
        counts.total === 0 ? (
          <EmptyState
            icon={Users}
            title={t.contactos.emptyTitle}
            description={t.contactos.emptyDescription}
            action={
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t.contactos.createFirst}
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title={t.contactos.noResultsTitle}
            description={t.contactos.noResultsDescription}
          />
        )
      ) : (
        <>
        {/* Mobile cards (sm- only) */}
        <div className="space-y-2 md:hidden">
          {sorted.map((c, i) => (
            <ContactMobileCard
              key={c.id}
              contact={c}
              index={i}
              owner={owner}
            />
          ))}
        </div>

        {/* Desktop table (md+) */}
        <Card className="hidden overflow-hidden p-0 md:block">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-card/60">
                  <th className="w-10 px-3 py-3">
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 cursor-pointer accent-primary"
                      checked={
                        selected.size > 0 && selected.size === sorted.length
                      }
                      onChange={toggleAll}
                    />
                  </th>
                  <ThSortable
                    label={t.contactos.thContact}
                    active={sortKey === "name"}
                    dir={sortDir}
                    onClick={() => toggleSort("name")}
                  />
                  {cols.datos && (
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.contactos.thData}
                    </th>
                  )}
                  {cols.tipo && (
                    <ThSortable
                      label={t.contactos.thType}
                      active={sortKey === "type"}
                      dir={sortDir}
                      onClick={() => toggleSort("type")}
                    />
                  )}
                  {cols.ubicacion && (
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.contactos.thLocationRef}
                    </th>
                  )}
                  {cols.asignado && (
                    <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.contactos.thAssignedTo}
                    </th>
                  )}
                  <th className="w-12 px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {sorted.map((c, i) => (
                    <ContactRow
                      key={c.id}
                      contact={c}
                      index={i}
                      owner={owner}
                      cols={cols}
                      isSelected={selected.has(c.id)}
                      onToggleSelect={() => toggleSelect(c.id)}
                      onEdit={() => openEdit(c.id)}
                    />
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </Card>
        </>
      )}

      {/* Bulk actions bar */}
      <BulkActionBar
        selected={selected}
        contacts={contacts}
        tags={tags}
        onClear={() => setSelected(new Set())}
        onAfterAction={() => {
          setSelected(new Set());
          router.refresh();
        }}
      />

      <ContactDialog
        open={dialogOpen}
        onOpenChange={handleDialogChange}
        initial={editing}
      />

      {/* Tag + SmartList manager — opens via ?manage=tags */}
      <TagListManagerUrlGate tags={tags} smartLists={smartLists} />
    </>
  );
}

function ThSortable({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th
      onClick={onClick}
      className="cursor-pointer px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <ArrowUpDown
          className={cn(
            "h-3 w-3 transition-opacity",
            active ? "opacity-100 text-primary" : "opacity-40"
          )}
        />
      </span>
    </th>
  );
}

function ContactRow({
  contact: c,
  index,
  owner,
  cols,
  isSelected,
  onToggleSelect,
  onEdit,
}: {
  contact: Contact;
  index: number;
  owner: Owner;
  cols: { datos: boolean; tipo: boolean; ubicacion: boolean; asignado: boolean };
  isSelected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const [, startTransition] = useTransition();

  const Icon = TYPE_ICONS[c.type];
  const lastActivity = c.updatedAt
    ? formatDistanceToNow(new Date(c.updatedAt), {
        addSuffix: true,
        locale: locale === "en" ? undefined : es,
      })
    : null;

  const [waOpen, setWaOpen] = useState(false);

  function handleToggleFav() {
    startTransition(async () => {
      try {
        await toggleContactFavorite(c.id);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function handleDelete() {
    if (!confirm(t.contactos.confirmDeleteContact.replace("{name}", c.name))) return;
    startTransition(async () => {
      try {
        await deleteContact(c.id);
        toast.success(t.contactos.toastDeleted);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.25,
        delay: Math.min(index, 12) * 0.02,
      }}
      className={cn(
        "group border-b border-border last:border-0 transition-colors hover:bg-card/60",
        isSelected && "bg-primary/5"
      )}
    >
      <td className="px-3 py-3 align-middle">
        <input
          type="checkbox"
          className="h-3.5 w-3.5 cursor-pointer accent-primary"
          checked={isSelected}
          onChange={onToggleSelect}
        />
      </td>
      <td className="px-4 py-3">
        <Link
          href={`/contactos/${c.id}`}
          className="flex items-center gap-3 group/name"
        >
          <Avatar className="h-9 w-9 ring-1 ring-border">
            <AvatarFallback className="bg-muted text-[11px] font-semibold">
              {initials(c.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold group-hover/name:text-primary transition-colors">
                {c.name}
              </p>
              {c.favorite && (
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              )}
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              {lastActivity && (
                <span className="text-[11px] text-muted-foreground">
                  {lastActivity}
                </span>
              )}
              {c.tags && c.tags.length > 0 && (
                <>
                  {c.tags.slice(0, 3).map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[9px] font-medium"
                      style={{
                        color: t.color,
                        borderColor: `${t.color}40`,
                        backgroundColor: `${t.color}10`,
                      }}
                    >
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: t.color }}
                      />
                      {t.name}
                    </span>
                  ))}
                  {c.tags.length > 3 && (
                    <span className="text-[10px] text-muted-foreground">
                      +{c.tags.length - 3}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        </Link>
      </td>
      {cols.datos && (
        <td className="px-4 py-3">
          <div className="space-y-1">
            {c.email && (
              <p className="flex items-center gap-1.5 text-xs">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{c.email}</span>
              </p>
            )}
            {c.phone && (
              <p className="flex items-center gap-1.5 font-mono text-xs tabular-nums text-muted-foreground">
                <Phone className="h-3 w-3" />
                {c.phone}
              </p>
            )}
          </div>
        </td>
      )}
      {cols.tipo && (
        <td className="px-4 py-3">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ring-1",
              TYPE_COLOR[c.type] ?? "bg-muted text-muted-foreground ring-border"
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {labelFor(CONTACT_TYPES, c.type, locale)}
          </span>
        </td>
      )}
      {cols.ubicacion && (
        <td className="px-4 py-3 text-xs text-muted-foreground">
          <div>{c.location ?? "—"}</div>
          {c.reference && (
            <div className="mt-0.5 text-[11px] italic">
              {t.contactos.viaPrefix} {c.reference}
            </div>
          )}
        </td>
      )}
      {cols.asignado && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6 ring-1 ring-border">
              <AvatarFallback className="bg-muted text-[9px] font-semibold">
                {initials(owner.name)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-xs">{owner.name}</span>
          </div>
        </td>
      )}
      <td className="px-2 py-3 text-right">
        <div className="flex items-center justify-end gap-0.5">
          {/* Click-to-call — auto-log */}
          {c.phone && (
            <a
              href={`tel:${c.phone.replace(/\D/g, "")}`}
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  const { logCall } = await import("@/lib/actions/contact-polish");
                  await logCall({ contactId: c.id });
                } catch {
                  // silent
                }
              }}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-600 transition-colors hover:bg-blue-500/20"
              title={`${t.contactos.callAction} ${c.phone}`}
            >
              <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
            </a>
          )}
          {/* WhatsApp — always visible (no hover gate) */}
          {(c.whatsapp || c.phone) && (
            <Button
              variant="outline"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setWaOpen(true);
              }}
              className="h-7 w-7 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 hover:text-emerald-600"
              title={`${t.contactos.whatsappAction} ${c.name}`}
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
            </Button>
          )}
          {/* Favorite — always visible */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7",
              c.favorite ? "text-amber-400" : "text-muted-foreground/60 hover:text-amber-400"
            )}
            onClick={handleToggleFav}
            title={t.contactos.favorite}
          >
            <Star className={cn("h-3.5 w-3.5", c.favorite && "fill-amber-400")} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/contactos/${c.id}`}>
                  <ExternalLink className="mr-2 h-3.5 w-3.5" />
                  {t.contactos.viewDetail}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-2 h-3.5 w-3.5" />
                {t.contactos.edit}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                {t.contactos.delete}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>

      {/* WhatsApp composer dialog */}
      <WhatsAppDialog
        open={waOpen}
        onOpenChange={setWaOpen}
        contactId={c.id}
        contact={{ name: c.name, whatsapp: c.whatsapp, phone: c.phone }}
        agentName={owner.name}
      />
    </motion.tr>
  );
}

// ============================================================
// MOBILE CARD VIEW (< md)
// ============================================================

function ContactMobileCard({
  contact: c,
  owner,
}: {
  contact: Contact;
  index: number;
  owner: Owner;
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const [waOpen, setWaOpen] = useState(false);
  const Icon = TYPE_ICONS[c.type];
  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => router.push(`/contactos/${c.id}`)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            router.push(`/contactos/${c.id}`);
          }
        }}
        className="block cursor-pointer rounded-xl border border-border bg-card p-3 transition-colors hover:bg-card/80 active:scale-[0.99]"
      >
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-1 ring-border">
            <AvatarFallback className="bg-muted text-xs font-semibold">
              {initials(c.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-semibold">{c.name}</p>
              {c.favorite && (
                <Star className="h-3 w-3 shrink-0 fill-amber-400 text-amber-400" />
              )}
            </div>
            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
              {Icon && <Icon className="h-2.5 w-2.5" />}
              {labelFor(CONTACT_TYPES, c.type, locale)}
              {c.location && (
                <>
                  <span>·</span>
                  <span className="normal-case tracking-normal">{c.location}</span>
                </>
              )}
            </p>
            {(c.email || c.phone) && (
              <div className="mt-2 space-y-0.5">
                {c.email && (
                  <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                    <Mail className="h-2.5 w-2.5 shrink-0" />
                    {c.email}
                  </p>
                )}
                {c.phone && (
                  <p className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                    <Phone className="h-2.5 w-2.5" />
                    {c.phone}
                  </p>
                )}
              </div>
            )}
            {c.tags && c.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.tags.slice(0, 3).map((t) => (
                  <span
                    key={t.id}
                    className="inline-flex items-center gap-1 rounded-full border px-1.5 py-0 text-[9px] font-medium"
                    style={{
                      color: t.color,
                      borderColor: `${t.color}40`,
                      backgroundColor: `${t.color}10`,
                    }}
                  >
                    <span
                      className="h-1 w-1 rounded-full"
                      style={{ backgroundColor: t.color }}
                    />
                    {t.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-1">
            {(c.whatsapp || c.phone) && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setWaOpen(true);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 active:bg-emerald-500/20"
                aria-label={t.contactos.whatsapp}
              >
                <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
              </button>
            )}
            {c.phone && (
              <a
                href={`tel:${c.phone.replace(/\D/g, "")}`}
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-blue-500/30 bg-blue-500/10 text-blue-600 active:bg-blue-500/20"
                aria-label={t.contactos.call}
              >
                <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
              </a>
            )}
          </div>
        </div>
      </div>
      <WhatsAppDialog
        open={waOpen}
        onOpenChange={setWaOpen}
        contactId={c.id}
        contact={{ name: c.name, whatsapp: c.whatsapp, phone: c.phone }}
        agentName={owner.name}
      />
    </>
  );
}

// ============================================================
// SMART LIST SIDEBAR
// ============================================================

function QuickFilterBar({
  tags,
  smartLists,
  activeListId,
  activeTagId,
  counts,
  onSelectList,
  onSelectTag,
}: {
  tags: Tag[];
  smartLists: SmartList[];
  activeListId: string;
  activeTagId: string;
  counts: { total: number; favs: number; byType: Record<string, number>; stale60?: number };
  onSelectList: (id: string) => void;
  onSelectTag: (id: string) => void;
}) {
  const router = useRouter();
  const { t, locale } = useT();
  const pinnedLists = smartLists.filter((s) => s.pinned);
  const otherLists = smartLists.filter((s) => !s.pinned);

  return (
    <div className="mb-3 -mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div className="flex items-center gap-1 whitespace-nowrap pb-1">
        <Pill
          label={t.contactos.all}
          count={counts.total}
          active={!activeListId}
          onClick={() => onSelectList("")}
        />
        <Pill
          label={t.contactos.favorites}
          count={counts.favs}
          icon={Star}
          active={activeListId === "favorites"}
          onClick={() => onSelectList("favorites")}
          color="amber"
        />
        <Pill
          label={t.contactos.stale60}
          count={counts.stale60 ?? 0}
          active={activeListId === "stale60"}
          onClick={() => onSelectList("stale60")}
          color="rose"
        />

        {pinnedLists.length > 0 && <Divider />}

        {pinnedLists.map((sl) => (
          <Pill
            key={sl.id}
            label={sl.name}
            active={activeListId === sl.id}
            onClick={() => onSelectList(sl.id)}
            dotColor={sl.color}
          />
        ))}

        <Divider />

        {/* "Más" dropdown — types + non-pinned lists */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-border bg-transparent px-3 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
            >
              <Filter className="h-3 w-3" strokeWidth={1.75} />
              {t.contactos.more}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t.contactos.byType}
            </DropdownMenuLabel>
            {CONTACT_TYPES.slice(0, 8).map((c) => {
              const n = counts.byType[c.value] ?? 0;
              if (n === 0) return null;
              const Icon = TYPE_ICONS[c.value];
              return (
                <DropdownMenuItem
                  key={c.value}
                  onClick={() => onSelectList(`type:${c.value}`)}
                >
                  {Icon && <Icon className="mr-2 h-3.5 w-3.5" />}
                  {labelFor(CONTACT_TYPES, c.value, locale)}
                  <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
                    {n}
                  </span>
                </DropdownMenuItem>
              );
            })}
            {otherLists.length > 0 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t.contactos.myLists}
                </DropdownMenuLabel>
                {otherLists.map((sl) => (
                  <DropdownMenuItem key={sl.id} onClick={() => onSelectList(sl.id)}>
                    <span
                      className="mr-2 h-2 w-2 rounded-full"
                      style={{ backgroundColor: sl.color }}
                    />
                    {sl.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/contactos?manage=tags")}>
              <Plus className="mr-2 h-3.5 w-3.5" />
              {t.contactos.manageListsTags}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Tags dropdown */}
        {tags.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
                  activeTagId
                    ? "border-transparent text-white"
                    : "border-border bg-card text-muted-foreground hover:text-foreground"
                )}
                style={
                  activeTagId
                    ? {
                        backgroundColor:
                          tags.find((tag) => tag.id === activeTagId)?.color ?? undefined,
                      }
                    : undefined
                }
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: activeTagId
                      ? "white"
                      : tags[0]?.color ?? "currentColor",
                  }}
                />
                {activeTagId
                  ? tags.find((tag) => tag.id === activeTagId)?.name ?? t.contactos.tag
                  : t.contactos.tags}
                {activeTagId && (
                  <X
                    className="ml-0.5 h-3 w-3 opacity-80 hover:opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTag("");
                    }}
                  />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 max-h-[300px] overflow-y-auto">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {t.contactos.filterByTag}
              </DropdownMenuLabel>
              {tags.map((tag) => (
                <DropdownMenuItem
                  key={tag.id}
                  onClick={() => onSelectTag(tag.id === activeTagId ? "" : tag.id)}
                >
                  <span
                    className="mr-2 h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.name}
                  <span className="ml-auto font-mono text-[10px] tabular-nums text-muted-foreground">
                    {tag.count}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/contactos?manage=tags")}>
                <Plus className="mr-2 h-3.5 w-3.5" />
                {t.contactos.manageTags}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

function Pill({
  label,
  count,
  active,
  onClick,
  icon: Icon,
  color = "default",
  dotColor,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  color?: "default" | "amber" | "rose";
  dotColor?: string;
}) {
  const activeColor = {
    default: "bg-foreground text-background",
    amber: "bg-amber-500 text-white",
    rose: "bg-rose-500 text-white",
  }[color];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium transition-all",
        active
          ? `border-transparent ${activeColor}`
          : "border-border bg-card text-muted-foreground hover:text-foreground"
      )}
    >
      {dotColor && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: active ? "white" : dotColor }}
        />
      )}
      {Icon && <Icon className="h-3 w-3" strokeWidth={2} />}
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "font-mono tabular-nums",
            active ? "opacity-80" : "opacity-60"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-4 w-px shrink-0 bg-border" aria-hidden />;
}

// Keep old sidebar export for reference (unused)
function SmartListSidebar({
  tags,
  smartLists,
  activeListId,
  activeTagId,
  counts,
  onSelectList,
  onSelectTag,
}: {
  tags: Tag[];
  smartLists: SmartList[];
  activeListId: string;
  activeTagId: string;
  counts: { total: number; favs: number; byType: Record<string, number>; stale60?: number };
  onSelectList: (id: string) => void;
  onSelectTag: (id: string) => void;
}) {
  const router = useRouter();

  // Section collapsed state — persist in localStorage
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    types: false,
    lists: false,
    tags: false,
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem("contacts:sidebar:collapsed");
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {}
  }, []);
  function toggle(key: string) {
    setCollapsed((c) => {
      const next = { ...c, [key]: !c[key] };
      try {
        localStorage.setItem("contacts:sidebar:collapsed", JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  return (
    <aside className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:w-56 lg:shrink-0 lg:overflow-y-auto">
      <div className="space-y-0.5 rounded-xl border border-border bg-card/40 p-1.5 backdrop-blur-md">
        {/* Pinned — always visible, no header */}
        <SidebarItem
          label="Todos"
          count={counts.total}
          active={!activeListId}
          onClick={() => onSelectList("")}
          color="muted"
        />
        <SidebarItem
          label="Favoritos"
          count={counts.favs}
          active={activeListId === "favorites"}
          onClick={() => onSelectList("favorites")}
          color="amber"
        />
        <SidebarItem
          label="Sin contacto +60d"
          count={counts.stale60 ?? 0}
          active={activeListId === "stale60"}
          onClick={() => onSelectList("stale60")}
          color="rose"
        />

        <SectionHeader
          label="Por tipo"
          open={!collapsed.types}
          onToggle={() => toggle("types")}
        />
        {!collapsed.types && (
          <div className="space-y-0.5 pb-1">
            {CONTACT_TYPES.slice(0, 6).map((c) => {
              const n = counts.byType[c.value] ?? 0;
              if (n === 0) return null;
              const Icon = TYPE_ICONS[c.value];
              return (
                <SidebarItem
                  key={c.value}
                  label={c.label}
                  count={n}
                  active={activeListId === `type:${c.value}`}
                  onClick={() => onSelectList(`type:${c.value}`)}
                  icon={Icon}
                />
              );
            })}
          </div>
        )}

        {smartLists.length > 0 && (
          <>
            <SectionHeader
              label="Mis listas"
              open={!collapsed.lists}
              onToggle={() => toggle("lists")}
            />
            {!collapsed.lists && (
              <div className="space-y-0.5 pb-1">
                {smartLists.map((sl) => (
                  <SidebarItem
                    key={sl.id}
                    label={sl.name}
                    active={activeListId === sl.id}
                    onClick={() => onSelectList(sl.id)}
                    color="primary"
                  />
                ))}
              </div>
            )}
          </>
        )}

        {tags.length > 0 && (
          <>
            <SectionHeader
              label="Tags"
              open={!collapsed.tags}
              onToggle={() => toggle("tags")}
            />
            {!collapsed.tags && (
              <div className="flex flex-wrap gap-1 px-1.5 pb-1.5">
                {tags.map((t) => {
                  const active = activeTagId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => onSelectTag(active ? "" : t.id)}
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium transition-all",
                        active && "ring-1"
                      )}
                      style={
                        active
                          ? {
                              backgroundColor: t.color,
                              color: "white",
                              ["--tw-ring-color" as never]: t.color,
                            } as React.CSSProperties
                          : {
                              backgroundColor: `${t.color}15`,
                              color: t.color,
                            }
                      }
                      title={`${t.count} contactos`}
                    >
                      <span
                        className="h-1 w-1 rounded-full"
                        style={{ backgroundColor: active ? "white" : t.color }}
                      />
                      {t.name}
                      <span className={cn("font-mono tabular-nums opacity-70", active && "opacity-100")}>
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        <button
          type="button"
          onClick={() => router.push("/contactos?manage=tags")}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border px-2.5 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Plus className="h-3 w-3" />
          Crear lista o tag
        </button>
      </div>
    </aside>
  );
}

function SectionHeader({
  label,
  open,
  onToggle,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="mt-2 flex w-full items-center justify-between rounded-md px-2 py-1 text-[9.5px] font-semibold uppercase tracking-[0.15em] text-muted-foreground transition-colors hover:text-foreground"
    >
      <span>{label}</span>
      <ChevronRightSmall open={open} />
    </button>
  );
}

function ChevronRightSmall({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      className={cn("transition-transform", open && "rotate-90")}
      aria-hidden
    >
      <path
        d="M3 2 L6 5 L3 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function SidebarItem({
  label,
  count,
  active,
  onClick,
  icon: Icon,
  color = "default",
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  icon?: LucideIcon;
  color?: "default" | "muted" | "amber" | "rose" | "primary";
}) {
  const colorClass = {
    default: "text-foreground/85",
    muted: "text-foreground/85",
    amber: "text-amber-600",
    rose: "text-rose-600",
    primary: "text-primary",
  }[color];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-[11.5px] font-medium transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "hover:bg-card/70 " + colorClass
      )}
    >
      <span className="flex items-center gap-1.5 truncate">
        {Icon && <Icon className="h-3 w-3 shrink-0" strokeWidth={1.75} />}
        <span className="truncate">{label}</span>
      </span>
      {count !== undefined && (
        <span
          className={cn(
            "font-mono text-[10px] tabular-nums",
            active ? "text-primary" : "text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// ============================================================
// BULK ACTIONS BAR
// ============================================================

function BulkActionBar({
  selected,
  contacts,
  tags,
  onClear,
  onAfterAction,
}: {
  selected: Set<string>;
  contacts: Contact[];
  tags: Tag[];
  onClear: () => void;
  onAfterAction: () => void;
}) {
  const { t, locale } = useT();
  const [pending, setPending] = useState(false);
  if (selected.size === 0) return null;

  const ids = Array.from(selected);

  async function run(fn: () => Promise<unknown>, successMsg: string) {
    setPending(true);
    try {
      await fn();
      toast.success(successMsg);
      onAfterAction();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <motion.div
      initial={{ y: 60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 60, opacity: 0 }}
      className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border bg-card/95 px-3 py-2 shadow-xl backdrop-blur-md"
    >
      <span className="flex items-center gap-2 pl-1 pr-2 text-xs">
        <span className="font-mono font-semibold tabular-nums text-foreground">
          {selected.size}
        </span>
        <span className="text-muted-foreground">{t.contactos.selected}</span>
      </span>
      <span className="h-5 w-px bg-border" />

      {/* Tag picker */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs" disabled={pending || tags.length === 0}>
            <Plus className="mr-1 h-3 w-3" />
            {t.contactos.tag}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {tags.length === 0 && (
            <DropdownMenuLabel className="text-[11px] text-muted-foreground">
              {t.contactos.noTags}
            </DropdownMenuLabel>
          )}
          {tags.map((tag) => (
            <DropdownMenuItem
              key={tag.id}
              onClick={() =>
                run(
                  async () => {
                    const { bulkAttachTag } = await import("@/lib/actions/contact-polish");
                    await bulkAttachTag(ids, tag.id);
                  },
                  `${ids.length} ${t.contactos.toastBulkTagged} «${tag.name}»`
                )
              }
            >
              <span
                className="mr-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color }}
              />
              {tag.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Type picker */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 text-xs" disabled={pending}>
            {t.contactos.changeType}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {CONTACT_TYPES.map((c) => (
            <DropdownMenuItem
              key={c.value}
              onClick={() =>
                run(
                  async () => {
                    const { bulkUpdateContactType } = await import("@/lib/actions/contact-polish");
                    await bulkUpdateContactType(ids, c.value);
                  },
                  `${t.contactos.toastTypeChanged} ${labelFor(CONTACT_TYPES, c.value, locale)}`
                )
              }
            >
              {labelFor(CONTACT_TYPES, c.value, locale)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Favorite toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs"
        disabled={pending}
        onClick={() =>
          run(
            async () => {
              const { bulkToggleFavorite } = await import("@/lib/actions/contact-polish");
              await bulkToggleFavorite(ids, true);
            },
            t.contactos.toastMarkedFavorites
          )
        }
      >
        <Star className="mr-1 h-3 w-3" />
        {t.contactos.favorite}
      </Button>

      {/* Delete */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 text-xs text-destructive hover:text-destructive"
        disabled={pending}
        onClick={() => {
          if (!confirm(t.contactos.confirmBulkDelete.replace("{count}", String(selected.size)))) return;
          run(
            async () => {
              const { bulkDeleteContacts } = await import("@/lib/actions/contact-polish");
              await bulkDeleteContacts(ids);
            },
            `${ids.length} ${t.contactos.toastBulkDeleted}`
          );
        }}
      >
        <Trash2 className="mr-1 h-3 w-3" />
        {t.contactos.delete}
      </Button>

      <span className="h-5 w-px bg-border" />
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClear}>
        <X className="h-3.5 w-3.5" />
      </Button>
    </motion.div>
  );
}
