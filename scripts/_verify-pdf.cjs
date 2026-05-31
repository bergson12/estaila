const fs = require("fs"), zlib = require("zlib");
const buf = fs.readFileSync("estaila-Resumen-Ejecutivo.pdf");
const S = buf.toString("latin1");
const ES = Buffer.from("endstream");
const re = /<<([\s\S]*?)>>\s*stream\r?\n/g;
let m, firstOps = null, allText = "";
while ((m = re.exec(S))) {
  const dict = m[1];
  const dataStart = m.index + m[0].length;
  const endRel = buf.indexOf(ES, dataStart);
  if (endRel < 0) continue;
  const chunk = buf.slice(dataStart, endRel);
  if (!/FlateDecode/.test(dict)) continue;
  try {
    const inf = zlib.inflateSync(chunk).toString("latin1");
    if (!/Tj|TJ/.test(inf)) continue;
    if (!firstOps) firstOps = inf.slice(0, 260);
    // hex strings: <....> -> bytes (WinAnsi). literal: (...).
    const hex = inf.match(/<([0-9A-Fa-f\s]+)>/g) || [];
    for (const hgrp of hex) {
      const hx = hgrp.slice(1, -1).replace(/\s+/g, "");
      if (hx.length % 2) continue;
      let str = "";
      for (let i = 0; i < hx.length; i += 2) str += String.fromCharCode(parseInt(hx.substr(i, 2), 16));
      allText += str;
    }
    const lit = inf.match(/\(((?:[^()\\]|\\.)*)\)/g) || [];
    allText += lit.map((x) => x.slice(1, -1)).join("");
  } catch (e) {}
}
console.log("=== first content-stream operators (raw) ===");
console.log(firstOps);
const clean = allText.replace(/\\([()\\])/g, "$1").replace(/[\x00-\x1f]/g, "").replace(/\s+/g, " ");
console.log("\n=== decoded text length:", clean.length, "===");
console.log(clean.slice(0, 500));
console.log("\n=== keyword check ===");
["Resumen", "Ejecutivo", "estaila", "Mercado", "FODA", "Agency", "Margen", "288"].forEach(
  (k) => console.log((clean.includes(k) ? "OK   " : "MISS ") + k)
);
