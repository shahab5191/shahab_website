import { icon, iconForTool } from "./icons";

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
    small: "3 cats, 2 dogs, basically a pet house.",
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

interface HighlightGroup {
  highlights: string[];
}

interface Position {
  company: string;
  location: string;
  role: string;
  period: string;
  highlights: string[];
  groups?: HighlightGroup[];
}

const POSITIONS: Position[] = [
  {
    company: "Xeneta",
    location: "Norway - Hybrid",
    role: "Senior Software Engineer",
    period: "Jan 2025 – Present",
    highlights: [
      "Solved a years-long industrial data problem: designed and built an AI pipeline (AWS Bedrock) that automatically transforms arbitrary customer freight rate sheets into a standardised format, with 100% data accuracy and a 95% success rate across real Fortune 500 customer files.",
      "Architected the IRM Rate Management System backend from greenfield, evaluating multiple approaches and delivering most features under aggressive deadlines using Python/FastAPI and Snowflake.",
      "Led cross-team integration to design a scalable rate-publishing mechanism, ensuring real-time data consistency across the Xeneta platform.",
      "Led company-wide AI integration and enforced engineering standards, accelerating technical delivery while eliminating manual toil.",
      "Architected automated maintenance pipelines, scaling bug fixes from 4 manual weekly tickets to 7 fully automated resolutions per week.",
      "Served as Acting Tech Lead: owned the technical roadmap, decomposed epics into stories, assigned work, facilitated ceremonies, and provided architectural guidance.",
      "Delivered company-wide Tech Talks and transferred deep Snowflake knowledge.",
      "Engaged directly with customers on calls with the Product team to translate operational needs into well-scoped technical solutions.",
    ],
    groups: [
      {
        highlights: [
          "Solved a years-long industrial data problem: designed and built an AI pipeline (AWS Bedrock) that automatically transforms arbitrary customer freight rate sheets into a standardised format, with 100% data accuracy and a 95% success rate across real Fortune 500 customer files.",
          "Architected the IRM Rate Management System backend from greenfield, evaluating multiple approaches and delivering most features under aggressive deadlines using Python/FastAPI and Snowflake.",
          "Led cross-team integration to design a scalable rate-publishing mechanism, ensuring real-time data consistency across the Xeneta platform.",
        ],
      },
      {
        highlights: [
          "Led company-wide AI integration and enforced engineering standards, accelerating technical delivery while eliminating manual toil.",
          "Architected automated maintenance pipelines, scaling bug fixes from 4 manual weekly tickets to 7 fully automated resolutions per week.",
          "Served as Acting Tech Lead: owned the technical roadmap, decomposed epics into stories, assigned work, facilitated ceremonies, and provided architectural guidance.",
        ],
      },
      {
        highlights: [
          "Delivered company-wide Tech Talks and transferred deep Snowflake knowledge.",
          "Engaged directly with customers on calls with the Product team to translate operational needs into well-scoped technical solutions.",
        ],
      },
    ],
  },
  {
    company: "audEERING",
    location: "Germany - Remote",
    role: "Senior Full Stack Engineer",
    period: "Jan 2024 – Dec 2024",
    highlights: [
      "Architected and implemented a scalable SQL database solution for an AI-driven API, achieving 86%+ unit test coverage.",
      "Engineered internal data-collection tools for data scientists, streamlining AI model training pipelines.",
      "Designed and implemented gRPC-based microservices, deployed via Docker with GitLab CI/CD pipelines.",
      "Implemented real-time WebSocket-based voice-to-voice AI interaction and led a junior developer mentorship program.",
      "Directed development of a web application showcasing AI models using React and Unity (WebGL).",
    ],
    groups: [
      {
        highlights: [
          "Architected and implemented a scalable SQL database solution for an AI-driven API, achieving 86%+ unit test coverage.",
          "Engineered internal data-collection tools for data scientists, streamlining AI model training pipelines.",
          "Designed and implemented gRPC-based microservices, deployed via Docker with GitLab CI/CD pipelines.",
        ],
      },
      {
        highlights: [
          "Implemented real-time WebSocket-based voice-to-voice AI interaction and led a junior developer mentorship program.",
          "Directed development of a web application showcasing AI models using React and Unity (WebGL).",
        ],
      },
    ],
  },
  {
    company: "Diana vus",
    location: "Austria - Remote",
    role: "Senior Full Stack Developer",
    period: "Dec 2020 – Jan 2024",
    highlights: [
      "Developed and maintained applications that increased user engagement and improved database query performance by 20%.",
      "Authored OpenAPI documentation and played a key role in UI development, testing, and RESTful API design.",
      "Collaborated with designers and product owners to deliver full-stack features across a Kubernetes-deployed microservices platform.",
    ],
  },
  {
    company: "Aviatrix",
    location: "Iran",
    role: "Full Stack Developer",
    period: "Dec 2019 – Nov 2020",
    highlights: [],
  },
  {
    company: "Dina Group",
    location: "Iran",
    role: "Full Stack Developer",
    period: "Sep 2018 – Oct 2019",
    highlights: [],
  },
  {
    company: "Freelance",
    location: "Iran",
    role: "Web Developer",
    period: "Aug 2017 – Oct 2018",
    highlights: [],
  },
  {
    company: "Ab Niroo",
    location: "Iran",
    role: "Software Developer",
    period: "Nov 2015 – Feb 2017",
    highlights: [],
  },
];

function entryPiece(position: Position): Piece {
  return customPiece((inner) => {
    const entry = el("div", "entry");
    const head = reveal(el("div", "entry-head"));
    head.append(
      el("p", "entry-company", position.company),
      el("p", "entry-dates", position.period),
    );
    const role = reveal(el("p", "entry-role", position.role));
    const location = reveal(el("p", "entry-location", position.location));
    entry.append(head, role, location);
    if (position.highlights.length > 0) {
      const list = el("ul", "entry-highlights");
      position.highlights.forEach((highlight) => {
        const item = el("li", "entry-highlight");
        item.textContent = highlight;
        list.appendChild(reveal(item));
      });
      entry.appendChild(list);
    }
    inner.appendChild(entry);
  });
}

function groupPiece(
  position: Position,
  group: HighlightGroup,
  index: number,
  total: number,
): Piece {
  return customPiece((inner) => {
    const entry = el("div", "entry");
    const head = reveal(el("div", "entry-head"));
    head.append(
      el("p", "entry-company", position.company),
      el("p", "entry-dates", `${position.period} · ${index + 1} / ${total}`),
    );
    const role = reveal(el("p", "entry-role", position.role));
    const location = reveal(el("p", "entry-location", position.location));
    const list = el("ul", "entry-highlights");
    group.highlights.forEach((highlight) => {
      const item = el("li", "entry-highlight");
      item.textContent = highlight;
      list.appendChild(reveal(item));
    });
    entry.append(head, role, location, list);
    inner.appendChild(entry);
  });
}

function mergedPiece(positions: Position[]): Piece {
  return customPiece((inner) => {
    const entry = el("div", "entry");
    const head = reveal(el("div", "entry-head"));
    head.append(el("p", "entry-company", "Earlier roles"));
    const list = el("ul", "entry-compact");
    positions.forEach((position) => {
      const item = el("li", "entry-compact-row");
      item.append(
        el("span", "entry-compact-company", position.company),
        el("span", "entry-compact-role", position.role),
        el("span", "entry-compact-dates", position.period),
      );
      list.appendChild(reveal(item));
    });
    entry.append(head, list);
    inner.appendChild(entry);
  });
}

interface SkillCategory {
  subtitle: string;
  icon: string;
  items: string[];
}

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    subtitle: "Backend",
    icon: "server",
    items: [
      "FastAPI",
      "Node.js",
      "Express",
      "Flask",
      "Django",
      "GraphQL",
      "gRPC",
      "RabbitMQ",
      "Socket.io",
      "Microservices",
    ],
  },
  {
    subtitle: "Languages",
    icon: "code",
    items: ["Python", "TypeScript", "JavaScript", "Go", "C/C++", "Rust", "Java"],
  },
  {
    subtitle: "Data",
    icon: "database",
    items: ["Snowflake", "PostgreSQL", "Redis", "MongoDB", "SQLAlchemy", "Prisma"],
  },
  {
    subtitle: "Cloud (AWS)",
    icon: "cloud",
    items: [
      "Lambda",
      "SQS",
      "S3",
      "SNS",
      "EC2",
      "Bedrock",
      "CloudWatch",
      "ECR",
      "IAM",
      "CDK",
      "Terraform",
    ],
  },
  {
    subtitle: "Frontend",
    icon: "box",
    items: ["React", "Next.js", "Angular", "Tailwind CSS", "MUI", "Vite"],
  },
  {
    subtitle: "AI / LLM",
    icon: "spark",
    items: [
      "Prompt engineering",
      "Claude (Anthropic) via AWS Bedrock",
      "AI pipeline architecture",
      "Industrial AI solutions",
      "Spec-driven development",
      "LLM integration",
    ],
  },
  {
    subtitle: "Architecture",
    icon: "gear",
    items: [
      "Solution Architecture",
      "Clean Architecture",
      "System Design",
      "Event-driven",
      "Async patterns",
      "Serverless",
      "API Design",
      "Industrial data platforms",
    ],
  },
  {
    subtitle: "DevOps",
    icon: "branch",
    items: [
      "Docker",
      "Kubernetes",
      "GitLab CI/CD",
      "Jenkins",
      "GitHub Actions",
      "Linux",
      "Bash",
    ],
  },
  {
    subtitle: "Testing",
    icon: "terminal",
    items: ["TDD/BDD", "Pytest", "Jest", "Cypress", "E2E testing", "Unittest"],
  },
];

function skillsOverviewPiece(categories: SkillCategory[]): Piece {
  return customPiece((inner) => {
    const grid = el("div", "skill-blocks");
    categories.forEach((category) => {
      const block = el("div", "skill-block");
      const head = el("div", "skill-block-head");
      const iconWrap = el("span", "skill-block-icon");
      iconWrap.appendChild(icon(category.icon));
      head.append(iconWrap, el("span", "skill-block-title", category.subtitle));
      block.appendChild(head);
      const row = el("div", "tool-row");
      category.items.forEach((label) => {
        const chip = el("span", "tool-chip");
        const chipIcon = el("span", "tool-chip-icon");
        chipIcon.appendChild(icon(iconForTool(label)));
        chip.append(chipIcon, el("span", "tool-chip-name", label));
        row.appendChild(chip);
      });
      block.appendChild(row);
      grid.appendChild(reveal(block));
    });
    inner.appendChild(grid);
  });
}

export function skillsPieces(perPage: number): Piece[] {
  const chunks: SkillCategory[][] = [];
  for (let i = 0; i < SKILL_CATEGORIES.length; i += perPage) {
    chunks.push(SKILL_CATEGORIES.slice(i, i + perPage));
  }
  return [
    duoPiece(
      "I can sit in front of a screen for 18 hours straight.",
      "Powered by coffee and the irrational belief that it's almost done.",
      "coffee",
    ),
    duoPiece(
      "Kidding aside.",
      "Here are the tools I actually reach for when the work gets real.",
      "spark",
    ),
    ...chunks.map((chunk) => skillsOverviewPiece(chunk)),
  ];
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
    subtitle: "Where I've worked",
    pieces: [
      ...POSITIONS.filter(
        (position) => position.highlights.length > 0 || position.groups,
      ).flatMap((position) =>
        position.groups && position.groups.length > 0
          ? position.groups.map((group, index) =>
              groupPiece(position, group, index, position.groups!.length),
            )
          : [entryPiece(position)],
      ),
      mergedPiece(
        POSITIONS.filter(
          (position) => position.highlights.length === 0 && !position.groups,
        ),
      ),
    ],
  },
  {
    id: "skills",
    short: "SKILLS",
    label: "Skills",
    title: "Skills",
    subtitle: "What I've used professionally",
    pieces: skillsPieces(SKILL_CATEGORIES.length),
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
