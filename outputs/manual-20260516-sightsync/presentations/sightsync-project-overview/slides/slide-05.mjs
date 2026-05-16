import { COLORS, arrow, bg, body, flowNode, footer, kicker, panel, text, title } from "./theme.mjs";

export async function slide05(presentation, ctx) {
  const slide = presentation.slides.add();
  bg(slide, ctx);
  kicker(slide, ctx, "Architecture");
  title(slide, ctx, "Under the hood, SightSync is a compact multimodal pipeline with clear handoffs between UI, API, model, and speech.");
  body(
    slide,
    ctx,
    "The system is small enough to understand end to end: the client owns capture and interaction, the API owns validation and response shaping, OpenRouter handles image reasoning, and speech can come from Camb AI or the browser fallback.",
    64,
    184,
    620,
    80,
    15.5,
  );

  flowNode(slide, ctx, 70, 328, 174, 108, "Frontend", "React + TypeScript\nwebcam, voice control,\nchat panel, TTS");
  arrow(slide, ctx, 252, 382, 48);
  flowNode(slide, ctx, 304, 328, 174, 108, "FastAPI", "upload validation,\nconfidence heuristic,\nstructured response");
  arrow(slide, ctx, 486, 382, 48);
  flowNode(slide, ctx, 538, 328, 200, 108, "OpenRouter", "Gemma multimodal\nscene analysis and\nscene Q&A");
  arrow(slide, ctx, 746, 382, 48, COLORS.accent3);
  flowNode(slide, ctx, 798, 328, 162, 108, "TTS", "Camb AI WAV\nor browser\nSpeechSynthesis");
  arrow(slide, ctx, 968, 382, 48, COLORS.accent2);
  flowNode(slide, ctx, 1020, 328, 188, 108, "User feedback", "description, tags,\nurgency, playback,\nfollow-up answer");

  panel(slide, ctx, 64, 500, 520, 118, "#0C1B2D");
  text(slide, ctx, "Notable implementation details", 90, 524, 230, 20, {
    fontSize: 15.5,
    bold: true,
    color: COLORS.white,
  });
  body(slide, ctx, "The backend retries across fallback models when the provider is temporarily overloaded, limits image size to 10 MB, and keeps the output deliberately structured so the frontend does not have to parse free-form prose.", 90, 552, 452, 48, 12.5);

  panel(slide, ctx, 620, 500, 566, 118, "#0C1B2D");
  text(slide, ctx, "Deployment shape", 646, 524, 170, 20, {
    fontSize: 15.5,
    bold: true,
    color: COLORS.white,
  });
  body(slide, ctx, "The repo ships with Dockerfiles for both services and a deploy script that publishes `sightsync-api` and `sightsync-web` to Google Cloud Run. That makes the project lightweight to demo and easy to evolve into a hosted MVP.", 646, 552, 502, 48, 12.5);

  footer(
    slide,
    ctx,
    5,
    "Source: backend/main.py, backend/app/routers/image_analysis.py, backend/app/services/gemini_service.py, scripts/deploy-cloud-run.sh",
  );
  return slide;
}
