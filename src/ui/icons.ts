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
  snow: '<path d="M12 3v18M3 12h18M6 6l12 12M18 6 6 18" />',
  crab:
    '<path d="M12 9c-2 0-3.5 1.5-3.5 3.5v3h7v-3C15.5 10.5 14 9 12 9Z" /><path d="M8.5 12.5H5l-1.5-3M15.5 12.5H19l1.5-3" /><path d="M5 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM19 9.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" /><path d="M12 12v3M9.5 12l-1.5 2.5M14.5 12l1.5 2.5" />',
  bolt: '<path d="M13 3 5 14h6l-1 7 8-11h-6l1-7Z" />',
  flask:
    '<path d="M10 3h4M11 3v5l-5 8a2 2 0 0 0 1.8 3h8.4a2 2 0 0 0 1.8-3l-5-8V3" />',
  wind: '<path d="M4 8h9a2.5 2.5 0 1 0-2.5-2.5M4 12h13a2.5 2.5 0 1 1-2.5 2.5M4 16h6" />',
  layers:
    '<path d="M12 3 3 8l9 5 9-5-9-5Z" /><path d="M3 12l9 5 9-5" /><path d="M3 16l9 5 9-5" />',
  grid:
    '<rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" />',
  cube: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />',
  stack:
    '<rect x="4" y="4" width="16" height="5" rx="1" /><rect x="4" y="10" width="16" height="5" rx="1" /><rect x="4" y="16" width="16" height="5" rx="1" />',
  braces:
    '<path d="M8 4c-2 0-3 1.2-3 3v3c0 1.5-1 2-1 2s1 .5 1 2v3c0 1.8 1 3 3 3M16 4c2 0 3 1.2 3 3v3c0 1.5 1 2 1 2s-1 .5-1 2v3c0 1.8-1 3-3 3" />',
  hex: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" />',
  hexinner:
    '<path d="M12 6.5l5.5 3v6L12 18.5l-5.5-3v-6L12 6.5Z" />',
  queue:
    '<rect x="4" y="5" width="16" height="4" rx="1" /><rect x="4" y="11" width="16" height="4" rx="1" /><rect x="4" y="17" width="16" height="4" rx="1" />',
  route:
    '<circle cx="6" cy="6" r="2" /><circle cx="18" cy="18" r="2" /><path d="M8 6h5a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3" />',
  socket:
    '<path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z" /><path d="M12 3v9l6 4" />',
  node:
    '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M8.5 9.5l7 5M8.5 14.5l7-5" />',
  graphql:
    '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="M12 8l5 8M12 16l-5-8M7 8l10 8" />',
  elephant:
    '<circle cx="15" cy="9" r="3.5" /><path d="M18.5 9c0-3-2-5-4.5-5-3 0-5 2.5-5 5v3" /><path d="M9 12c-3 0-4 1-4 3v1c0 2 1 3 3 3h9" />',
  redis:
    '<rect x="9" y="3" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /><rect x="9" y="15" width="6" height="6" rx="1" /><path d="M6 6l3 3M18 6l-3 3M6 12l3 3M18 12l-3 3M6 18l3 3M18 18l-3 3" />',
  leafmark:
    '<path d="M12 21c0-9 4-15 10-16-1 7-6 16-10 16Z" /><path d="M12 21c0-6-2-9-6-11" />',
  container:
    '<rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 9h18" /><path d="M8 12h2M14 12h2M8 15h2M14 15h2" />',
  kubernetes:
    '<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2.5" /><path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21M5.6 5.6l4.6 4.6M13.8 13.8l4.6 4.6M18.4 5.6l-4.6 4.6M10.2 13.8l-4.6 4.6" />',
  diamond:
    '<path d="M12 3l8 9-8 9-8-9 8-9Z" /><path d="M12 7l3.5 5L12 17l-3.5-5L12 7Z" />',
  bucket:
    '<path d="M4 9h16l-1 11H5L4 9Z" /><path d="M8 9V7a4 4 0 0 1 8 0v2" />',
  lambda:
    '<path d="M5 5l6 14 3-7 2 3h3" />',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 4 1 5 1 5H5s1-1 1-5" /><path d="M10 18a2 2 0 0 0 4 0" />',
  eye: '<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" />',
  key: '<circle cx="8" cy="14" r="4" /><path d="M11 11l8-8M17 5l2 2M14 8l2 2" />',
  construction:
    '<rect x="3" y="8" width="18" height="12" rx="1" /><path d="M3 8l9-6 9 6" /><path d="M9 20v-4h6v4" />',
  palette:
    '<path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.8 1.5-1.5 0-.5-.2-.8-.5-1.1-.3-.3-.5-.6-.5-1.1 0-.9.8-1.6 1.7-1.6H17a4 4 0 0 0 4-4c0-4.4-4-8.7-9-8.7Z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" />',
  bot: '<rect x="4" y="8" width="16" height="12" rx="2" /><path d="M12 8V4M9 4h6" /><circle cx="9" cy="13" r="1" /><circle cx="15" cy="13" r="1" /><path d="M9 17h6" />',
  pipeline:
    '<rect x="3" y="10" width="6" height="4" rx="1" /><rect x="15" y="10" width="6" height="4" rx="1" /><path d="M9 12h6M12 12v-3M12 15v3" />',
  blueprint:
    '<rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 10h16M10 10v10M4 16h6" />',
  flow: '<path d="M4 6h10a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3M17 15l3 3-3 3" />',
  clock: '<circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />',
  serverless:
    '<path d="M7 18h10a4 4 0 0 0 .5-8 6 6 0 0 0-11.5 1.5A3.5 3.5 0 0 0 7 18Z" /><path d="M12 11v6" />',
  apicode:
    '<path d="M8 6 3 12l5 6M16 6l5 6-5 6" /><path d="M12 5v14" />',
  merge:
    '<circle cx="6" cy="6" r="2.5" /><circle cx="6" cy="18" r="2.5" /><circle cx="18" cy="12" r="2.5" /><path d="M6 8.5v7M6 12h9.5" />',
  pipeline2:
    '<rect x="3" y="4" width="5" height="5" rx="1" /><rect x="16" y="15" width="5" height="5" rx="1" /><path d="M8 6.5h6a2 2 0 0 1 2 2V15" />',
  play: '<path d="M8 5v14l11-7L8 5Z" />',
  gearbox:
    '<circle cx="12" cy="12" r="3" /><circle cx="5" cy="6" r="2" /><circle cx="19" cy="6" r="2" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="18" r="2" />',
  target:
    '<circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" />',
  check:
    '<rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 12l3 3 5-6" />',
  flasktest:
    '<path d="M10 3h4M11 3v5l-5 8a2 2 0 0 0 1.8 3h8.4a2 2 0 0 0 1.8-3l-5-8V3" /><path d="M8 14h8" />',
  ts: '<rect x="4" y="4" width="16" height="16" rx="3" /><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" font-family="monospace" fill="currentColor" stroke="none">TS</text>',
  js: '<rect x="4" y="4" width="16" height="16" rx="3" /><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" font-family="monospace" fill="currentColor" stroke="none">JS</text>',
  py: '<rect x="4" y="4" width="16" height="16" rx="3" /><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" font-family="monospace" fill="currentColor" stroke="none">Py</text>',
  cpp: '<rect x="4" y="4" width="16" height="16" rx="3" /><text x="12" y="16" text-anchor="middle" font-size="10" font-weight="700" font-family="monospace" fill="currentColor" stroke="none">C++</text>',
  go: '<circle cx="12" cy="12" r="8" /><text x="12" y="15.5" text-anchor="middle" font-size="11" font-weight="700" font-family="monospace" fill="currentColor" stroke="none">Go</text>',
};

const TOOL_ICONS: Record<string, string> = {
  fastapi: "bolt",
  "node.js": "node",
  nodejs: "node",
  express: "route",
  flask: "flask",
  django: "gearbox",
  graphql: "graphql",
  grpc: "flow",
  rabbitmq: "queue",
  "socket.io": "socket",
  microservices: "grid",
  python: "py",
  typescript: "ts",
  javascript: "js",
  go: "go",
  "c/c++": "cpp",
  c: "cpp",
  "c++": "cpp",
  rust: "crab",
  java: "coffee",
  snowflake: "snow",
  postgresql: "elephant",
  redis: "redis",
  mongodb: "leafmark",
  sqlalchemy: "database",
  prisma: "database",
  lambda: "lambda",
  sqs: "queue",
  s3: "bucket",
  sns: "bell",
  ec2: "server",
  bedrock: "box",
  cloudwatch: "eye",
  ecr: "container",
  iam: "key",
  cdk: "construction",
  terraform: "diamond",
  react: "box",
  "next.js": "box",
  angular: "hex",
  "tailwind css": "wind",
  mui: "palette",
  vite: "bolt",
  "prompt engineering": "spark",
  "claude (anthropic) via aws bedrock": "bot",
  "ai pipeline architecture": "pipeline",
  "industrial ai solutions": "gear",
  "spec-driven development": "blueprint",
  "llm integration": "spark",
  "solution architecture": "blueprint",
  "clean architecture": "layers",
  "system design": "grid",
  "event-driven": "flow",
  "async patterns": "clock",
  serverless: "serverless",
  "api design": "apicode",
  "industrial data platforms": "database",
  docker: "container",
  kubernetes: "kubernetes",
  "gitlab ci/cd": "pipeline2",
  jenkins: "play",
  "github actions": "merge",
  linux: "terminal",
  bash: "terminal",
  "tdd/bdd": "target",
  pytest: "flasktest",
  jest: "check",
  cypress: "target",
  "e2e testing": "check",
  unittest: "check",
};

function normalizeTool(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

export function iconForTool(name: string): string {
  return TOOL_ICONS[normalizeTool(name)] ?? "box";
}

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
