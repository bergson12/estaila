// Import field schemas — non-server module so it can export sync helpers.

export type ImportType = "CONTACTS" | "PROPERTIES";

export type FieldSpec = {
  key: string;
  label: string;
  required?: boolean;
  synonyms: readonly string[];
};

const CONTACT_FIELDS: readonly FieldSpec[] = [
  {
    key: "name",
    label: "Nombre",
    required: true,
    synonyms: ["nombre", "name", "fullname", "fullName", "firstName", "first_name", "client", "cliente"],
  },
  { key: "email", label: "Email", synonyms: ["email", "correo", "mail", "e-mail"] },
  { key: "phone", label: "Teléfono", synonyms: ["telefono", "phone", "tel", "telephone", "celular", "movil"] },
  { key: "whatsapp", label: "WhatsApp", synonyms: ["whatsapp", "wa", "wsp"] },
  { key: "type", label: "Tipo", synonyms: ["tipo", "type", "categoria", "category"] },
  { key: "location", label: "Ubicación", synonyms: ["ubicacion", "location", "city", "ciudad", "address"] },
  { key: "rnc", label: "RNC / Tax ID", synonyms: ["rnc", "taxid", "tax", "rfc", "cuit", "nif"] },
  { key: "notes", label: "Notas", synonyms: ["notas", "notes", "comments", "observaciones"] },
];

const PROPERTY_FIELDS: readonly FieldSpec[] = [
  {
    key: "title",
    label: "Título",
    required: true,
    synonyms: ["titulo", "title", "name", "nombre", "propiedad", "property"],
  },
  {
    key: "category",
    label: "Categoría",
    required: true,
    synonyms: ["categoria", "category", "type", "tipo"],
  },
  { key: "operation", label: "Operación", synonyms: ["operacion", "operation", "estado", "transaction", "deal"] },
  { key: "priceUSD", label: "Precio USD", synonyms: ["price", "precio", "priceusd", "amount", "valor"] },
  { key: "bedrooms", label: "Habitaciones", synonyms: ["bedrooms", "habitaciones", "beds", "hab", "dormitorios"] },
  { key: "bathrooms", label: "Baños", synonyms: ["bathrooms", "baths", "banos", "wc"] },
  { key: "parking", label: "Parqueos", synonyms: ["parking", "parqueos", "garage", "garages", "stalls"] },
  { key: "metersSquared", label: "Metros²", synonyms: ["metros", "m2", "sqm", "area", "size", "metrossquared"] },
  { key: "location", label: "Ubicación", synonyms: ["location", "ubicacion", "city", "ciudad", "zone", "zona"] },
  { key: "address", label: "Dirección", synonyms: ["address", "direccion", "street", "calle"] },
  { key: "description", label: "Descripción", synonyms: ["description", "descripcion", "details", "detalles"] },
];

export function fieldsFor(type: ImportType): readonly FieldSpec[] {
  return type === "CONTACTS" ? CONTACT_FIELDS : PROPERTY_FIELDS;
}
