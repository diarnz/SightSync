import { COLORS, bg, body, footer, kicker, metric, panel, pill, text, title } from "./theme.mjs";

export async function slide01(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Project overview");
  title(slide, ctx, "SightSync turns a phone camera into a live scene description assistant.");
  body(
    slide,
    ctx,
    "A lightweight accessibility app for blind and low-vision users that captures the scene, asks a multimodal model for a concise description, and speaks back only when the moment matters.",
    64,
    186,
    522,
    90,
    16,
  );

  pill(slide, ctx, "ACCESSIBILITY-FIRST", 64, 294, 134, "#183B57");
  pill(slide, ctx, "VOICE + CAMERA", 208, 294, 126, "#133D47");
  pill(slide, ctx, "REAL-TIME MONITORING", 344, 294, 158, "#2A2666");

  metric(slide, ctx, 64, 356, "1s", "live scene check cadence", "change detection avoids redundant calls", COLORS.accent);
  metric(slide, ctx, 316, 356, "52px", "minimum touch target", "kept intentionally large for accessibility", COLORS.accent3);
  metric(slide, ctx, 568, 356, "<300", "spoken description budget", "optimized for direct, low-friction audio", COLORS.accent2);

  panel(slide, ctx, 776, 64, 438, 556, "#0B1728", "#314A69");
  await ctx.addImage(slide, {
    path: "/Users/bardhhasani/Desktop/Projects/SightSync/frontend/src/assets/hero.png",
    left: 872,
    top: 98,
    width: 256,
    height: 268,
    fit: "contain",
    alt: "SightSync brand illustration",
  });
  text(slide, ctx, "What it is built for", 812, 402, 220, 22, {
    fontSize: 15,
    bold: true,
    color: COLORS.white,
  });
  text(slide, ctx, "Quick scene understanding", 812, 438, 164, 18, {
    fontSize: 11.5,
    bold: true,
    color: COLORS.accent,
  });
  text(slide, ctx, "Street crossings, room orientation, obstacles, and other moments where a short spoken cue can reduce uncertainty.", 812, 458, 180, 60, {
    fontSize: 10.5,
    color: COLORS.muted,
  });
  text(slide, ctx, "Follow-up questions", 1010, 438, 164, 18, {
    fontSize: 11.5,
    bold: true,
    color: COLORS.accent3,
  });
  text(slide, ctx, "The user can ask the app about controls, objects, or layout using the current frame buffer instead of starting over.", 1010, 458, 174, 60, {
    fontSize: 10.5,
    color: COLORS.muted,
  });
  text(slide, ctx, "Built as", 812, 526, 120, 18, {
    fontSize: 11.5,
    bold: true,
    color: COLORS.white,
  });
  text(slide, ctx, "React + TypeScript frontend, FastAPI backend, OpenRouter multimodal analysis, optional Camb AI speech, and Cloud Run deployment.", 812, 548, 330, 44, {
    fontSize: 10.5,
    color: COLORS.muted,
  });

  footer(
    slide,
    ctx,
    1,
    "Source: /Users/bardhhasani/Desktop/Projects/SightSync/README.md and frontend/src/assets/hero.png",
  );
  return slide;
}
