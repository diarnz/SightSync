import { COLORS, bg, body, footer, kicker, panel, text, title } from "./theme.mjs";

export async function slide06(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Where it goes next");
  title(slide, ctx, "SightSync already has a credible MVP story, and the next steps are easy to explain.");
  body(
    slide,
    ctx,
    "The project is already clear about its lane: scene description and short scene Q&A. That focus is a strength. It means the roadmap can stay grounded in accessibility instead of drifting into vague 'AI assistant' territory.",
    64,
    184,
    566,
    84,
    15.5,
  );

  panel(slide, ctx, 64, 300, 276, 294, "#0C1B2D");
  text(slide, ctx, "Best for today", 90, 326, 160, 22, {
    fontSize: 16,
    bold: true,
    color: COLORS.white,
  });
  text(slide, ctx, "• immediate scene summaries", 90, 370, 180, 16, {
    fontSize: 11.5,
    color: COLORS.accent,
  });
  text(slide, ctx, "• critical hazard cues", 90, 400, 180, 16, {
    fontSize: 11.5,
    color: COLORS.accent,
  });
  text(slide, ctx, "• object and layout questions", 90, 430, 200, 16, {
    fontSize: 11.5,
    color: COLORS.accent,
  });
  text(slide, ctx, "• quick hosted demos", 90, 460, 170, 16, {
    fontSize: 11.5,
    color: COLORS.accent,
  });
  body(slide, ctx, "In other words: it is strong as an assistive interpretation layer that helps the user understand a moment, then decide what to do next.", 90, 500, 214, 64, 11);

  panel(slide, ctx, 362, 300, 376, 310, "#0C1B2D");
  text(slide, ctx, "Next MVP milestones", 388, 326, 190, 22, {
    fontSize: 16,
    bold: true,
    color: COLORS.white,
  });
  text(slide, ctx, "1. Audio-only mode", 388, 370, 170, 16, {
    fontSize: 12,
    bold: true,
    color: COLORS.accent3,
  });
  body(slide, ctx, "Skip the visual UI entirely for headphone-first use.", 388, 392, 292, 24, 10.5);
  text(slide, ctx, "2. Firestore history", 388, 432, 170, 16, {
    fontSize: 12,
    bold: true,
    color: COLORS.accent3,
  });
  body(slide, ctx, "Keep recent scene descriptions with timestamps for recall.", 388, 454, 292, 24, 10.5);
  text(slide, ctx, "3. Optional login", 388, 494, 170, 16, {
    fontSize: 12,
    bold: true,
    color: COLORS.accent3,
  });
  body(slide, ctx, "Save history without blocking anonymous usage.", 388, 516, 292, 24, 10.5);
  text(slide, ctx, "4. Navigation assistance", 388, 550, 190, 16, {
    fontSize: 12,
    bold: true,
    color: COLORS.accent3,
  });
  body(slide, ctx, "Expand obstacle detection and directional suggestions carefully.", 388, 572, 292, 24, 10.5);

  panel(slide, ctx, 760, 300, 424, 294, "#0D1D31");
  text(slide, ctx, "Good presenter framing", 786, 326, 180, 22, {
    fontSize: 16,
    bold: true,
    color: COLORS.white,
  });
  body(slide, ctx, "If you are presenting this project, the strongest line is simple: SightSync is meant to give blind and low-vision users immediate spoken context from the world in front of them, with as little interface friction as possible.", 786, 366, 356, 86, 13);
  body(slide, ctx, "That framing keeps the deck honest. It positions the app as assistive and practical, not fully autonomous, while still making the technical work feel ambitious and real.", 786, 484, 356, 70, 13, "#C1CFDD");

  footer(
    slide,
    ctx,
    6,
    "Source: README.md suggested next MVP milestone section and current frontend/backend implementation",
  );
  return slide;
}
