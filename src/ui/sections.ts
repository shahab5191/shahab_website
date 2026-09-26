import { icon } from "./icons";

export interface Piece {
  render: () => HTMLElement;
}

export interface SectionDef {
  id: string;
  short: string;
  label: string;
  title: string;
  subtitle: string;
  pieces: Piece[];
}

type PieceSize = "large" | "small";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function reveal<T extends HTMLElement>(node: T): T {
  node.classList.add("reveal");
  return node;
}

function pieceShell(build: (inner: HTMLElement) => void): HTMLElement {
  const piece = el("article", "piece");
  const inner = el("div", "piece-inner");
  build(inner);
  piece.appendChild(inner);
  return piece;
}

export function textPiece(
  text: string,
  size: PieceSize,
  iconName?: string,
): Piece {
  return {
    render: () =>
      pieceShell((inner) => {
        if (iconName) {
          const iconWrap = el("div", "piece-icon");
          iconWrap.appendChild(icon(iconName));
          inner.appendChild(iconWrap);
        }
        inner.appendChild(el("p", `piece-text piece-text--${size}`, text));
      }),
  };
}

export function customPiece(build: (inner: HTMLElement) => void): Piece {
  return { render: () => pieceShell(build) };
}

function duoPiece(
  large: string,
  small: string,
  iconName: string,
  action?: string,
): Piece {
  return customPiece((inner) => {
    const iconWrap = el("div", "piece-icon");
    iconWrap.appendChild(icon(iconName));
    const largeEl = reveal(el("p", "piece-text piece-text--large", large));
    const smallEl = reveal(el("p", "piece-text piece-text--small", small));
    if (action) {
      smallEl.dataset.photos = action;
      smallEl.classList.add("piece-text--action");
    }
    inner.append(iconWrap, largeEl, smallEl);
  });
}

const ABOUT: Array<{
  large: string;
  small: string;
  icon: string;
  action?: string;
}> = [
  {
    large: "I love engineering.",
    small:
      "Not just writing code! the whole process of building something from abstract ideas",
    icon: "code",
  },
  {
    large: "Lately, that means building AI agents and pipelines.",
    small:
      "Teaching systems to read, decide, and act on real, messy data and watching them actually hold up in production.",
    icon: "cloud",
  },
  {
    large: "There's something abstract I chase in architecture.",
    small:
      "A good backend feels like a good sentence, nothing extra, nothing missing, every piece load-bearing.",
    icon: "box",
  },
  {
    large: "Outside of work, my house is loud.",
    small: "3 cats, 2 dogs, and me — usually outnumbered.",
    icon: "home",
    action: "pets",
  },
  {
    large: "I garden.",
    small:
      "There's a similar patience to growing something and debugging something. Both reward showing up daily.",
    icon: "leaf",
  },
  {
    large: "I love rainy and snowy weather.",
    small: "The kind of day that gives you permission to stay in.",
    icon: "rain",
  },
  {
    large: "My favorite place is a cozy corner of a warm room.",
    small:
      "Coffee in hand, something interesting on screen, animals somewhere nearby.",
    icon: "home",
  },
];

function entryPiece(company: string, role: string, dates: string): Piece {
  return customPiece((inner) => {
    const entry = el("div", "entry");
    const head = el("div", "entry-head");
    head.append(
      el("p", "entry-company", company),
      el("p", "entry-dates", dates),
    );
    entry.append(head, el("p", "entry-role", role));
    inner.appendChild(entry);
  });
}

function skillPiece(name: string, tools: Array<[string, string]>): Piece {
  return customPiece((inner) => {
    inner.appendChild(reveal(el("p", "skill-group-title", name)));
    const row = el("div", "tool-row");
    tools.forEach(([iconName, label]) => {
      const tool = el("div", "tool");
      const iconWrap = el("div", "tool-icon");
      iconWrap.appendChild(icon(iconName));
      tool.append(iconWrap, el("span", "tool-name", label));
      row.appendChild(reveal(tool));
    });
    inner.appendChild(row);
  });
}

export const SECTIONS: SectionDef[] = [
  {
    id: "about",
    short: "ABOUT",
    label: "About me",
    title: "About me",
    subtitle: "A short introduction to who I am and what I do.",
    pieces: ABOUT.map((item) =>
      duoPiece(item.large, item.small, item.icon, item.action),
    ),
  },
  {
    id: "experience",
    short: "EXP",
    label: "Experience",
    title: "Experience",
    subtitle: "Where I've worked and what I've delivered.",
    pieces: [
      entryPiece("Company", "Role title", "2025 — Present"),
      entryPiece("Company", "Previous role", "2022 — 2025"),
      entryPiece("Company", "Earlier role", "2019 — 2022"),
    ],
  },
  {
    id: "skills",
    short: "SKILLS",
    label: "Skills",
    title: "Skills",
    subtitle: "Tools and technologies I reach for most.",
    pieces: [
      skillPiece("Backend", [
        ["server", "FastAPI"],
        ["database", "PostgreSQL"],
        ["cloud", "AWS"],
      ]),
      skillPiece("Frontend", [
        ["code", "TypeScript"],
        ["box", "React"],
        ["gear", "Vite"],
      ]),
      skillPiece("DevOps", [
        ["box", "Docker"],
        ["branch", "Git"],
        ["terminal", "Linux"],
      ]),
    ],
  },
  {
    id: "hobbies",
    short: "HOBBIES",
    label: "Hobbies",
    title: "Hobbies",
    subtitle: "What I do when I'm not at a keyboard.",
    pieces: [
      textPiece("Reading", "large", "book"),
      textPiece("Cycling", "large", "bike"),
      textPiece("Photography", "large", "camera"),
      textPiece("Cooking", "large", "coffee"),
    ],
  },
  {
    id: "contact",
    short: "CONTACT",
    label: "Contact",
    title: "Contact me",
    subtitle:
      "Let's talk — I'm open to interesting problems and conversations.",
    pieces: [
      textPiece(
        "Have something in mind? I'm always up for a good problem.",
        "small",
        "spark",
      ),
      customPiece((inner) => {
        const mail = el("a", "contact-link", "oveysi.shahab@gmail.com");
        mail.href = "mailto:oveysi.shahab@gmail.com";
        const links = el("div", "contact-links");
        const items: Array<[string, string]> = [
          ["https://github.com/shahab5191/shahab_resume/", "GitHub"],
          ["https://www.linkedin.com/in/shahab-oveysi/", "LinkedIn"],
          ["./shahabedin-oveysi-cv.pdf", "CV"],
        ];
        items.forEach(([href, label]) => {
          const link = el("a", "contact-link contact-link--dim", label);
          link.href = href;
          link.target = "_blank";
          link.rel = "noreferrer";
          links.appendChild(link);
        });
        inner.append(mail, links);
      }),
    ],
  },
];
