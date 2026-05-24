/**
 * Document templates — placeholders + system catalog.
 *
 * Placeholder syntax: {{path.to.value}}
 * Examples:
 *   {{property.title}}    {{property.priceUSD}}    {{property.location}}
 *   {{form.sellerName}}   {{form.buyerName}}       {{form.amount}}
 *   {{today}}             {{site.title}}           {{currency.amountWords}}
 */

export type DocKind = "CONTRACT_SALE" | "SALE_PROMISE" | "RENTAL_CONTRACT" | "PAYMENT_RECEIPT";

export const DOC_KIND_LABEL: Record<DocKind, string> = {
  CONTRACT_SALE: "Contrato de compra venta",
  SALE_PROMISE: "Promesa de venta",
  RENTAL_CONTRACT: "Contrato de alquiler",
  PAYMENT_RECEIPT: "Recibo de pago",
};

/** Placeholders shared by ALL kinds — org branding + header */
const ORG_PLACEHOLDERS = [
  { token: "{{org.headerBlock}}", label: "Encabezado completo (logo + datos)", group: "Empresa" },
  { token: "{{org.logo}}", label: "Logo (img)", group: "Empresa" },
  { token: "{{org.name}}", label: "Nombre comercial", group: "Empresa" },
  { token: "{{org.legalName}}", label: "Razón social", group: "Empresa" },
  { token: "{{org.taxId}}", label: "RNC", group: "Empresa" },
  { token: "{{org.address}}", label: "Dirección oficina", group: "Empresa" },
  { token: "{{org.phone}}", label: "Teléfono", group: "Empresa" },
  { token: "{{org.email}}", label: "Email", group: "Empresa" },
  { token: "{{org.website}}", label: "Sitio web", group: "Empresa" },
] as const;

/** Placeholders catalog per doc kind — used by editor sidebar. */
export const PLACEHOLDERS: Record<DocKind, { token: string; label: string; group: string }[]> = {
  CONTRACT_SALE: [
    ...ORG_PLACEHOLDERS,
    { token: "{{property.title}}", label: "Título propiedad", group: "Propiedad" },
    { token: "{{property.category}}", label: "Categoría", group: "Propiedad" },
    { token: "{{property.address}}", label: "Dirección", group: "Propiedad" },
    { token: "{{property.location}}", label: "Ubicación", group: "Propiedad" },
    { token: "{{property.metersSquared}}", label: "Metros²", group: "Propiedad" },
    { token: "{{property.bedrooms}}", label: "Habitaciones", group: "Propiedad" },
    { token: "{{property.bathrooms}}", label: "Baños", group: "Propiedad" },
    { token: "{{property.parking}}", label: "Parqueos", group: "Propiedad" },
    { token: "{{form.sellerName}}", label: "Nombre vendedor", group: "Partes" },
    { token: "{{form.sellerId}}", label: "Cédula vendedor", group: "Partes" },
    { token: "{{form.buyerName}}", label: "Nombre comprador", group: "Partes" },
    { token: "{{form.buyerId}}", label: "Cédula comprador", group: "Partes" },
    { token: "{{form.salePrice}}", label: "Precio venta (número)", group: "Términos" },
    { token: "{{form.salePriceFormatted}}", label: "Precio venta (formato)", group: "Términos" },
    { token: "{{form.salePriceWords}}", label: "Precio venta (en letras)", group: "Términos" },
    { token: "{{form.deposit}}", label: "Inicial / depósito", group: "Términos" },
    { token: "{{form.depositFormatted}}", label: "Inicial (formato)", group: "Términos" },
    { token: "{{form.balance}}", label: "Saldo restante", group: "Términos" },
    { token: "{{form.balanceFormatted}}", label: "Saldo (formato)", group: "Términos" },
    { token: "{{form.closingDate}}", label: "Fecha de cierre", group: "Términos" },
    { token: "{{form.notary}}", label: "Notario", group: "Términos" },
    { token: "{{form.contractDate}}", label: "Fecha del contrato", group: "Términos" },
    { token: "{{form.city}}", label: "Ciudad", group: "Términos" },
    { token: "{{today}}", label: "Hoy", group: "Sistema" },
  ],
  SALE_PROMISE: [
    ...ORG_PLACEHOLDERS,
    { token: "{{property.title}}", label: "Título propiedad", group: "Propiedad" },
    { token: "{{property.category}}", label: "Categoría", group: "Propiedad" },
    { token: "{{property.address}}", label: "Dirección", group: "Propiedad" },
    { token: "{{property.location}}", label: "Ubicación", group: "Propiedad" },
    { token: "{{form.sellerName}}", label: "Promitente vendedor", group: "Partes" },
    { token: "{{form.sellerId}}", label: "Cédula vendedor", group: "Partes" },
    { token: "{{form.buyerName}}", label: "Promitente comprador", group: "Partes" },
    { token: "{{form.buyerId}}", label: "Cédula comprador", group: "Partes" },
    { token: "{{form.salePrice}}", label: "Precio total", group: "Términos" },
    { token: "{{form.salePriceFormatted}}", label: "Precio (formato)", group: "Términos" },
    { token: "{{form.reservationAmount}}", label: "Reserva", group: "Términos" },
    { token: "{{form.reservationAmountFormatted}}", label: "Reserva (formato)", group: "Términos" },
    { token: "{{form.signDeadline}}", label: "Plazo para firmar", group: "Términos" },
    { token: "{{form.penalty}}", label: "Penalidad", group: "Términos" },
    { token: "{{form.penaltyFormatted}}", label: "Penalidad (formato)", group: "Términos" },
    { token: "{{form.contractDate}}", label: "Fecha", group: "Términos" },
    { token: "{{form.city}}", label: "Ciudad", group: "Términos" },
  ],
  RENTAL_CONTRACT: [
    ...ORG_PLACEHOLDERS,
    { token: "{{property.title}}", label: "Propiedad", group: "Propiedad" },
    { token: "{{property.category}}", label: "Categoría", group: "Propiedad" },
    { token: "{{property.address}}", label: "Dirección", group: "Propiedad" },
    { token: "{{form.landlordName}}", label: "Arrendador", group: "Partes" },
    { token: "{{form.landlordId}}", label: "Cédula arrendador", group: "Partes" },
    { token: "{{form.tenantName}}", label: "Inquilino", group: "Partes" },
    { token: "{{form.tenantId}}", label: "Cédula inquilino", group: "Partes" },
    { token: "{{form.monthlyRent}}", label: "Renta mensual", group: "Términos" },
    { token: "{{form.monthlyRentFormatted}}", label: "Renta (formato)", group: "Términos" },
    { token: "{{form.deposit}}", label: "Depósito", group: "Términos" },
    { token: "{{form.depositFormatted}}", label: "Depósito (formato)", group: "Términos" },
    { token: "{{form.duration}}", label: "Duración (meses)", group: "Términos" },
    { token: "{{form.startDate}}", label: "Inicio", group: "Términos" },
    { token: "{{form.endDate}}", label: "Fin (calculado)", group: "Términos" },
    { token: "{{form.paymentDay}}", label: "Día de pago", group: "Términos" },
    { token: "{{form.purpose}}", label: "Uso del inmueble", group: "Términos" },
    { token: "{{form.contractDate}}", label: "Fecha", group: "Términos" },
    { token: "{{form.city}}", label: "Ciudad", group: "Términos" },
  ],
  PAYMENT_RECEIPT: [
    ...ORG_PLACEHOLDERS,
    { token: "{{property.title}}", label: "Propiedad", group: "Propiedad" },
    { token: "{{property.address}}", label: "Dirección", group: "Propiedad" },
    { token: "{{form.receiptNumber}}", label: "N° recibo", group: "Recibo" },
    { token: "{{form.payerName}}", label: "Pagador", group: "Partes" },
    { token: "{{form.payerId}}", label: "Cédula pagador", group: "Partes" },
    { token: "{{form.receiverName}}", label: "Recibido por", group: "Partes" },
    { token: "{{form.amount}}", label: "Monto (número)", group: "Pago" },
    { token: "{{form.amountFormatted}}", label: "Monto (formato)", group: "Pago" },
    { token: "{{form.amountWords}}", label: "Monto (letras)", group: "Pago" },
    { token: "{{form.concept}}", label: "Concepto", group: "Pago" },
    { token: "{{form.method}}", label: "Método", group: "Pago" },
    { token: "{{form.reference}}", label: "Referencia", group: "Pago" },
    { token: "{{form.contractDate}}", label: "Fecha", group: "Pago" },
    { token: "{{form.city}}", label: "Ciudad", group: "Pago" },
  ],
};

// ============================================================
// SYSTEM TEMPLATES — deep, legally-correct Dominican Republic style
// ============================================================

export const SYSTEM_TEMPLATES: {
  kind: DocKind;
  name: string;
  description: string;
  body: string;
}[] = [
  // ---------- CONTRATO DE COMPRA VENTA ----------
  {
    kind: "CONTRACT_SALE",
    name: "Contrato de compra-venta · Completo",
    description:
      "Plantilla extensa con 10 cláusulas: objeto, precio, forma de pago, cierre, gastos, garantías, mora, cesión, jurisdicción.",
    body: `<h1>CONTRATO DE COMPRA VENTA DE INMUEBLE</h1>

<p>En la ciudad de <strong>{{form.city}}</strong>, República Dominicana, a los <strong>{{form.contractDate}}</strong>, entre las partes que más adelante se identifican, se celebra el presente <strong>CONTRATO DE COMPRA VENTA</strong>, el cual se regirá por las siguientes estipulaciones:</p>

<h2>COMPARECIENTES</h2>

<p><strong>DE UNA PARTE:</strong> <strong>{{form.sellerName}}</strong>, dominicano(a), mayor de edad, portador(a) de la cédula de identidad y electoral N° <strong>{{form.sellerId}}</strong>, con domicilio en la ciudad de {{form.city}}, quien en lo adelante se denominará <strong>«EL VENDEDOR»</strong>.</p>

<p><strong>DE LA OTRA PARTE:</strong> <strong>{{form.buyerName}}</strong>, dominicano(a), mayor de edad, portador(a) de la cédula de identidad y electoral N° <strong>{{form.buyerId}}</strong>, con domicilio en la ciudad de {{form.city}}, quien en lo adelante se denominará <strong>«EL COMPRADOR»</strong>.</p>

<p><strong>SE HA CONVENIDO Y PACTADO LO SIGUIENTE:</strong></p>

<h3>PRIMERA · OBJETO DEL CONTRATO</h3>
<p>EL VENDEDOR transfiere, cede y traspasa a EL COMPRADOR, quien acepta para sí y para sus causahabientes, el derecho de propiedad pleno, libre de gravámenes, hipotecas, anticresis, embargos, oposiciones o derechos reales de terceros, sobre el siguiente inmueble:</p>

<ul>
  <li><strong>Designación:</strong> {{property.title}}</li>
  <li><strong>Tipo:</strong> {{property.category}}</li>
  <li><strong>Ubicación:</strong> {{property.address}}, {{property.location}}</li>
  <li><strong>Superficie:</strong> {{property.metersSquared}} metros cuadrados</li>
  <li><strong>Distribución:</strong> {{property.bedrooms}} habitaciones, {{property.bathrooms}} baños, {{property.parking}} parqueos</li>
</ul>

<h3>SEGUNDA · PRECIO</h3>
<p>El precio total y único de la presente compra-venta queda convenido en la suma de <strong>{{form.salePriceFormatted}}</strong> ({{form.salePriceWords}}), suma que EL COMPRADOR se obliga a pagar a EL VENDEDOR en la forma y plazos pactados en la cláusula siguiente.</p>

<h3>TERCERA · FORMA DE PAGO</h3>
<p>EL COMPRADOR entrega a EL VENDEDOR, en este acto y a su entera satisfacción, la suma de <strong>{{form.depositFormatted}}</strong> en concepto de inicial, por la cual EL VENDEDOR otorga formal recibo y descargo. El saldo restante de <strong>{{form.balanceFormatted}}</strong> será pagado en el acto de cierre formal, contra entrega del acto de venta debidamente firmado y de las llaves del inmueble.</p>

<h3>CUARTA · CIERRE Y ENTREGA</h3>
<p>El cierre formal de la presente operación, así como la entrega material del inmueble, se realizará a más tardar el día <strong>{{form.closingDate}}</strong>, ante el notario público <strong>{{form.notary}}</strong>, momento en el cual se firmará el acto de venta definitivo y se procederá al pago del saldo. La falta de cierre por causa imputable a una de las partes facultará a la otra a demandar la ejecución forzosa o la resolución del contrato, con los daños y perjuicios correspondientes.</p>

<h3>QUINTA · GASTOS LEGALES</h3>
<p>Los gastos notariales, impuestos de transferencia, sellos, registros y cualquier otro gasto inherente al traspaso del inmueble correrán por cuenta exclusiva de <strong>EL COMPRADOR</strong>, salvo pacto contrario expreso por escrito.</p>

<h3>SEXTA · DECLARACIONES DEL VENDEDOR</h3>
<p>EL VENDEDOR declara bajo solemne juramento que: (a) es el único y exclusivo propietario del inmueble objeto del presente contrato; (b) el inmueble se encuentra libre de cargas, gravámenes, deudas, hipotecas, anticresis, oposiciones y reclamaciones de terceros; (c) está al día en el pago de impuestos sobre la propiedad inmobiliaria (IPI), agua, luz y demás servicios; (d) cuenta con la capacidad legal para vender; (e) entregará el inmueble en el mismo estado en que se encuentra al momento de la firma del presente contrato, salvo el deterioro natural por uso normal.</p>

<h3>SÉPTIMA · DECLARACIONES DEL COMPRADOR</h3>
<p>EL COMPRADOR declara que ha inspeccionado el inmueble personalmente, conoce su estado físico, jurídico y registral, y lo acepta en las condiciones en que se encuentra. Igualmente declara contar con los recursos económicos para honrar el saldo pactado en la fecha de cierre.</p>

<h3>OCTAVA · MORA Y PENALIDADES</h3>
<p>Si EL COMPRADOR no paga el saldo en la fecha pactada, EL VENDEDOR podrá optar entre: (i) exigir el cumplimiento del contrato con los intereses moratorios calculados a la tasa legal vigente, o (ii) resolver el contrato de pleno derecho, conservando la inicial recibida como indemnización por daños y perjuicios.</p>

<h3>NOVENA · CESIÓN</h3>
<p>EL COMPRADOR no podrá ceder los derechos derivados del presente contrato a terceros sin el consentimiento previo y por escrito de EL VENDEDOR.</p>

<h3>DÉCIMA · JURISDICCIÓN APLICABLE</h3>
<p>Para todos los efectos legales del presente contrato, las partes se someten expresamente a la jurisdicción de los tribunales ordinarios de la ciudad de {{form.city}}, República Dominicana, renunciando a cualquier otro fuero que pudiera corresponderles.</p>

<h3>DÉCIMA PRIMERA · ACEPTACIÓN</h3>
<p>Ambas partes declaran haber leído, comprendido y aceptado íntegramente el presente contrato en todas sus cláusulas, comprometiéndose a su fiel y exacto cumplimiento. Para constancia firman dos ejemplares de un mismo tenor y efecto, uno para cada parte, en la ciudad y fecha al inicio indicadas.</p>

<div class="signatures">
  <div>
    <p>______________________________________</p>
    <p><strong>EL VENDEDOR</strong><br/>{{form.sellerName}}<br/>Cédula: {{form.sellerId}}</p>
  </div>
  <div>
    <p>______________________________________</p>
    <p><strong>EL COMPRADOR</strong><br/>{{form.buyerName}}<br/>Cédula: {{form.buyerId}}</p>
  </div>
</div>

<p class="legal-footer">Documento generado mediante plataforma. Requiere legalización notarial para su validez formal ante el Registro de Títulos.</p>`,
  },
  {
    kind: "CONTRACT_SALE",
    name: "Contrato de compra-venta · Básico",
    description: "Versión corta, 5 cláusulas esenciales. Para operaciones simples.",
    body: `<h1>CONTRATO DE COMPRA VENTA</h1>
<p>En {{form.city}}, a los {{form.contractDate}}, entre <strong>{{form.sellerName}}</strong> (cédula {{form.sellerId}}), «EL VENDEDOR», y <strong>{{form.buyerName}}</strong> (cédula {{form.buyerId}}), «EL COMPRADOR», se conviene:</p>
<h3>PRIMERA · Objeto</h3>
<p>EL VENDEDOR vende a EL COMPRADOR el inmueble <strong>{{property.title}}</strong>, ubicado en {{property.address}}, {{property.location}}, con {{property.metersSquared}} m².</p>
<h3>SEGUNDA · Precio</h3>
<p>Precio total: <strong>{{form.salePriceFormatted}}</strong>. Inicial de {{form.depositFormatted}} en este acto. Saldo de {{form.balanceFormatted}} al cierre.</p>
<h3>TERCERA · Cierre</h3>
<p>Cierre el {{form.closingDate}} ante notario {{form.notary}}.</p>
<h3>CUARTA · Gastos</h3>
<p>Los gastos de transferencia son por cuenta de EL COMPRADOR.</p>
<h3>QUINTA · Aceptación</h3>
<p>Ambas partes aceptan y firman.</p>
<div class="signatures">
  <div><p>___________________</p><p><strong>{{form.sellerName}}</strong><br/>Vendedor</p></div>
  <div><p>___________________</p><p><strong>{{form.buyerName}}</strong><br/>Comprador</p></div>
</div>`,
  },

  // ---------- PROMESA DE VENTA ----------
  {
    kind: "SALE_PROMISE",
    name: "Promesa de venta · Completa",
    description: "8 cláusulas con condiciones, penalidades bilaterales, exclusividad.",
    body: `<h1>PROMESA DE VENTA DE INMUEBLE</h1>

<p>En la ciudad de <strong>{{form.city}}</strong>, República Dominicana, a los <strong>{{form.contractDate}}</strong>, comparecen:</p>

<p><strong>DE UNA PARTE:</strong> <strong>{{form.sellerName}}</strong>, mayor de edad, portador(a) de la cédula N° <strong>{{form.sellerId}}</strong>, en lo adelante <strong>«EL PROMITENTE VENDEDOR»</strong>.</p>

<p><strong>DE LA OTRA PARTE:</strong> <strong>{{form.buyerName}}</strong>, mayor de edad, portador(a) de la cédula N° <strong>{{form.buyerId}}</strong>, en lo adelante <strong>«EL PROMITENTE COMPRADOR»</strong>.</p>

<p>QUIENES CONVIENEN EN LO SIGUIENTE:</p>

<h3>PRIMERA · OBJETO DE LA PROMESA</h3>
<p>EL PROMITENTE VENDEDOR promete vender, y EL PROMITENTE COMPRADOR promete adquirir, el inmueble identificado como <strong>{{property.title}}</strong> ({{property.category}}), ubicado en {{property.address}}, {{property.location}}, con una superficie aproximada de {{property.metersSquared}} m².</p>

<h3>SEGUNDA · PRECIO TOTAL</h3>
<p>El precio total acordado de la futura compra-venta es la suma de <strong>{{form.salePriceFormatted}}</strong>, suma que será pagada en su totalidad al momento de la firma del contrato definitivo.</p>

<h3>TERCERA · RESERVA</h3>
<p>EL PROMITENTE COMPRADOR entrega en este acto, a entera satisfacción de EL PROMITENTE VENDEDOR, la suma de <strong>{{form.reservationAmountFormatted}}</strong> en concepto de reserva y garantía. Esta suma será imputable al precio total al momento del cierre.</p>

<h3>CUARTA · EXCLUSIVIDAD</h3>
<p>EL PROMITENTE VENDEDOR se obliga, durante la vigencia de la presente promesa, a no negociar, ofrecer ni vender el inmueble a terceras personas, manteniendo el mismo en exclusiva para EL PROMITENTE COMPRADOR.</p>

<h3>QUINTA · PLAZO PARA FORMALIZAR</h3>
<p>Las partes acuerdan firmar el contrato definitivo de compra-venta a más tardar el día <strong>{{form.signDeadline}}</strong>. Transcurrido dicho plazo sin que se haya formalizado por causa imputable a una de las partes, aplicarán las penalidades estipuladas en la cláusula SEXTA.</p>

<h3>SEXTA · PENALIDADES POR INCUMPLIMIENTO</h3>
<p><strong>(a) Por parte del PROMITENTE COMPRADOR:</strong> Si EL PROMITENTE COMPRADOR desiste injustificadamente o no concurre al cierre en la fecha pactada, perderá íntegramente la suma entregada en concepto de reserva, la cual quedará a favor de EL PROMITENTE VENDEDOR como única indemnización.</p>
<p><strong>(b) Por parte del PROMITENTE VENDEDOR:</strong> Si EL PROMITENTE VENDEDOR desiste injustificadamente, se niega a firmar o vende el inmueble a un tercero, deberá: (i) devolver íntegramente la reserva recibida; y (ii) pagar adicionalmente la suma de <strong>{{form.penaltyFormatted}}</strong> como penalidad e indemnización a favor de EL PROMITENTE COMPRADOR.</p>

<h3>SÉPTIMA · CONDICIONES SUSPENSIVAS</h3>
<p>El cumplimiento de la presente promesa estará condicionado a: (a) que el título de propiedad se encuentre en regla; (b) que el inmueble esté libre de cargas y gravámenes; (c) que se obtengan las certificaciones de impuestos al día; (d) la aprobación del financiamiento de EL PROMITENTE COMPRADOR, si aplica.</p>

<h3>OCTAVA · ACEPTACIÓN Y FUERO</h3>
<p>Las partes declaran haber leído, comprendido y aceptado el presente acuerdo en todas sus cláusulas, sometiéndose, para cualquier controversia, a la jurisdicción de los tribunales de {{form.city}}.</p>

<div class="signatures">
  <div>
    <p>______________________________________</p>
    <p><strong>PROMITENTE VENDEDOR</strong><br/>{{form.sellerName}}<br/>Cédula: {{form.sellerId}}</p>
  </div>
  <div>
    <p>______________________________________</p>
    <p><strong>PROMITENTE COMPRADOR</strong><br/>{{form.buyerName}}<br/>Cédula: {{form.buyerId}}</p>
  </div>
</div>`,
  },

  // ---------- CONTRATO DE ALQUILER ----------
  {
    kind: "RENTAL_CONTRACT",
    name: "Contrato de alquiler · Completo",
    description: "12 cláusulas Ley 4314: depósito, mora, servicios, mantenimiento, terminación.",
    body: `<h1>CONTRATO DE ALQUILER DE INMUEBLE</h1>

<p>En la ciudad de <strong>{{form.city}}</strong>, República Dominicana, a los <strong>{{form.contractDate}}</strong>, comparecen las partes que más adelante se identifican, para celebrar el presente <strong>CONTRATO DE ALQUILER</strong> bajo los términos siguientes:</p>

<h2>COMPARECIENTES</h2>

<p><strong>DE UNA PARTE:</strong> <strong>{{form.landlordName}}</strong>, dominicano(a), mayor de edad, portador(a) de la cédula N° <strong>{{form.landlordId}}</strong>, en lo adelante <strong>«EL ARRENDADOR»</strong>.</p>

<p><strong>DE LA OTRA PARTE:</strong> <strong>{{form.tenantName}}</strong>, dominicano(a), mayor de edad, portador(a) de la cédula N° <strong>{{form.tenantId}}</strong>, en lo adelante <strong>«EL INQUILINO»</strong>.</p>

<h3>PRIMERA · DEL INMUEBLE</h3>
<p>EL ARRENDADOR da en alquiler a EL INQUILINO, quien acepta, el inmueble <strong>{{property.title}}</strong>, ubicado en {{property.address}}, {{property.location}}. El uso permitido es exclusivamente: <strong>{{form.purpose}}</strong>, no pudiendo destinarse a actividades distintas sin autorización por escrito.</p>

<h3>SEGUNDA · RENTA MENSUAL</h3>
<p>La renta mensual queda fijada en la suma de <strong>{{form.monthlyRentFormatted}}</strong>, pagadera por adelantado dentro de los primeros <strong>{{form.paymentDay}}</strong> días de cada mes. El pago se efectuará en la forma que EL ARRENDADOR indique (transferencia bancaria, efectivo o cheque a su nombre).</p>

<h3>TERCERA · DEPÓSITO DE GARANTÍA</h3>
<p>EL INQUILINO entrega en este acto, en concepto de depósito de garantía, la suma de <strong>{{form.depositFormatted}}</strong>, conforme a lo dispuesto por la Ley N° 4314 sobre Alquileres de Casas y Desahucios. Dicho depósito será devuelto al término del contrato, deducidos los daños, deudas pendientes y reparaciones imputables a EL INQUILINO.</p>

<h3>CUARTA · DURACIÓN</h3>
<p>El presente contrato tendrá una duración de <strong>{{form.duration}} meses</strong>, iniciando el <strong>{{form.startDate}}</strong> y terminando el <strong>{{form.endDate}}</strong>. Cualquier renovación deberá pactarse por escrito al menos 30 días antes del vencimiento.</p>

<h3>QUINTA · ENTREGA E INVENTARIO</h3>
<p>EL ARRENDADOR entrega el inmueble en buenas condiciones de habitabilidad. EL INQUILINO se obliga a devolverlo en el mismo estado al término del contrato, salvo el deterioro natural por uso normal.</p>

<h3>SEXTA · OBLIGACIONES DEL INQUILINO</h3>
<ol>
  <li>Pagar puntualmente la renta y los servicios públicos (electricidad, agua, internet, basura).</li>
  <li>Usar el inmueble exclusivamente para el fin pactado.</li>
  <li>No subarrendar total o parcialmente sin consentimiento escrito de EL ARRENDADOR.</li>
  <li>Comunicar inmediatamente cualquier daño o necesidad de reparación.</li>
  <li>Permitir inspecciones razonables previa coordinación.</li>
  <li>No realizar modificaciones estructurales sin autorización por escrito.</li>
  <li>Cumplir con el reglamento del condominio o edificio cuando aplique.</li>
</ol>

<h3>SÉPTIMA · OBLIGACIONES DEL ARRENDADOR</h3>
<ol>
  <li>Entregar el inmueble en condiciones habitables.</li>
  <li>Realizar las reparaciones mayores no imputables al uso normal (estructurales, plomería principal, electricidad principal).</li>
  <li>Garantizar el uso pacífico del inmueble por parte de EL INQUILINO.</li>
  <li>Pagar el impuesto sobre la propiedad inmobiliaria (IPI) y demás cargas registrales.</li>
</ol>

<h3>OCTAVA · MANTENIMIENTO</h3>
<p>EL INQUILINO asume las reparaciones menores propias del uso cotidiano (cambios de bombillos, llaves, juntas, pintura por desgaste normal). Las reparaciones mayores son de cuenta de EL ARRENDADOR.</p>

<h3>NOVENA · MORA Y RESOLUCIÓN</h3>
<p>La falta de pago de <strong>dos (2) mensualidades consecutivas</strong> faculta a EL ARRENDADOR a iniciar el procedimiento de desahucio conforme a la Ley 4314, sin perjuicio del cobro de las rentas adeudadas, intereses moratorios y costas.</p>

<h3>DÉCIMA · TERMINACIÓN ANTICIPADA</h3>
<p>Cualquiera de las partes podrá terminar anticipadamente el contrato con un preaviso por escrito de <strong>treinta (30) días</strong>. Si EL INQUILINO termina antes de los primeros seis meses, perderá el depósito de garantía a título de penalidad, salvo causa de fuerza mayor debidamente acreditada.</p>

<h3>DÉCIMA PRIMERA · DOMICILIO PROCESAL</h3>
<p>Para todos los efectos legales, las partes fijan como domicilio procesal el inmueble objeto del presente contrato (EL INQUILINO) y la dirección registrada en su cédula (EL ARRENDADOR).</p>

<h3>DÉCIMA SEGUNDA · ACEPTACIÓN Y FUERO</h3>
<p>Las partes declaran haber leído íntegramente el presente contrato, comprenderlo y aceptarlo, sometiéndose a la jurisdicción de los tribunales ordinarios de {{form.city}} para cualquier controversia.</p>

<div class="signatures">
  <div>
    <p>______________________________________</p>
    <p><strong>EL ARRENDADOR</strong><br/>{{form.landlordName}}<br/>Cédula: {{form.landlordId}}</p>
  </div>
  <div>
    <p>______________________________________</p>
    <p><strong>EL INQUILINO</strong><br/>{{form.tenantName}}<br/>Cédula: {{form.tenantId}}</p>
  </div>
</div>`,
  },

  // ---------- RECIBO DE PAGO ----------
  {
    kind: "PAYMENT_RECEIPT",
    name: "Recibo de pago · Estándar",
    description: "Recibo formal con número, monto en letras, método y referencia.",
    body: `<div class="receipt-head">
  <h1>RECIBO DE PAGO</h1>
  <div class="receipt-number"><strong>N°</strong> {{form.receiptNumber}}</div>
</div>

<p class="meta">Fecha: <strong>{{form.contractDate}}</strong> · Lugar: <strong>{{form.city}}</strong></p>

<div class="receipt-amount">
  <p class="label">MONTO RECIBIDO</p>
  <p class="amount">{{form.amountFormatted}}</p>
  <p class="words">({{form.amountWords}})</p>
</div>

<p><strong>Recibido de:</strong> {{form.payerName}}{{form.payerId}}</p>
<p><strong>Por concepto de:</strong> {{form.concept}}, relacionado con la propiedad <em>«{{property.title}}»</em>, ubicada en {{property.address}}.</p>
<p><strong>Método de pago:</strong> {{form.method}}{{form.reference}}</p>

<p class="footer-note">La firma del presente recibo constituye plena conformidad y libera al pagador por el monto y concepto descritos. Este recibo no constituye garantía adicional alguna fuera del concepto expresado.</p>

<div class="signatures">
  <div>
    <p>______________________________________</p>
    <p><strong>RECIBIDO POR</strong><br/>{{form.receiverName}}</p>
  </div>
  <div>
    <p>______________________________________</p>
    <p><strong>PAGADO POR</strong><br/>{{form.payerName}}</p>
  </div>
</div>`,
  },
];

// ============================================================
// PLACEHOLDER RENDERER
// ============================================================

/**
 * Replace {{path.to.value}} with actual values from data context.
 * Supports nested object paths. Missing values render as empty string
 * (or a dotted-underline placeholder for visual fields).
 */
export function renderTemplate(
  templateBody: string,
  data: Record<string, unknown>
): string {
  return templateBody.replace(/\{\{([^}]+)\}\}/g, (_match, raw) => {
    const path = String(raw).trim().split(".");
    let cur: unknown = data;
    for (const p of path) {
      if (cur && typeof cur === "object" && p in (cur as Record<string, unknown>)) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        cur = undefined;
        break;
      }
    }
    if (cur === undefined || cur === null || cur === "") {
      // Org/system tokens render as empty when missing (no underline noise)
      const head = path[0];
      if (head === "org" || head === "today" || head === "site") return "";
      return "_____________";
    }
    return String(cur);
  });
}

/** Format USD currency for doc display */
export function formatCurrency(n: number | string | null | undefined): string {
  if (n === null || n === undefined || n === "") return "—";
  const v = typeof n === "string" ? parseFloat(n) : n;
  if (isNaN(v)) return "—";
  return new Intl.NumberFormat("es", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

/** Number → Spanish words (simplified) */
export function numberToWords(n: number): string {
  if (!n || isNaN(n)) return "—";
  return `${new Intl.NumberFormat("es", { maximumFractionDigits: 0 }).format(n)} DÓLARES`;
}

/** Format ISO date as Spanish long form */
export function formatDateEs(iso: string): string {
  if (!iso) return "_____________";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return d.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
}

// ============================================================
// DOCX HTML CLEANUP
// ============================================================

/**
 * Limpia el HTML producido por mammoth para que la plantilla:
 *   - tenga headings reales (no <p><strong>),
 *   - separe cláusulas marcadas con PRIMERO/SEGUNDO/...,
 *   - elimine cadenas largas de guiones,
 *   - colapse espacios y nbsp,
 *   - quite párrafos vacíos.
 */
export function cleanDocxHtml(rawHtml: string): string {
  let h = rawHtml;

  // 1. Normalize whitespace + nbsp
  h = h.replace(/ /g, " ");
  h = h.replace(/\s*\n\s*/g, " ");
  // Long dash runs (often manual page rules typed in Word)
  h = h.replace(/-{3,}/g, " ");

  // 2. Collapse multi-spaces inside text (but not in tags)
  h = h.replace(/>\s+</g, "><");
  h = h.replace(/ {2,}/g, " ");

  // 3. Promote ordinal markers to <h3> sections (RD legal convention)
  const ORDINALS = [
    "PRIMERO", "SEGUNDO", "TERCERO", "CUARTO", "QUINTO",
    "SEXTO", "SÉPTIMO", "SEPTIMO", "OCTAVO", "NOVENO", "DÉCIMO", "DECIMO",
    "UNDÉCIMO", "UNDECIMO", "DUODÉCIMO", "DUODECIMO",
    "PRIMERA", "SEGUNDA", "TERCERA", "CUARTA", "QUINTA",
    "SEXTA", "SÉPTIMA", "SEPTIMA", "OCTAVA", "NOVENA", "DÉCIMA", "DECIMA",
  ];
  const ordAlt = ORDINALS.join("|");
  // Pattern: <p>[lead]<strong>PRIMERO:</strong> [rest]</p>
  // → [<p>lead</p>] <h3>PRIMERO</h3> <p>rest</p>
  const ordRe = new RegExp(
    `<p>([\\s\\S]*?)<strong>\\s*(${ordAlt})\\s*[:.]?\\s*<\\/strong>\\s*([\\s\\S]*?)<\\/p>`,
    "gi"
  );
  let prev: string;
  do {
    prev = h;
    h = h.replace(ordRe, (_m, before: string, ord: string, after: string) => {
      const beforeClean = before.replace(/^[\s.\-]+|[\s.\-]+$/g, "").trim();
      const afterClean = after.replace(/^[\s.\-]+/g, "").trim();
      const beforeP = beforeClean ? `<p>${beforeClean}</p>` : "";
      const afterP = afterClean ? `<p>${afterClean}</p>` : "";
      return `${beforeP}<h3>${ord.toUpperCase()}</h3>${afterP}`;
    });
  } while (h !== prev);

  // 4. Promote first all-caps strong paragraph to <h1>
  h = h.replace(
    /^\s*<p>\s*<strong>\s*([A-ZÁÉÍÓÚÑÜ][A-ZÁÉÍÓÚÑÜ0-9 .,()\-]+?)\s*<\/strong>\s*<\/p>/,
    "<h1>$1</h1>"
  );

  // 5. Remove empty / whitespace-only paragraphs
  h = h.replace(/<p>\s*(&nbsp;\s*)*<\/p>/g, "");
  h = h.replace(/<p>\s*<\/p>/g, "");

  // 6. Strip leading "-----" or similar inside paragraphs
  h = h.replace(/<p>\s*[\-\.\s]{2,}/g, "<p>");

  return h.trim();
}

// ============================================================
// ORG BRANDED HEADER
// ============================================================

export type OrgContext = {
  name?: string | null;
  legalName?: string | null;
  taxId?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
};

/**
 * Render a printable letterhead block (logo + datos empresa).
 * Used by {{org.headerBlock}} placeholder and as fallback prepend
 * when DOCX upload is imported.
 */
export function buildOrgHeaderBlock(org: OrgContext | null | undefined): string {
  if (!org) return "";
  const hasAny =
    org.name || org.legalName || org.logoUrl || org.address || org.email || org.phone || org.website;
  if (!hasAny) return "";

  const accent = org.primaryColor || "#111";
  const logo = org.logoUrl
    ? `<img src="${escapeAttr(org.logoUrl)}" alt="${escapeAttr(org.name ?? "")}" />`
    : "";
  const lines: string[] = [];
  if (org.legalName || org.name) {
    lines.push(`<strong>${escapeHtml(org.legalName || org.name || "")}</strong>`);
  }
  if (org.taxId) lines.push(`RNC ${escapeHtml(org.taxId)}`);
  if (org.address) lines.push(escapeHtml(org.address));
  const contact: string[] = [];
  if (org.phone) contact.push(escapeHtml(org.phone));
  if (org.email) contact.push(escapeHtml(org.email));
  if (org.website) contact.push(escapeHtml(org.website));
  if (contact.length) lines.push(contact.join(" · "));

  return `<div class="org-header" style="border-bottom:2px solid ${escapeAttr(
    accent
  )};">
  <div class="org-header-logo">${logo}</div>
  <div class="org-header-meta">${lines.map((l) => `<div>${l}</div>`).join("")}</div>
</div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[<>&"']/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&#39;" }[c] || c)
  );
}
function escapeAttr(s: string): string {
  return escapeHtml(s);
}

