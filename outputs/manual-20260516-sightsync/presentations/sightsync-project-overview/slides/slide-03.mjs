import { COLORS, bg, body, footer, kicker, panel, phoneFrame, text, title } from "./theme.mjs";

export async function slide03(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Product experience");
  title(slide, ctx, "The interface is simple on purpose: one camera view, four big controls, and audio-first feedback.");

  phoneFrame(slide, ctx, 74, 178, 370, 438);
  text(slide, ctx, "SightSync", 196, 204, 130, 24, {
    fontSize: 21,
    bold: true,
    color: COLORS.white,
    serif: true,
    align: "center",
  });
  text(slide, ctx, "Live Scene Description Assistant", 140, 230, 238, 16, {
    fontSize: 9.5,
    color: COLORS.muted,
    align: "center",
  });
  panel(slide, ctx, 100, 264, 318, 180, "#13243B", "#2E4A69");
  text(slide, ctx, "LIVE", 122, 284, 46, 18, {
    fontSize: 10,
    bold: true,
    color: COLORS.danger,
  });
  text(slide, ctx, "Voice On", 338, 284, 54, 18, {
    fontSize: 10,
    bold: true,
    color: COLORS.success,
    align: "right",
  });
  text(slide, ctx, "Camera feed with change detection prevents unnecessary API calls when the scene stays stable.", 126, 382, 264, 40, {
    fontSize: 10.5,
    color: "#B8C8D8",
    align: "center",
  });
  panel(slide, ctx, 100, 462, 148, 56, "#19436A", "#19436A");
  panel(slide, ctx, 270, 462, 148, 56, "#14283F", "#2A4662");
  panel(slide, ctx, 100, 534, 148, 56, "#14283F", "#2A4662");
  panel(slide, ctx, 270, 534, 148, 56, "#14283F", "#2A4662");
  text(slide, ctx, "Start Live", 100, 482, 148, 16, {
    fontSize: 12.5,
    bold: true,
    color: COLORS.white,
    align: "center",
  });
  text(slide, ctx, "Capture", 270, 482, 148, 16, {
    fontSize: 12.5,
    bold: true,
    color: COLORS.text,
    align: "center",
  });
  text(slide, ctx, "Audio On", 100, 554, 148, 16, {
    fontSize: 12.5,
    bold: true,
    color: COLORS.text,
    align: "center",
  });
  text(slide, ctx, "Voice Off", 270, 554, 148, 16, {
    fontSize: 12.5,
    bold: true,
    color: COLORS.text,
    align: "center",
  });

  panel(slide, ctx, 504, 194, 656, 114, "#0D1D31");
  text(slide, ctx, "Core workflow", 532, 218, 160, 20, {
    fontSize: 15,
    bold: true,
    color: COLORS.white,
  });
  body(slide, ctx, "The frontend grabs a frame immediately, keeps a rolling buffer for follow-up questions, then speaks only when the backend marks the scene as critical.", 532, 246, 594, 42, 13.5, COLORS.muted);

  panel(slide, ctx, 504, 334, 206, 112, "#12263D");
  text(slide, ctx, "Live mode", 526, 356, 120, 18, {
    fontSize: 13.5,
    bold: true,
    color: COLORS.accent,
  });
  body(slide, ctx, "Runs every second and uses pixel-level change detection before sending another frame.", 526, 382, 158, 40, 10.5);

  panel(slide, ctx, 728, 334, 206, 112, "#12263D");
  text(slide, ctx, "Voice commands", 750, 356, 130, 18, {
    fontSize: 13.5,
    bold: true,
    color: COLORS.accent3,
  });
  body(slide, ctx, "Understands commands like analyze, start live, stop live, replay audio, and switch camera.", 750, 382, 158, 40, 10.5);

  panel(slide, ctx, 952, 334, 208, 112, "#12263D");
  text(slide, ctx, "Chat follow-up", 974, 356, 128, 18, {
    fontSize: 13.5,
    bold: true,
    color: COLORS.accent2,
  });
  body(slide, ctx, "Uses recent frames so the user can ask what changed or where something is without re-capturing.", 974, 382, 162, 40, 10.5);

  panel(slide, ctx, 504, 472, 656, 126, "#0D1D31");
  text(slide, ctx, "Why this interaction model works", 532, 496, 280, 20, {
    fontSize: 15,
    bold: true,
    color: COLORS.white,
  });
  body(slide, ctx, "The page avoids dense controls and keeps the interaction loop predictable: capture, hear the scene, ask a narrow question, repeat. That makes it more usable under stress than a visually busy assistant UI.", 532, 526, 596, 48, 12.5);

  footer(
    slide,
    ctx,
    3,
    "Source: frontend/src/pages/SceneAssistantPage.tsx, frontend/src/hooks/useVoiceControl.ts, frontend/src/hooks/useTTS.ts",
  );
  return slide;
}
