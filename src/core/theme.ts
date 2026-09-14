/**
 * Theming for the CRT terminal.
 *
 * A theme bundles the full 16-color hardware palette plus the four semantic
 * roles (`background`, `foreground`, `accent`, `dim`) the shell, tty, and
 * processes draw with. The active theme is module state, switched at runtime
 * via `setTheme` (wired to the `theme` shell command).
 */

export type ColorName =
  | "Black"
  | "White"
  | "Red"
  | "Cyan"
  | "Purple"
  | "Green"
  | "Blue"
  | "Yellow"
  | "Orange"
  | "Brown"
  | "LightRed"
  | "DarkGrey"
  | "MediumGrey"
  | "LightGreen"
  | "LightBlue"
  | "LightGrey";

export type ThemeColors = Record<ColorName, string>;

export interface Theme {
  name: string;
  bloomFactor: number;
  /** The 16 named colors of the theme's hardware palette. */
  colors: ThemeColors;
  background: string;
  foreground: string;
  accent: string;
  dim: string;
}

interface ThemeDefinition {
  name: string;
  bloomFactor: number;
  colors: ThemeColors;
  roles: {
    background: ColorName;
    foreground: ColorName;
    accent: ColorName;
    dim: ColorName;
  };
}

/** Resolve role names against the palette into concrete color strings. */
function defineTheme(def: ThemeDefinition): Theme {
  return {
    name: def.name,
    bloomFactor: def.bloomFactor,
    colors: def.colors,
    background: def.colors[def.roles.background]!,
    foreground: def.colors[def.roles.foreground]!,
    accent: def.colors[def.roles.accent]!,
    dim: def.colors[def.roles.dim]!,
  };
}

// VIC-20 palette (the original default).
const VIC20: ThemeColors = {
  Black: "#010402",
  White: "#FFFFFF",
  Red: "#68372B",
  Cyan: "#70A4B2",
  Purple: "#6F3D86",
  Green: "#00FF09",
  Blue: "#352879",
  Yellow: "#B8C76F",
  Orange: "#813300",
  Brown: "#432D00",
  LightRed: "#9A6759",
  DarkGrey: "#222222",
  MediumGrey: "#6C6C6C",
  LightGreen: "#9AD284",
  LightBlue: "#6C5EB5",
  LightGrey: "#959595",
};

// Commodore 64 palette.
const C64: ThemeColors = {
  Black: "#000000",
  White: "#FFFFFF",
  Red: "#880000",
  Cyan: "#AAFFEE",
  Purple: "#CC44CC",
  Green: "#55AA55",
  Blue: "#0000AA",
  Yellow: "#EEEE77",
  Orange: "#DD8855",
  Brown: "#664400",
  LightRed: "#FF7777",
  DarkGrey: "#333333",
  MediumGrey: "#777777",
  LightGreen: "#AAFF66",
  LightBlue: "#0088FF",
  LightGrey: "#BBBBBB",
};

// Nord-inspired dark palette.
const NORD: ThemeColors = {
  Black: "#0B0F14",
  White: "#ECEFF4",
  Red: "#BF616A",
  Cyan: "#88C0D0",
  Purple: "#B48EAD",
  Green: "#A3BE8C",
  Blue: "#5E81AC",
  Yellow: "#EBCB8B",
  Orange: "#D08770",
  Brown: "#4C566A",
  LightRed: "#D08770",
  DarkGrey: "#3B4252",
  MediumGrey: "#4C566A",
  LightGreen: "#A3BE8C",
  LightBlue: "#81A1C1",
  LightGrey: "#D8DEE9",
};

// Light "paper" palette.
const LIGHT: ThemeColors = {
  Black: "#1A1A1A",
  White: "#F5F0E6",
  Red: "#B03A2E",
  Cyan: "#1F8A8C",
  Purple: "#7D3C98",
  Green: "#1E8449",
  Blue: "#2E5F8A",
  Yellow: "#B7950B",
  Orange: "#C96F1A",
  Brown: "#8C5A2B",
  LightRed: "#D98880",
  DarkGrey: "#555555",
  MediumGrey: "#8A8A8A",
  LightGreen: "#7DCEA0",
  LightBlue: "#5DADE2",
  LightGrey: "#BFBFBF",
};

// Green phosphor (P1) palette.
const PHOSPHOR: ThemeColors = {
  Black: "#000000",
  White: "#CFFFCF",
  Red: "#6BFF6B",
  Cyan: "#00FF00",
  Purple: "#4FD04F",
  Green: "#33FF33",
  Blue: "#1FA01F",
  Yellow: "#B8FFB8",
  Orange: "#7FFF7F",
  Brown: "#3F9F3F",
  LightRed: "#9FFF9F",
  DarkGrey: "#1F3F1F",
  MediumGrey: "#4F7F4F",
  LightGreen: "#66FF66",
  LightBlue: "#2FBF2F",
  LightGrey: "#8FCF8F",
};

const themes: Record<string, Theme> = {
  default: defineTheme({
    name: "default",
    bloomFactor: 0.15,
    colors: VIC20,
    roles: {
      background: "Black",
      foreground: "Green",
      accent: "Cyan",
      dim: "DarkGrey",
    },
  }),
  dark: defineTheme({
    name: "dark",
    bloomFactor: 0.15,
    colors: NORD,
    roles: {
      background: "Black",
      foreground: "Green",
      accent: "Cyan",
      dim: "DarkGrey",
    },
  }),
  light: defineTheme({
    name: "light",
    bloomFactor: 0.04,
    colors: LIGHT,
    roles: {
      background: "White",
      foreground: "Black",
      accent: "Red",
      dim: "DarkGrey",
    },
  }),
  retro: defineTheme({
    name: "retro",
    bloomFactor: 0.15,
    colors: PHOSPHOR,
    roles: {
      background: "Black",
      foreground: "LightGreen",
      accent: "Cyan",
      dim: "DarkGrey",
    },
  }),
  commodore: defineTheme({
    name: "commodore",
    bloomFactor: 0.15,
    colors: C64,
    roles: {
      background: "Black",
      foreground: "Yellow",
      accent: "LightBlue",
      dim: "DarkGrey",
    },
  }),
};

let currentTheme: Theme = themes.default!;

/** The active theme (its 16 colors + resolved roles). */
export function getTheme(): Theme {
  return currentTheme;
}

/** The active theme's 16 named colors. */
export function getColors(): ThemeColors {
  return currentTheme.colors;
}

/** Switch the active theme by name. Returns false for an unknown name. */
export function setTheme(name: string): boolean {
  const next = themes[name];
  if (!next) return false;
  currentTheme = next;
  return true;
}

/** Sorted list of available theme names. */
export function themeNames(): string[] {
  return Object.keys(themes).sort();
}
