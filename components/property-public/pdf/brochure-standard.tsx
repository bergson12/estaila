/* eslint-disable jsx-a11y/alt-text */
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

// =============================================================================
// estaila — Property brochure PDF
// 1 page densa (Sotheby's-style). Página 2 SOLO si hay 5+ fotos extras.
// =============================================================================

export type BrochureData = {
  property: {
    title: string;
    description: string | null;
    category: string;
    operation: string;
    priceUSD: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    parking: number | null;
    metersSquared: number | null;
    location: string | null;
    address: string | null;
    featuredPhoto: string | null;
    photos: string[];
    slug: string;
  };
  agent: {
    name: string;
    email: string;
    phone: string | null;
    location: string | null;
    role: string | null;
    avatar: string | null;
  };
  recipient: {
    name: string | null;
    email: string | null;
    phone: string | null;
  };
  personalMessage: string | null;
  publicUrl: string;
  generatedAt: Date;
};

const COLORS = {
  primary: "#C26B45",
  ink: "#16120D",
  text: "#2A241E",
  textSoft: "#534940",
  muted: "#8A7E73",
  border: "#E5DDD3",
  bg: "#FBF8F3",
  card: "#FFFFFF",
};

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: COLORS.bg,
    fontFamily: "Helvetica",
    fontSize: 8.5,
    color: COLORS.text,
  },

  // ─── Hero (45% de página) ──────────────────────────────────
  hero: {
    height: 340,
    position: "relative",
    backgroundColor: COLORS.ink,
  },
  heroImage: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  heroOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  brandTopLeft: {
    position: "absolute",
    top: 22,
    left: 32,
    fontSize: 11,
    color: "#FFF",
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  brandDot: { color: COLORS.primary },
  recipientChip: {
    position: "absolute",
    top: 22,
    right: 32,
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  recipientLabel: {
    fontSize: 6.5,
    color: COLORS.muted,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  recipientName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
    marginTop: 1,
  },
  heroContent: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
  },
  heroEyebrow: {
    fontSize: 7,
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#FFF",
    lineHeight: 1.1,
    maxWidth: 440,
  },
  heroFootRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 12,
  },
  heroLocation: {
    fontSize: 9.5,
    color: "rgba(255,255,255,0.85)",
    maxWidth: 320,
  },
  heroPrice: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: "#FFF",
  },

  // ─── Info band: specs + descripción ─────────────────────────
  infoBand: {
    paddingHorizontal: 32,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    gap: 18,
  },
  specsCol: {
    flex: 1.1,
    flexDirection: "row",
    flexWrap: "wrap",
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: 16,
  },
  specBlock: { width: "50%", paddingVertical: 5 },
  specLabel: {
    fontSize: 6.5,
    color: COLORS.muted,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  specValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },
  descCol: { flex: 2.3 },
  sectionLabel: {
    fontSize: 6.5,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  descText: {
    fontSize: 8.5,
    lineHeight: 1.55,
    color: COLORS.textSoft,
  },

  // ─── Personal note ──────────────────────────────────────────
  noteStrip: {
    marginHorizontal: 32,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: COLORS.card,
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  noteLabel: {
    fontSize: 6.5,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
    marginBottom: 3,
  },
  noteText: {
    fontSize: 8.5,
    lineHeight: 1.45,
    color: COLORS.text,
  },

  // ─── Photo strip — 3 fotos amplias ──────────────────────────
  photoStripWrap: {
    paddingHorizontal: 32,
    marginBottom: 14,
  },
  photoStrip: {
    flexDirection: "row",
    gap: 6,
  },
  photoStripTile: {
    flex: 1,
    height: 170,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  photoStripImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },

  // ─── Agent strip ────────────────────────────────────────────
  agentStrip: {
    position: "absolute",
    bottom: 50,
    left: 32,
    right: 32,
    backgroundColor: COLORS.ink,
    color: "#FFF",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  agentAvatarText: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    color: "#FFF",
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    lineHeight: 44,
  },
  agentAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    objectFit: "cover",
  },
  agentInfo: { flex: 1 },
  agentLabel: {
    fontSize: 6.5,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  agentName: {
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
    color: "#FFF",
  },
  agentMeta: {
    fontSize: 8,
    color: "rgba(255,255,255,0.75)",
    marginTop: 2,
  },
  agentCtaCol: {
    alignItems: "flex-end",
    gap: 4,
  },
  agentCtaPill: {
    backgroundColor: COLORS.primary,
    color: "#FFF",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.5,
  },
  agentContact: {
    fontSize: 8,
    color: "rgba(255,255,255,0.8)",
  },

  // ─── Footer ─────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 18,
    left: 32,
    right: 32,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  footerLeft: {
    fontSize: 6.5,
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  footerRight: {
    fontSize: 6.5,
    color: COLORS.primary,
    fontFamily: "Helvetica-Bold",
  },

  // ─── Page 2 (galería extendida) ─────────────────────────────
  pageGallery: {
    padding: 32,
    backgroundColor: COLORS.bg,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  pageHeaderBrand: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: COLORS.ink,
  },
  pageHeaderRef: {
    fontSize: 7,
    color: COLORS.muted,
    letterSpacing: 0.5,
  },
  galleryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  galleryTile: {
    width: "49.2%",
    height: 240,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: COLORS.border,
  },
  galleryImg: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
});

// =============================================================================
// Helpers
// =============================================================================

function formatUSD(n: number | null): string {
  if (n == null) return "Consultar";
  return `US$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const OP_LABEL: Record<string, string> = {
  EN_VENTA: "En venta",
  EN_ALQUILER: "En alquiler",
  VENDIDA: "Vendida",
  ALQUILADA: "Alquilada",
  CONSIGNACION: "En consignación",
};

const CAT_LABEL: Record<string, string> = {
  CASA: "Casa",
  APARTAMENTO: "Apartamento",
  VILLA: "Villa",
  TERRENO: "Terreno",
  LOCAL: "Local",
  LOCAL_COMERCIAL: "Local",
  OFICINA: "Oficina",
  EDIFICIO: "Edificio",
  SOLAR: "Solar",
};

function initials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function trim(text: string | null, max: number): string {
  if (!text) return "";
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > max * 0.7 ? cut.slice(0, lastSpace) : cut).trimEnd() + "...";
}

/** Compact a URL for display — strips http(s):// and truncates if long */
function displayUrl(url: string, max = 64): string {
  const stripped = url.replace(/^https?:\/\//, "");
  return stripped.length > max ? stripped.slice(0, max - 1) + "…" : stripped;
}

// =============================================================================
// DOCUMENT
// =============================================================================

export function BrochureStandard({ data }: { data: BrochureData }) {
  const {
    property,
    agent,
    recipient,
    personalMessage,
    publicUrl,
    generatedAt,
  } = data;

  const docRef = property.slug.slice(0, 18).toUpperCase();
  const photos = property.photos;
  const stripPhotos = photos.slice(0, 3);
  const extraPhotos = photos.slice(3, 9); // hasta 6 más en página 2
  const hasGalleryPage = extraPhotos.length >= 2; // solo si vale la pena segunda página
  const totalPages = hasGalleryPage ? 2 : 1;

  const description =
    property.description ||
    "Propiedad disponible para visita programada. Contáctame para conocer más detalles, condiciones de financiamiento o agendar un recorrido virtual.";

  return (
    <Document
      title={property.title}
      author={agent.name}
      subject={`Propuesta inmobiliaria · ${property.title}`}
      creator="estaila"
      producer="estaila"
    >
      {/* ======================================================== */}
      {/* PAGE 1 — Single-page brochure complete                    */}
      {/* ======================================================== */}
      <Page size="A4" style={styles.page}>
        {/* Hero */}
        <View style={styles.hero}>
          {property.featuredPhoto && (
            <Image src={property.featuredPhoto} style={styles.heroImage} />
          )}
          <View style={styles.heroOverlay} />

          <Text style={styles.brandTopLeft}>
            estaila<Text style={styles.brandDot}>.</Text>
          </Text>

          {recipient.name && (
            <View style={styles.recipientChip}>
              <Text style={styles.recipientLabel}>Propuesta para</Text>
              <Text style={styles.recipientName}>{recipient.name}</Text>
            </View>
          )}

          <View style={styles.heroContent}>
            <Text style={styles.heroEyebrow}>
              {OP_LABEL[property.operation] ?? property.operation} ·{" "}
              {CAT_LABEL[property.category] ?? property.category}
            </Text>
            <Text style={styles.heroTitle}>{property.title}</Text>
            <View style={styles.heroFootRow}>
              <Text style={styles.heroLocation}>
                {property.address ?? property.location ?? ""}
              </Text>
              <Text style={styles.heroPrice}>
                {formatUSD(property.priceUSD)}
              </Text>
            </View>
          </View>
        </View>

        {/* Info band */}
        <View style={styles.infoBand}>
          <View style={styles.specsCol}>
            <View style={styles.specBlock}>
              <Text style={styles.specLabel}>Habitaciones</Text>
              <Text style={styles.specValue}>
                {property.bedrooms ?? "—"}
              </Text>
            </View>
            <View style={styles.specBlock}>
              <Text style={styles.specLabel}>Baños</Text>
              <Text style={styles.specValue}>
                {property.bathrooms ?? "—"}
              </Text>
            </View>
            <View style={styles.specBlock}>
              <Text style={styles.specLabel}>Parqueos</Text>
              <Text style={styles.specValue}>
                {property.parking ?? "—"}
              </Text>
            </View>
            <View style={styles.specBlock}>
              <Text style={styles.specLabel}>Metros²</Text>
              <Text style={styles.specValue}>
                {property.metersSquared != null
                  ? `${property.metersSquared} m²`
                  : "—"}
              </Text>
            </View>
          </View>

          <View style={styles.descCol}>
            <Text style={styles.sectionLabel}>Sobre la propiedad</Text>
            <Text style={styles.descText}>{trim(description, 480)}</Text>
          </View>
        </View>

        {/* Personal note (opcional) */}
        {personalMessage && (
          <View style={styles.noteStrip}>
            <Text style={styles.noteLabel}>Nota personal</Text>
            <Text style={styles.noteText}>{trim(personalMessage, 280)}</Text>
          </View>
        )}

        {/* Photo strip — 3 fotos amplias */}
        {stripPhotos.length > 0 && (
          <View style={styles.photoStripWrap}>
            <View style={styles.photoStrip}>
              {stripPhotos.map((src, i) => (
                <View key={i} style={styles.photoStripTile}>
                  <Image src={src} style={styles.photoStripImg} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Agent strip bottom (ink dark band) */}
        <View style={styles.agentStrip}>
          {agent.avatar ? (
            <Image src={agent.avatar} style={styles.agentAvatarImg} />
          ) : (
            <Text style={styles.agentAvatarText}>{initials(agent.name)}</Text>
          )}
          <View style={styles.agentInfo}>
            <Text style={styles.agentLabel}>Tu asesor</Text>
            <Text style={styles.agentName}>{agent.name}</Text>
            <Text style={styles.agentMeta}>
              {[
                agent.role ?? "Asesor inmobiliario",
                agent.location,
                agent.phone,
                agent.email,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </Text>
          </View>
          <View style={styles.agentCtaCol}>
            <Text style={styles.agentCtaPill}>Agendar visita</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerLeft}>
            Doc {docRef} · {formatDate(generatedAt)} · Pág 1/{totalPages}
          </Text>
          <Text style={styles.footerRight}>{displayUrl(publicUrl)}</Text>
        </View>
      </Page>

      {/* ======================================================== */}
      {/* PAGE 2 — Galería extendida (solo si 5+ fotos)             */}
      {/* ======================================================== */}
      {hasGalleryPage && (
        <Page size="A4" style={styles.pageGallery}>
          <View style={styles.pageHeader}>
            <Text style={styles.pageHeaderBrand}>
              estaila<Text style={{ color: COLORS.primary }}>.</Text>
            </Text>
            <Text style={styles.pageHeaderRef}>
              {property.title.toUpperCase()} · galería
            </Text>
          </View>

          <View style={styles.galleryGrid}>
            {extraPhotos.map((src, i) => (
              <View key={i} style={styles.galleryTile}>
                <Image src={src} style={styles.galleryImg} />
              </View>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerLeft}>
              © {generatedAt.getFullYear()} estaila · Doc {docRef} · Pág 2/2
            </Text>
            <Text style={styles.footerRight}>{displayUrl(publicUrl)}</Text>
          </View>
        </Page>
      )}
    </Document>
  );
}
