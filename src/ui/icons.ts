const ICONS: Record<string, string> = {
  code: '<path d="M8 6 3 12l5 6M16 6l5 6-5 6" />',
  cloud:
    '<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 18Z" />',
  database:
    '<ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />',
  server:
    '<rect x="4" y="4" width="16" height="7" rx="2" /><rect x="4" y="13" width="16" height="7" rx="2" /><path d="M8 7.5h.01M8 16.5h.01" />',
  terminal: '<path d="M5 7l4 5-4 5M12 17h7" />',
  gear:
    '<circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" />',
  branch:
    '<circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="12" r="2.5" /><path d="M6 8.5v7M8.5 6H14a4 4 0 0 1 4 4v.5" />',
  box: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M4 7.5l8 4.5 8-4.5M12 12v9" />',
  spark:
    '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8" />',
  home: '<path d="M4 11l8-7 8 7" /><path d="M6 10v9h12v-9" /><path d="M10 19v-5h4v5" />',
  paw: '<circle cx="7" cy="9" r="1.8" /><circle cx="12" cy="7" r="1.8" /><circle cx="17" cy="9" r="1.8" /><path d="M12 12c3 0 5 2 5 4a3 3 0 0 1-5 2 3 3 0 0 1-5-2c0-2 2-4 5-4Z" />',
  leaf: '<path d="M5 19c0-8 5-13 14-13 0 9-5 14-13 14" /><path d="M5 19c3-5 6-8 10-10" />',
  rain: '<path d="M7 15h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 15Z" /><path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" />',
  coffee:
    '<path d="M5 9h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V9Z" /><path d="M16 10h2a2 2 0 0 1 0 4h-2" /><path d="M8 5c0-1 1-1 1-2M12 5c0-1 1-1 1-2" />',
  book: '<path d="M5 5a2 2 0 0 1 2-2h11v16H7a2 2 0 0 0-2 2V5Z" /><path d="M5 19a2 2 0 0 1 2-2h11" />',
  bike: '<circle cx="6" cy="17" r="3" /><circle cx="18" cy="17" r="3" /><path d="M6 17l4-7h4l3 7M10 10h5M9 13h7" />',
  camera:
    '<path d="M4 8h3l1.5-2h7L17 8h3v11H4V8Z" /><circle cx="12" cy="13" r="3.5" />',
};

export function iconMarkup(name: string): string {
  return ICONS[name] ?? ICONS.box!;
}

export function icon(name: string): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.5");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  svg.classList.add("icon");
  svg.innerHTML = iconMarkup(name);
  return svg;
}
