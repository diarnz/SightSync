import { COLORS, bg, body, checklistItem, footer, kicker, metric, panel, text, title } from "./theme.mjs";

export async function slide04(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Accessibility and safety");
  title(slide, ctx, "The strongest part of the project is not the model call. It is the accessibility discipline wrapped around it.");
  body(
    slide,
    ctx,
    "SightSync is built to be legible, keyboard-navigable, and audio-friendly before it is clever. That matters because the real product promise is trust: the user should know when to listen, when to ask again, and when the app is unsure.",
    64,
    184,
    546,
    88,
    15.5,
  );

  metric(slide, ctx, 64, 306, "aria", "descriptive semantics", "interactive elements expose screen reader labels", COLORS.accent);
  metric(slide, ctx, 320, 306, "role=alert", "immediate error surfacing", "critical errors are announced instead of hidden", COLORS.danger);
  metric(slide, ctx, 576, 306, "fallback", "browser speech synthesis", "audio still works when server speech is unavailable", COLORS.accent3);

  panel(slide, ctx, 64, 410, 560, 200, "#0C1B2D");
  text(slide, ctx, "Implementation choices that directly help the user", 90, 438, 330, 20, {
    fontSize: 16,
    bold: true,
    color: COLORS.white,
  });
  await checklistItem(slide, ctx, "CheckCircle2", "Large 52px button targets reduce precision demands on touch input.", 90, 480);
  await checklistItem(slide, ctx, "CheckCircle2", "Only critical scenes auto-speak, which cuts down on unnecessary chatter.", 90, 510);
  await checklistItem(slide, ctx, "CheckCircle2", "The base font is 18px and the interface stays high-contrast by default.", 90, 540);
  await checklistItem(slide, ctx, "CheckCircle2", "Voice status, loading state, and errors are announced through live regions.", 90, 570);

  panel(slide, ctx, 760, 214, 426, 396, "#0D1D31");
  text(slide, ctx, "Safety logic in plain English", 786, 240, 240, 22, {
    fontSize: 16,
    bold: true,
    color: COLORS.white,
  });
  body(slide, ctx, "The backend prompt forces concise spatial language and separates normal scenes from critical ones. The frontend then uses that `should_speak` flag to decide whether to interrupt with audio or wait for the user to request replay.", 786, 274, 362, 74, 13);

  panel(slide, ctx, 786, 372, 156, 170, "#12263D");
  text(slide, ctx, "Normal", 808, 394, 90, 18, {
    fontSize: 14,
    bold: true,
    color: COLORS.accent,
  });
  body(slide, ctx, "Describe the scene, tag objects, and leave playback under user control.", 808, 422, 112, 62, 11);

  panel(slide, ctx, 962, 372, 196, 170, "#2B1622", "#64324B");
  text(slide, ctx, "Critical", 984, 394, 90, 18, {
    fontSize: 14,
    bold: true,
    color: "#FF8EA1",
  });
  body(slide, ctx, "Speak automatically only for hazards such as obstacles, vehicles, stairs, drop-offs, or warning cues.", 984, 422, 140, 62, 11, "#E9C7D2");

  footer(
    slide,
    ctx,
    4,
    "Source: README.md accessibility section, backend/app/services/gemini_service.py, backend/app/routers/image_analysis.py",
  );
  return slide;
}
