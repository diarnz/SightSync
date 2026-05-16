export const COLORS = {
  bg: "#07111F",
  bg2: "#0D182B",
  panel: "#10233A",
  panel2: "#122B45",
  border: "#294562",
  text: "#F3F7FB",
  muted: "#9FB3C8",
  accent: "#4DA3FF",
  accent2: "#7C6CFF",
  accent3: "#30D5C8",
  success: "#32C48D",
  warn: "#FFB547",
  danger: "#FF6B6B",
  white: "#FFFFFF",
  dark: "#05101C",
};

export function line(ctx, fill = COLORS.border, width = 1) {
  return ctx.line(fill, width);
}

export function bg(slide, ctx) {
  ctx.addShape(slide, { left: 0, top: 0, width: ctx.W, height: ctx.H, fill: COLORS.bg });
  ctx.addShape(slide, { left: 0, top: 0, width: ctx.W, height: 188, fill: "#0A1730" });
  ctx.addShape(slide, { left: 960, top: 0, width: 320, height: ctx.H, fill: "#081523" });
}

export function panel(slide, ctx, left, top, width, height, fill = COLORS.panel, border = COLORS.border) {
  return ctx.addShape(slide, {
    left,
    top,
    width,
    height,
    fill,
    line: line(ctx, border, 1),
  });
}

export function text(slide, ctx, value, left, top, width, height, options = {}) {
  return ctx.addText(slide, {
    text: value,
    left,
    top,
    width,
    height,
    fontSize: options.fontSize ?? 18,
    color: options.color ?? COLORS.text,
    bold: Boolean(options.bold),
    typeface: options.typeface ?? (options.serif ? "Aptos Display" : "Aptos"),
    align: options.align ?? "left",
    valign: options.valign ?? "top",
    fill: options.fill ?? "#00000000",
    line: options.line ?? line(ctx, "#00000000", 0),
    insets: options.insets ?? { left: 0, right: 0, top: 0, bottom: 0 },
    name: options.name,
  });
}

export function kicker(slide, ctx, value) {
  ctx.addShape(slide, { left: 64, top: 48, width: 10, height: 10, fill: COLORS.accent3 });
  text(slide, ctx, value.toUpperCase(), 84, 43, 260, 18, {
    fontSize: 10,
    color: COLORS.muted,
    bold: true,
  });
}

export function title(slide, ctx, value, width = 760) {
  text(slide, ctx, value, 64, 78, width, 96, {
    fontSize: 33,
    bold: true,
    serif: true,
    color: COLORS.white,
  });
}

export function body(slide, ctx, value, left, top, width, height, fontSize = 17, color = COLORS.muted) {
  return text(slide, ctx, value, left, top, width, height, { fontSize, color });
}

export function footer(slide, ctx, page, source) {
  ctx.addShape(slide, { left: 64, top: 684, width: 1152, height: 1, fill: COLORS.border });
  text(slide, ctx, source, 64, 691, 980, 14, { fontSize: 8, color: "#7E96B0" });
  text(slide, ctx, String(page).padStart(2, "0"), 1168, 687, 48, 18, {
    fontSize: 11,
    bold: true,
    serif: true,
    align: "right",
    color: COLORS.muted,
  });
}

export function pill(slide, ctx, value, left, top, width, fill, color = COLORS.white) {
  panel(slide, ctx, left, top, width, 28, fill, fill);
  text(slide, ctx, value, left + 10, top + 6, width - 20, 16, {
    fontSize: 9.5,
    bold: true,
    color,
    align: "center",
  });
}

export function metric(slide, ctx, left, top, value, label, note, accent = COLORS.accent) {
  ctx.addShape(slide, { left, top: top + 2, width: 4, height: 58, fill: accent });
  text(slide, ctx, value, left + 14, top, 176, 28, {
    fontSize: 26,
    bold: true,
    serif: true,
    color: COLORS.white,
  });
  text(slide, ctx, label, left + 14, top + 31, 190, 14, {
    fontSize: 9.5,
    bold: true,
    color: COLORS.muted,
  });
  text(slide, ctx, note, left + 14, top + 45, 210, 16, {
    fontSize: 8.5,
    color: "#7E96B0",
  });
}

export async function iconLabel(slide, ctx, icon, label, note, left, top, accent = COLORS.accent) {
  panel(slide, ctx, left, top, 250, 96, COLORS.panel2);
  ctx.addShape(slide, { left: left + 18, top: top + 18, width: 38, height: 38, fill: "#16314B" });
  await ctx.addLucideIcon(slide, {
    icon,
    left: left + 26,
    top: top + 26,
    width: 22,
    height: 22,
    color: accent,
  });
  text(slide, ctx, label, left + 72, top + 18, 150, 20, {
    fontSize: 13.5,
    bold: true,
    color: COLORS.white,
  });
  text(slide, ctx, note, left + 72, top + 42, 158, 32, {
    fontSize: 10.5,
    color: COLORS.muted,
  });
}

export async function checklistItem(slide, ctx, icon, label, left, top, accent = COLORS.success) {
  await ctx.addLucideIcon(slide, {
    icon,
    left,
    top,
    width: 16,
    height: 16,
    color: accent,
  });
  text(slide, ctx, label, left + 24, top - 1, 460, 18, {
    fontSize: 11.5,
    color: COLORS.text,
  });
}

export function flowNode(slide, ctx, left, top, width, height, titleText, note, fill = COLORS.panel2) {
  panel(slide, ctx, left, top, width, height, fill);
  text(slide, ctx, titleText, left + 14, top + 12, width - 28, 22, {
    fontSize: 14,
    bold: true,
    color: COLORS.white,
    align: "center",
  });
  text(slide, ctx, note, left + 16, top + 38, width - 32, height - 48, {
    fontSize: 10.5,
    color: COLORS.muted,
    align: "center",
  });
}

export function arrow(slide, ctx, left, top, width, color = COLORS.accent) {
  ctx.addShape(slide, { left, top, width, height: 2, fill: color });
  ctx.addShape(slide, { left: left + width - 8, top: top - 4, width: 8, height: 8, fill: color });
}

export function phoneFrame(slide, ctx, left, top, width, height) {
  ctx.addShape(slide, { left, top, width, height, fill: COLORS.dark, line: line(ctx, "#35597E", 2) });
  ctx.addShape(slide, { left: left + width / 2 - 28, top: top + 10, width: 56, height: 6, fill: "#1E344D" });
  ctx.addShape(slide, { left: left + 14, top: top + 28, width: width - 28, height: height - 42, fill: "#0E1E31" });
}
