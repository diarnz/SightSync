import { COLORS, arrow, bg, body, flowNode, footer, kicker, panel, text, title } from "./theme.mjs";

export async function slide02(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Audience and intent");
  title(slide, ctx, "SightSync is intended for moments when a fast spoken description is more useful than a full visual interface.");
  body(
    slide,
    ctx,
    "The app is designed around blind and severely visually impaired users who need immediate environmental context, not a long report. The product goal is to reduce friction in everyday decision points: understanding what is ahead, checking if something changed, and asking one targeted follow-up question.",
    64,
    184,
    540,
    106,
    15.5,
  );

  panel(slide, ctx, 64, 320, 552, 288, "#0C1B2D");
  text(slide, ctx, "Best-fit situations", 88, 344, 220, 24, {
    fontSize: 16,
    bold: true,
    color: COLORS.white,
  });
  text(slide, ctx, "1. Approaching a crosswalk or obstacle", 88, 388, 320, 18, {
    fontSize: 12.5,
    bold: true,
    color: COLORS.accent,
  });
  text(slide, ctx, "A short critical warning can be spoken automatically when the model flags hazards or navigation risk.", 88, 410, 458, 36, {
    fontSize: 10.5,
    color: COLORS.muted,
  });
  text(slide, ctx, "2. Checking layout or object placement", 88, 466, 320, 18, {
    fontSize: 12.5,
    bold: true,
    color: COLORS.accent3,
  });
  text(slide, ctx, "Useful for identifying where controls, furniture, or nearby people are relative to the user.", 88, 488, 458, 36, {
    fontSize: 10.5,
    color: COLORS.muted,
  });
  text(slide, ctx, "3. Asking one follow-up question", 88, 544, 320, 18, {
    fontSize: 12.5,
    bold: true,
    color: COLORS.accent2,
  });
  text(slide, ctx, "The chat endpoint supports a short sequence of recent frames, which helps with temporal context instead of relying on a single still image.", 88, 566, 458, 32, {
    fontSize: 10.5,
    color: COLORS.muted,
  });

  flowNode(slide, ctx, 688, 336, 150, 92, "Capture", "single shot or live mode");
  arrow(slide, ctx, 846, 382, 44);
  flowNode(slide, ctx, 894, 336, 150, 92, "Describe", "concise JSON response");
  arrow(slide, ctx, 1052, 382, 44);
  flowNode(slide, ctx, 1100, 336, 114, 92, "Speak", "critical cues first");

  flowNode(slide, ctx, 688, 470, 150, 92, "Ask", "voice or text follow-up");
  arrow(slide, ctx, 846, 516, 44, COLORS.accent3);
  flowNode(slide, ctx, 894, 470, 150, 92, "Answer", "short, spatially precise");
  arrow(slide, ctx, 1052, 516, 44, COLORS.accent3);
  flowNode(slide, ctx, 1100, 470, 114, 92, "Replay", "spoken again on demand");

  footer(
    slide,
    ctx,
    2,
    "Source: README.md, frontend/src/pages/SceneAssistantPage.tsx, backend/app/routers/chat.py",
  );
  return slide;
}
