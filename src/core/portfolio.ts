import { registerCommand } from "./commands";
import type { CommandContext } from "./commands";
import {
  H,
  V,
  TL,
  TR,
  BL,
  BR,
  DOT,
  BULLET,
  WIDTH,
  header,
  doubleHeader,
} from "./ascii";

type Terminal = CommandContext["terminal"];

const SDIV = `{dim}  ${H.repeat(WIDTH - 2)}{/}`;

function headerBox(t: Terminal, lines: string[]): void {
  for (const l of header(lines)) t.writeLine(`{accent}${l}{/}`);
}

function doubleHeaderBox(t: Terminal, lines: string[]): void {
  for (const l of doubleHeader(lines)) t.writeLine(`{accent}${l}{/}`);
}

/** A single-line box with left-padded content lines. */
function drawBox(t: Terminal, content: string[]): void {
  const inner = WIDTH - 2;
  t.writeLine(`{accent}${TL}${H.repeat(inner)}${TR}{/}`);
  for (const l of content) {
    t.writeLine(`{accent}${V}{/}   ${l.padEnd(inner - 4)} {accent}${V}{/}`);
  }
  t.writeLine(`{accent}${BL}${H.repeat(inner)}${BR}{/}`);
}

/** A command list row: indented, accent name, padded description. */
function cmd(name: string, desc: string): string {
  return `  {accent}${name}{/}${" ".repeat(Math.max(1, 18 - name.length))}${desc}`;
}

/** A full-width divider line in dim color. */
function section(t: Terminal, label: string): void {
  t.writeLine(`{accent}  ${label}{/}`);
  t.writeLine(SDIV);
}

// ---------------------------------------------------------------------------
// help (welcome)
// ---------------------------------------------------------------------------

registerCommand("help", (ctx) => {
  const t = ctx.terminal;

  headerBox(t, ["SHAHABEDIN OVEYSI", "SENIOR SOFTWARE ENGINEER"]);
  t.writeLine();
  t.writeLine("  Welcome to my terminal.");
  t.writeLine();
  t.writeLine("  I'm a Senior Software Engineer & Tech Lead with 10+ years of");
  t.writeLine("  experience building scalable backend systems, cloud platforms,");
  t.writeLine("  and AI-powered solutions.");
  t.writeLine();
  section(t, "COMMANDS");
  t.writeLine();
  t.writeLine(cmd("about", "Learn about me"));
  t.writeLine(cmd("experience", "Explore my career"));
  t.writeLine(cmd("resume", "View my full resume"));
  t.writeLine(cmd("skills", "Browse my technical skills"));
  t.writeLine(cmd("projects", "Explore selected work"));
  t.writeLine(cmd("education", "Academic background"));
  t.writeLine(cmd("certifications", "Professional certifications"));
  t.writeLine(cmd("contact", "Get in touch"));
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  t.writeLine(cmd("clear", "Clear the terminal"));
  t.writeLine(cmd("history", "Show command history"));
  t.writeLine(cmd("whoami", "Who am I?"));
  t.writeLine(cmd("neofetch", "System information"));
  t.writeLine(cmd("help", "Show this help"));
  t.writeLine();
  section(t, "TIP");
  t.writeLine("  Try: about, experience, projects, or neofetch");
});

// ---------------------------------------------------------------------------
// about
// ---------------------------------------------------------------------------

registerCommand("about", (ctx) => {
  const t = ctx.terminal;

  headerBox(t, ["ABOUT ME"]);
  t.writeLine();
  t.writeLine("{accent}  SHAHABEDIN OVEYSI{/}");
  t.writeLine(`  Senior Software Engineer ${DOT} Tech Lead`);
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  t.writeLine("  I'm a solution-oriented software engineer with 10+ years of");
  t.writeLine("  experience designing and building scalable software systems.");
  t.writeLine();
  t.writeLine("  My work sits at the intersection of:");
  t.writeLine();
  for (const area of [
    "BACKEND ENGINEERING",
    "CLOUD ARCHITECTURE",
    "AI / LLM SYSTEMS",
    "DISTRIBUTED SYSTEMS",
    "PRODUCT ENGINEERING",
    "TECHNICAL LEADERSHIP",
  ]) {
    t.writeLine(`{accent}      ${area}{/}`);
  }
  t.writeLine();
  t.writeLine("  I enjoy taking ambiguous, difficult problems and turning them into");
  t.writeLine("  reliable, maintainable systems that create real value for users.");
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  section(t, "WHAT I CARE ABOUT");
  t.writeLine();
  for (const line of [
    "> Simple solutions to complex problems",
    "> Systems that are reliable at scale",
    "> Strong engineering standards",
    "> Automation over repetitive work",
    "> Architecture that serves the product",
    "> Working closely with customers and product teams",
    "> Sharing knowledge and helping engineers grow",
  ]) {
    t.writeLine(`  ${line}`);
  }
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  section(t, "CURRENT FOCUS");
  t.writeLine();
  for (const line of [
    "AI-powered workflows",
    "Cloud-native backend platforms",
    "Enterprise software architecture",
    "Industrial & operational data",
    "Developer productivity",
    "Technical leadership",
  ]) {
    t.writeLine(`  ${line}`);
  }
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  t.writeLine("  10+ years of experience");
  t.writeLine(`  Python ${DOT} TypeScript ${DOT} AWS ${DOT} AI ${DOT} Distributed Systems`);
});

// ---------------------------------------------------------------------------
// experience
// ---------------------------------------------------------------------------

registerCommand("experience", (ctx) => {
  const t = ctx.terminal;

  headerBox(t, ["EXPERIENCE"]);
  t.writeLine();
  t.writeLine(`{accent}  10+ YEARS ${DOT} SOFTWARE ENGINEERING ${DOT} BACKEND ${DOT} AI ${DOT} CLOUD{/}`);
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();

  const role = (num: string, name: string, meta: string[], title: string, dates: string): void => {
    t.writeLine(`{accent}  ${num}  ${name}{/}`);
    t.writeLine(`{dim}      ${meta.join(` ${DOT} `)}{/}`);
    t.writeLine(`      ${title}`);
    t.writeLine(`      ${dates}`);
    t.writeLine();
  };

  role("01", "XENETA", ["Norway", "Hybrid"], "Senior Software Engineer / Acting Tech Lead", "Jan 2025 - Present");
  t.writeLine(`      Python ${DOT} FastAPI ${DOT} AWS ${DOT} Bedrock ${DOT} Snowflake ${DOT} TypeScript`);
  t.writeLine(`      React ${DOT} Terraform ${DOT} Docker ${DOT} GitLab CI/CD`);
  t.writeLine();
  for (const bullet of [
    "Solved a years-long industrial data problem by designing and",
    "building an AI pipeline using AWS Bedrock.",
    "The pipeline transforms arbitrary customer freight rate sheets",
    "into a standardized format.",
    "Achieved 100% data accuracy and a 95% success rate across",
    "real Fortune 500 customer files.",
    "Architected the IRM Rate Management System backend from",
    "greenfield using Python, FastAPI and Snowflake.",
    "Led cross-team integration for scalable rate publishing and",
    "real-time data consistency across the platform.",
    "Led company-wide AI integration and helped establish",
    "engineering standards around AI development.",
    "Built automated maintenance pipelines, scaling bug fixes from",
    "4 manual tickets per week to 7 automated resolutions per week.",
    "Served as Acting Tech Lead: owned the technical roadmap,",
    "decomposed epics, assigned work and provided architecture",
    "guidance.",
    "Delivered company-wide Tech Talks and shared deep Snowflake",
    "knowledge with engineering teams.",
    "Worked directly with customers and product teams to understand",
    "operational problems and turn them into technical solutions.",
  ]) {
    t.writeLine(`      ${BULLET} ${bullet}`);
  }
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();

  role("02", "audEERING", ["Germany", "Remote"], "Senior Full Stack Engineer", "Jan 2024 - Dec 2024");
  t.writeLine(`      Python ${DOT} C# ${DOT} Flask ${DOT} FastAPI ${DOT} AWS ${DOT} PostgreSQL ${DOT} Docker`);
  t.writeLine(`      TypeScript ${DOT} Angular ${DOT} Unity ${DOT} CDK ${DOT} Lambda ${DOT} SQS ${DOT} S3 ${DOT} Redis`);
  t.writeLine();
  for (const bullet of [
    "Architected and implemented a scalable SQL database solution",
    "for an AI-driven API.",
    "Achieved 86%+ unit test coverage.",
    "Built internal data-collection tools for data scientists,",
    "streamlining AI model training workflows.",
    "Designed and implemented gRPC-based microservices.",
    "Built Docker-based deployments with GitLab CI/CD.",
    "Implemented real-time WebSocket-based voice-to-voice AI",
    "interaction.",
    "Mentored a junior developer and helped establish stronger",
    "engineering practices.",
    "Directed development of a web application showcasing AI",
    "models using React and Unity WebGL.",
  ]) {
    t.writeLine(`      ${BULLET} ${bullet}`);
  }
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();

  role("03", "DIANA VUS", ["Austria", "Remote"], "Senior Full Stack Developer", "Dec 2020 - Jan 2024");
  t.writeLine(`      React ${DOT} Node.js ${DOT} Express ${DOT} TypeScript ${DOT} Docker ${DOT} Kubernetes`);
  t.writeLine(`      AWS ${DOT} Redis ${DOT} RabbitMQ ${DOT} Prometheus ${DOT} Jest ${DOT} Cypress`);
  t.writeLine();
  for (const bullet of [
    "Developed and maintained applications focused on increasing",
    "user engagement.",
    "Improved database query performance by 20%.",
    "Designed REST APIs and authored OpenAPI documentation.",
    "Contributed across UI development, testing and backend systems.",
    "Collaborated with designers and product owners to deliver",
    "features across a Kubernetes-based microservices platform.",
  ]) {
    t.writeLine(`      ${BULLET} ${bullet}`);
  }
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();

  role("04", "AVIATRIX", ["Iran"], "Full Stack Developer", "Dec 2019 - Nov 2020");
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  role("05", "DINA GROUP", ["Iran"], "Full Stack Developer", "Sep 2018 - Oct 2019");
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  role("06", "FREELANCE", ["Iran"], "Web Developer", "Aug 2017 - Oct 2018");
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  role("07", "AB NIROO", ["Iran"], "Software Developer", "Nov 2015 - Feb 2017");
});

// ---------------------------------------------------------------------------
// resume
// ---------------------------------------------------------------------------

registerCommand("resume", (ctx) => {
  const t = ctx.terminal;

  doubleHeaderBox(t, ["SHAHABEDIN OVEYSI", "SENIOR SOFTWARE ENGINEER"]);
  t.writeLine();
  t.writeLine("  shahab-oveysi@gmail.com");
  t.writeLine("  linkedin.com/in/shahab-oveysi/");
  t.writeLine();
  section(t, "PROFILE");
  t.writeLine();
  for (const line of [
    "Solution-oriented Senior Software Engineer and Tech Lead with 10+",
    "years of experience designing scalable backend architectures and",
    "integrations for enterprise customers.",
    "",
    "Proven ability to partner directly with product teams and",
    "stakeholders to translate complex business challenges into reliable",
    "technical solutions.",
    "",
    "Strong background in cloud platforms, automated workflows,",
    "AI-powered systems, and driving engineering standards from",
    "discovery through production deployment.",
  ]) {
    t.writeLine(line === "" ? "" : `  ${line}`);
  }
  t.writeLine();
  section(t, "EXPERTISE");
  t.writeLine();
  for (const line of [
    "AI & Data Solutions",
    "Enterprise Software Architecture",
    `Cloud Platforms ${DOT} AWS`,
    "Customer-Focused Product Development",
    "Distributed Systems",
    "Technical Leadership",
    "Industrial & Operational Data Workflows",
    "Backend Platform Engineering",
    "Cross-Team Delivery",
    "Engineering Excellence",
  ]) {
    t.writeLine(`  ${line}`);
  }
  t.writeLine();
  section(t, "EXPERIENCE");
  t.writeLine();
  const job = (name: string, role: string, dates: string, loc: string): void => {
    t.writeLine(`  {accent}${name}{/}`);
    t.writeLine(`  ${role} ${DOT} ${dates}`);
    t.writeLine(`  ${loc}`);
    t.writeLine();
  };
  job("XENETA", "Senior Software Engineer", "Jan 2025 - Present", "Norway · Hybrid");
  job("audEERING", "Senior Full Stack Engineer", "Jan 2024 - Dec 2024", "Germany · Remote");
  job("DIANA VUS", "Senior Full Stack Developer", "Dec 2020 - Jan 2024", "Austria · Remote");
  job("AVIATRIX", "Full Stack Developer", "Dec 2019 - Nov 2020", "Iran");
  job("DINA GROUP", "Full Stack Developer", "Sep 2018 - Oct 2019", "Iran");
  job("FREELANCE", "Web Developer", "Aug 2017 - Oct 2018", "Iran");
  job("AB NIROO", "Software Developer", "Nov 2015 - Feb 2017", "Iran");
  t.writeLine();
  section(t, "EDUCATION");
  t.writeLine();
  t.writeLine("  Bachelor of Water Engineering");
  t.writeLine("  University of Tehran · Iran · 2012");
  t.writeLine();
  section(t, "CERTIFICATIONS");
  t.writeLine();
  t.writeLine("  IBM Applied DevOps Engineering Professional Certificate");
  t.writeLine("  Meta Front-End Developer Professional Certificate");
});

// ---------------------------------------------------------------------------
// skills
// ---------------------------------------------------------------------------

registerCommand("skills", (ctx) => {
  const t = ctx.terminal;

  headerBox(t, ["SKILLS"]);
  t.writeLine();
  const group = (label: string, items: string[]): void => {
    section(t, label);
    t.writeLine();
    for (const line of items) t.writeLine(`  ${line}`);
    t.writeLine();
    t.writeLine(SDIV);
    t.writeLine();
  };

  group("LANGUAGES", [
    `Python ${DOT} TypeScript ${DOT} JavaScript ${DOT} Go`,
    `C/C++ ${DOT} Rust ${DOT} Java`,
  ]);
  group("CLOUD · AWS", [
    `Lambda ${DOT} SQS ${DOT} S3 ${DOT} SNS ${DOT} EC2`,
    `Bedrock ${DOT} CloudWatch ${DOT} ECR ${DOT} IAM`,
    `CDK ${DOT} Terraform`,
  ]);
  group("DATA", [
    `Snowflake ${DOT} PostgreSQL ${DOT} Redis ${DOT} MongoDB`,
    `SQLAlchemy ${DOT} Prisma ${DOT} SQL`,
  ]);
  group("BACKEND", [
    `FastAPI ${DOT} Node.js ${DOT} Express ${DOT} Flask ${DOT} Django`,
    `GraphQL ${DOT} gRPC ${DOT} RabbitMQ ${DOT} Socket.io`,
    `Microservices ${DOT} REST APIs`,
  ]);
  group("FRONTEND", [
    `React ${DOT} Next.js ${DOT} Angular`,
    `Tailwind CSS ${DOT} MUI ${DOT} Vite`,
  ]);
  group("AI / LLM", [
    "Prompt Engineering",
    "Claude / Anthropic via AWS Bedrock",
    "AI Pipeline Architecture",
    "Industrial AI Solutions",
    "Spec-Driven Development",
    "LLM Integration",
  ]);
  group("ARCHITECTURE", [
    `Solution Architecture ${DOT} System Design`,
    `Clean Architecture ${DOT} Event-Driven Architecture`,
    `Async Patterns ${DOT} Serverless ${DOT} API Design`,
    "Industrial Data Platforms",
  ]);
  group("DEVOPS", [
    `Docker ${DOT} Kubernetes ${DOT} GitLab CI/CD`,
    `Jenkins ${DOT} GitHub Actions ${DOT} Linux ${DOT} Bash`,
  ]);
  group("TESTING", [
    `TDD / BDD ${DOT} Pytest ${DOT} Jest ${DOT} Cypress`,
    `E2E Testing ${DOT} Unittest`,
  ]);
});

// ---------------------------------------------------------------------------
// projects
// ---------------------------------------------------------------------------

registerCommand("projects", (ctx) => {
  const t = ctx.terminal;

  headerBox(t, ["SELECTED WORK"]);
  t.writeLine();
  t.writeLine("  These are some of the problems I've enjoyed solving.");
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();

  t.writeLine(`{accent}  [01]  AI FREIGHT RATE PIPELINE{/}`);
  t.writeLine(`        Xeneta ${DOT} AWS Bedrock ${DOT} Python ${DOT} Snowflake`);
  t.writeLine();
  t.writeLine("        The problem");
  t.writeLine(`        ${H.repeat(11)}`);
  t.writeLine("        Customer freight rate sheets arrived in arbitrary formats,");
  t.writeLine("        making standardization a difficult and highly manual process.");
  t.writeLine();
  t.writeLine("        The solution");
  t.writeLine(`        ${H.repeat(12)}`);
  t.writeLine("        Designed and built an AI-powered pipeline that understands");
  t.writeLine("        customer spreadsheets and transforms them into a standardized");
  t.writeLine("        format automatically.");
  t.writeLine();
  t.writeLine("        RESULT");
  t.writeLine(`        ${H.repeat(6)}`);
  t.writeLine("        100% data accuracy");
  t.writeLine("        95% success rate across real Fortune 500 customer files");
  t.writeLine("        Core product feature delivering direct customer value");
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();

  t.writeLine(`{accent}  [02]  RATE MANAGEMENT SYSTEM{/}`);
  t.writeLine(`        Xeneta ${DOT} FastAPI ${DOT} Snowflake ${DOT} Terraform`);
  t.writeLine();
  t.writeLine("        Architected the backend of a greenfield Rate Management System.");
  t.writeLine();
  for (const line of [
    "Designed the system architecture",
    "Evaluated multiple technical approaches",
    "Built the majority of features under aggressive deadlines",
    "Designed scalable data workflows",
    "Integrated the system with the wider Xeneta platform",
  ]) {
    t.writeLine(`        ${BULLET} ${line}`);
  }
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();

  t.writeLine(`{accent}  [03]  REAL-TIME VOICE AI{/}`);
  t.writeLine(`        audEERING ${DOT} Python ${DOT} gRPC ${DOT} WebSockets ${DOT} AWS`);
  t.writeLine();
  t.writeLine("        Designed and implemented real-time voice-to-voice AI");
  t.writeLine("        interaction using WebSocket-based communication.");
  t.writeLine();
  t.writeLine("        Also contributed to an application showcasing AI models");
  t.writeLine("        through React and Unity WebGL.");
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();

  t.writeLine(`{accent}  [04]  AUTOMATED MAINTENANCE{/}`);
  t.writeLine(`        Xeneta ${DOT} AWS ${DOT} Python`);
  t.writeLine();
  t.writeLine("        Replaced repetitive manual maintenance work with automated");
  t.writeLine("        pipelines.");
  t.writeLine();
  t.writeLine("        BEFORE       4 manual resolutions / week");
  t.writeLine("        AFTER        7 automated resolutions / week");
  t.writeLine();
  t.writeLine("        The goal wasn't just automation.");
  t.writeLine("        It was giving engineers their time back.");
});

// ---------------------------------------------------------------------------
// contact
// ---------------------------------------------------------------------------

registerCommand("contact", (ctx) => {
  const t = ctx.terminal;

  headerBox(t, ["CONTACT"]);
  t.writeLine();
  t.writeLine("  GOT A PROBLEM WORTH SOLVING?");
  t.writeLine();
  t.writeLine("  I'm always interested in interesting engineering challenges,");
  t.writeLine("  ambitious products, and conversations about technology.");
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  t.writeLine("{accent}  EMAIL{/}");
  t.writeLine();
  t.writeLine("  shahab-oveysi@gmail.com");
  t.writeLine();
  t.writeLine("{accent}  LINKEDIN{/}");
  t.writeLine();
  t.writeLine("  linkedin.com/in/shahab-oveysi/");
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  section(t, "PREFERRED TOPICS");
  t.writeLine();
  for (const line of [
    "Software Architecture",
    "Backend Engineering",
    "Cloud & AWS",
    "AI / LLM Systems",
    "Distributed Systems",
    "Technical Leadership",
    "Interesting Problems",
  ]) {
    t.writeLine(`  ${line}`);
  }
  t.writeLine();
  t.writeLine(SDIV);
  t.writeLine();
  t.writeLine(`  $ echo "Let's build something."`);
});

// ---------------------------------------------------------------------------
// whoami
// ---------------------------------------------------------------------------

registerCommand("whoami", (ctx) => {
  const t = ctx.terminal;

  drawBox(t, [
    "",
    "shahabedin",
    "",
    "Senior Software Engineer",
    "Tech Lead",
    "",
    "Backend engineer who enjoys turning",
    "complicated problems into simple systems.",
    "",
    `Python ${DOT} AWS ${DOT} AI ${DOT} Distributed Systems`,
    "",
  ]);
});
