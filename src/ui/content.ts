import { SECTIONS, skillsPieces } from "./sections";
import type { SectionDef } from "./sections";
import { iconMarkup } from "./icons";

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing #${id}`);
  return element as T;
}

interface Chapter {
  id: string;
  el: HTMLElement;
  title: HTMLElement;
  steps: number;
  pieces: HTMLElement[];
  section: SectionDef;
  stage: HTMLElement;
  stepList: HTMLElement;
}

function desiredPerPage(): number {
  const height = window.innerHeight;
  if (height <= 680) return 2;
  if (height <= 880) return 3;
  return 9;
}

let currentPerPage = desiredPerPage();

function sectionPieces(section: SectionDef) {
  if (section.id === "skills") return skillsPieces(currentPerPage);
  return section.pieces;
}

const menu = byId("menu");
const sectionsRoot = byId("sections");

const chapters: Chapter[] = [];

SECTIONS.forEach((section) => {
  const item = document.createElement("li");
  item.className = "item";
  item.dataset.section = section.id;
  item.setAttribute("data-nav", "");
  item.title = section.label;
  const label = document.createElement("span");
  label.className = "item-label";
  label.textContent = section.short;
  item.appendChild(label);
  menu.appendChild(item);

  const chapter = document.createElement("section");
  chapter.className = "chapter";
  chapter.setAttribute("aria-label", section.label);

  const viewport = document.createElement("div");
  viewport.className = "chapter-viewport";

  const content = document.createElement("div");
  content.className = "chapter-content";

  const inner = document.createElement("div");
  inner.className = "chapter-inner";

  const head = document.createElement("header");
  head.className = "chapter-head";

  const title = document.createElement("h2");
  title.className = "chapter-title";
  title.textContent = section.title;

  const subtitle = document.createElement("p");
  subtitle.className = "chapter-subtitle";
  subtitle.textContent = section.subtitle;

  head.append(title, subtitle);

  const stage = document.createElement("div");
  stage.className = "chapter-stage";

  const pieces: HTMLElement[] = [];
  sectionPieces(section).forEach((piece) => {
    const node = piece.render();
    node.querySelectorAll<HTMLElement>(".reveal").forEach((reveal, index) => {
      reveal.style.setProperty("--i", String(index));
    });
    stage.appendChild(node);
    pieces.push(node);
  });

  inner.append(head, stage);
  content.appendChild(inner);
  viewport.appendChild(content);
  chapter.appendChild(viewport);

  const steps = 2 + sectionPieces(section).length;
  const stepList = document.createElement("div");
  stepList.className = "chapter-steps";
  stepList.setAttribute("aria-hidden", "true");
  for (let i = 0; i < steps; i++) {
    const step = document.createElement("div");
    step.className = "step";
    stepList.appendChild(step);
  }
  chapter.appendChild(stepList);

  sectionsRoot.appendChild(chapter);
  chapters.push({
    id: section.id,
    el: chapter,
    title,
    steps,
    pieces,
    section,
    stage,
    stepList,
  });
});

let ticking = false;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function updateMenu(index: number): void {
  const id = index >= 0 ? (chapters[index]?.id ?? null) : null;
  menu.querySelectorAll<HTMLElement>(".item").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.section === id);
  });
}

function update(): void {
  const scrollY = window.scrollY;
  const viewportHeight = window.innerHeight;
  const probe = scrollY + viewportHeight / 2;

  let current = -1;
  const tops = new Array<number>(chapters.length);
  const heights = new Array<number>(chapters.length);

  for (let i = 0; i < chapters.length; i++) {
    const rect = chapters[i]!.el.getBoundingClientRect();
    tops[i] = rect.top + scrollY;
    heights[i] = rect.height;
    if (current === -1 && probe >= tops[i]! && probe < tops[i]! + heights[i]!) {
      current = i;
    }
  }

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]!;
    const isCurrent = i === current;
    const step = clamp(
      Math.round((scrollY - tops[i]!) / viewportHeight),
      0,
      chapter.steps - 1,
    );
    chapter.el.classList.toggle("is-active", isCurrent);
    chapter.el.classList.toggle("is-docked", isCurrent && step >= 1);
    chapter.pieces.forEach((piece, pieceIndex) => {
      piece.classList.toggle("is-active", isCurrent && step - 2 === pieceIndex);
    });
  }

  updateMenu(current);
  document.body.classList.toggle("is-content-open", current >= 0);
}

function offsetWithin(node: HTMLElement, ancestor: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = node;
  while (current && current !== ancestor) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

function computeShifts(): void {
  const viewportHeight = window.innerHeight;
  for (const chapter of chapters) {
    const offset = offsetWithin(chapter.title, chapter.el);
    const shift = viewportHeight / 2 - offset - chapter.title.offsetHeight / 2;
    chapter.el.style.setProperty("--center-shift", `${shift}px`);
  }
}

function scrollToChapter(index: number): void {
  const chapter = chapters[index];
  if (!chapter) return;
  const top = chapter.el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top, behavior: "smooth" });
}

function rebuildChapter(chapter: Chapter): void {
  const pieces = sectionPieces(chapter.section);
  chapter.stage.replaceChildren();
  chapter.stepList.replaceChildren();

  const nodes: HTMLElement[] = [];
  pieces.forEach((piece) => {
    const node = piece.render();
    node.querySelectorAll<HTMLElement>(".reveal").forEach((reveal, index) => {
      reveal.style.setProperty("--i", String(index));
    });
    chapter.stage.appendChild(node);
    nodes.push(node);
  });
  chapter.pieces = nodes;

  chapter.steps = 2 + pieces.length;
  for (let i = 0; i < chapter.steps; i++) {
    const step = document.createElement("div");
    step.className = "step";
    chapter.stepList.appendChild(step);
  }
}

const PET_SLOTS: Array<{ x: number; y: number }> = [
  { x: 25, y: 16 },
  { x: 40, y: 10 },
  { x: 53, y: 18 },
  { x: 30, y: 50 },
  { x: 43, y: 49 },
];

const PETS: Array<string> = [
  "hati.jpg",
  "medad-mioo.jpg",
  "zardaloo-medad.jpg",
  "zomi.jpg",
  "zardaloo-medad-mioo.jpg",
];

function petImage(name: string): string {
  return `/pets/${name}`;
}

let photosRoot: HTMLElement | null = null;

function spawnPhotos(): void {
  removePhotos();
  const root = document.createElement("div");
  root.className = "photos";
  PETS.forEach((name, index) => {
    const slot = PET_SLOTS[index]!;
    const jitterX = (Math.random() - 0.5) * 6;
    const jitterY = (Math.random() - 0.5) * 6;
    const rotation = (Math.random() - 0.5) * 26;

    const photo = document.createElement("figure");
    photo.className = "polaroid";
    photo.style.left = `${slot.x + jitterX}%`;
    photo.style.top = `${slot.y + jitterY}%`;
    photo.style.setProperty("--rot", `${rotation.toFixed(1)}deg`);
    photo.style.setProperty("--d", String(index));

    const image = document.createElement("img");
    image.src = petImage(name);
    image.alt = name;
    image.draggable = false;

    const caption = document.createElement("figcaption");
    caption.className = "polaroid-caption";
    caption.textContent = name.split(".")[0] || name;

    photo.append(image, caption);
    root.appendChild(photo);
  });

  document.body.appendChild(root);
  photosRoot = root;
  void root.offsetWidth;
  root.querySelectorAll(".polaroid").forEach((photo) => {
    photo.classList.add("is-in");
  });
}

function removePhotos(): void {
  if (!photosRoot) return;
  const root = photosRoot;
  photosRoot = null;
  root.classList.add("is-leaving");
  window.setTimeout(() => root.remove(), 320);
}

document.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null;

  if (photosRoot) {
    removePhotos();
    return;
  }

  const photoTrigger = target?.closest<HTMLElement>("[data-photos]");
  if (photoTrigger) {
    event.preventDefault();
    spawnPhotos();
    return;
  }

  const trigger = target?.closest<HTMLElement>("[data-nav]");
  if (!trigger) return;
  const index = chapters.findIndex(
    (chapter) => chapter.id === trigger.dataset.section,
  );
  if (index < 0) return;
  event.preventDefault();
  scrollToChapter(index);
});

window.addEventListener(
  "scroll",
  () => {
    if (photosRoot) removePhotos();
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      update();
    });
  },
  { passive: true },
);

window.addEventListener("resize", () => {
  computeShifts();
  update();
  const skills = chapters.find((chapter) => chapter.id === "skills");
  if (!skills) return;
  const target = desiredPerPage();
  if (target !== currentPerPage) {
    currentPerPage = target;
    rebuildChapter(skills);
    computeShifts();
    update();
  }
});

window.addEventListener("load", computeShifts);
if (document.fonts) {
  document.fonts.ready.then(computeShifts).catch(() => undefined);
}

updateMenu(-1);
requestAnimationFrame(() => {
  computeShifts();
  update();
});
