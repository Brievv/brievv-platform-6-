import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

/**
 * Server-rendered quote PDF (spec §12: "Quote should have a professional
 * PDF export"). Rendered via @react-pdf/renderer inside the API route —
 * no headless browser required, so it works in any Node runtime including
 * serverless.
 */

const BRAND = {
  navy: "#0B2744",
  navyDeep: "#071A2D",
  orange: "#FF6A13",
  steel: "#657180",
  ink: "#08111C",
  paper: "#F4F1E8",
};

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: BRAND.ink },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, borderBottom: `2 solid ${BRAND.navyDeep}`, paddingBottom: 16 },
  brand: { fontSize: 20, fontFamily: "Helvetica-Bold", color: BRAND.navyDeep },
  refCode: { fontSize: 9, color: BRAND.steel, marginTop: 4 },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  statusBadge: { fontSize: 8, color: "#fff", backgroundColor: BRAND.orange, paddingVertical: 3, paddingHorizontal: 8, borderRadius: 3, alignSelf: "flex-start" },
  statsRow: { flexDirection: "row", borderTop: `1 solid #ddd`, borderBottom: `1 solid #ddd`, marginVertical: 16, paddingVertical: 12 },
  statCol: { flex: 1, borderRight: `1 solid #eee` },
  statLabel: { fontSize: 8, color: BRAND.steel, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 },
  statValue: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  sectionTitle: { fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, color: BRAND.orange, marginTop: 16, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  paragraph: { fontSize: 10, lineHeight: 1.5 },
  bullet: { fontSize: 10, lineHeight: 1.5, marginBottom: 3 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 8, color: BRAND.steel, borderTop: "1 solid #ddd", paddingTop: 10 },
});

export interface QuotePdfData {
  quoteNumber: string;
  referenceCode: string;
  projectTitle: string;
  status: string;
  priceLowCents: number;
  priceHighCents: number;
  timelineText: string;
  recommendedTeam: string[];
  scopeSummary: string;
  assumptions: string[];
  exclusions: string[];
  risks: string[];
  expiresAt: string | null;
  generatedAt: string;
}

function money(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function QuotePdfDocument({ data }: { data: QuotePdfData }) {
  return (
    <Document title={`BRIEVV Quote ${data.quoteNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>BRIEVV</Text>
            <Text style={styles.refCode}>Project {data.referenceCode} · Quote {data.quoteNumber}</Text>
          </View>
          <Text style={styles.statusBadge}>{data.status.replace(/_/g, " ")}</Text>
        </View>

        <Text style={styles.title}>{data.projectTitle}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Estimated investment</Text>
            <Text style={styles.statValue}>
              {money(data.priceLowCents)}–{money(data.priceHighCents)}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Timeline</Text>
            <Text style={styles.statValue}>{data.timelineText}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.statLabel}>Expires</Text>
            <Text style={styles.statValue}>{data.expiresAt ? new Date(data.expiresAt).toLocaleDateString() : "—"}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recommended team</Text>
        <Text style={styles.paragraph}>{data.recommendedTeam.join(", ") || "To be confirmed"}</Text>

        <Text style={styles.sectionTitle}>Scope summary</Text>
        <Text style={styles.paragraph}>{data.scopeSummary}</Text>

        {data.assumptions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Assumptions</Text>
            {data.assumptions.map((a, i) => (
              <Text key={i} style={styles.bullet}>
                • {a}
              </Text>
            ))}
          </>
        )}

        {data.exclusions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Exclusions</Text>
            {data.exclusions.map((a, i) => (
              <Text key={i} style={styles.bullet}>
                • {a}
              </Text>
            ))}
          </>
        )}

        {data.risks.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Risks &amp; open questions</Text>
            {data.risks.map((a, i) => (
              <Text key={i} style={styles.bullet}>
                • {a}
              </Text>
            ))}
          </>
        )}

        <View style={styles.footer}>
          <Text>
            This quote is a scoped estimate reviewed by BRIEVV's team. AI assists estimation and workflow; qualified
            professionals remain responsible for professional work. Generated {data.generatedAt}.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
