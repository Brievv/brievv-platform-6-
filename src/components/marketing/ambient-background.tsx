/**
 * Soft, slow-moving gradient "glass" background used behind every page.
 * Pure CSS animation (no JS) so it costs nothing on the server and never
 * blocks hydration. `.animate-drift-*` classes are defined in globals.css
 * and are disabled entirely by the global `prefers-reduced-motion` rule.
 *
 * Sits at a negative z-index, fixed to the viewport, with
 * `pointer-events-none` so it never intercepts clicks — every link and
 * button on top of it remains fully interactive.
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-paper">
      <div className="animate-drift-a absolute -left-32 -top-40 h-[560px] w-[560px] rounded-full bg-orange/[0.16] blur-[110px]" />
      <div className="animate-drift-b absolute -right-40 top-24 h-[620px] w-[620px] rounded-full bg-navy/[0.14] blur-[120px]" />
      <div className="animate-drift-c absolute -bottom-48 left-1/3 h-[520px] w-[520px] rounded-full bg-navy-deep/[0.10] blur-[110px]" />
      {/* faint glass sheen so content areas read as frosted panels floating above the blobs */}
      <div className="absolute inset-0 bg-paper/40" />
    </div>
  );
}
