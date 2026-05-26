"use client";

/**
 * Catches errors that bubble up past the root layout (e.g. provider crash).
 * Must include <html> and <body> because it replaces the entire root.
 */

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global-error.tsx]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          background: "#fafafa",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "1.5rem",
          color: "#0a0a0a",
        }}
      >
        <img
          src="/logos/iso-estaila.png"
          alt="Estaila"
          width={48}
          height={48}
          style={{ marginBottom: 16, objectFit: "contain" }}
        />
        <h1
          style={{
            fontSize: 24,
            fontWeight: 700,
            margin: 0,
            marginBottom: 8,
          }}
        >
          Error crítico
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#525252",
            textAlign: "center",
            maxWidth: 360,
            margin: 0,
            marginBottom: 24,
          }}
        >
          La aplicación no pudo cargar. Intenta refrescar o vuelve al inicio.
        </p>
        {error.digest && (
          <p
            style={{
              fontFamily: "monospace",
              fontSize: 11,
              color: "#a3a3a3",
              marginBottom: 24,
            }}
          >
            ID: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={reset}
            style={{
              background: "#00bf63",
              color: "#fff",
              border: "none",
              padding: "10px 20px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
          <a
            href="/"
            style={{
              background: "#fff",
              color: "#0a0a0a",
              border: "1px solid #e5e5e5",
              padding: "10px 20px",
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Ir al inicio
          </a>
        </div>
      </body>
    </html>
  );
}
