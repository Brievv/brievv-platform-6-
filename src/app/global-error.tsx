"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", background: "#F4F1E8", color: "#08111C" }}>
        <div style={{ display: "flex", minHeight: "100vh", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600 }}>BRIEVV is temporarily unavailable.</h1>
          <p style={{ marginTop: 8, color: "#657180", maxWidth: 380 }}>
            We hit an unexpected error loading the application shell. Please try again in a moment.
          </p>
          <button
            onClick={() => reset()}
            style={{ marginTop: 20, background: "#FF6A13", color: "#fff", border: "none", borderRadius: 4, padding: "10px 20px", cursor: "pointer" }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
