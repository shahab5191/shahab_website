const SWITCH_DURATION = 200;

function byId<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) throw new Error(`missing #${id}`);
  return element as T;
}

const contentRoot = byId("content");
const contentView = byId("content-view");
const contentViewInner = byId("content-view-inner");
const menu = document.querySelector<HTMLElement>(".menu");
const collapseBar = byId("menu-collapse-bar");

const templates = new Map<string, HTMLTemplateElement>();
document
  .querySelectorAll<HTMLTemplateElement>("template[data-content]")
  .forEach((template) => {
    const key = template.dataset.content;
    if (key) templates.set(key, template);
  });

const triggers = Array.from(
  document.querySelectorAll<HTMLElement>("[data-section]"),
);

let activeSection: string | null = null;
let switchToken = 0;

function updateScrollState(): void {
  const scrollable = contentViewInner.scrollHeight - contentView.clientHeight > 1;
  contentView.classList.toggle("scrolled", scrollable);
}

function render(section: string): void {
  const template = templates.get(section);
  contentViewInner.replaceChildren();
  contentView.scrollTop = 0;
  if (template) {
    contentViewInner.appendChild(template.content.cloneNode(true));
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "content-placeholder";
    placeholder.textContent = section;
    contentViewInner.appendChild(placeholder);
  }
}

function setActive(section: string | null): void {
  for (const trigger of triggers) {
    trigger.classList.toggle(
      "is-active",
      section !== null && trigger.dataset.section === section,
    );
  }
}

function open(section: string): void {
  if (activeSection === section) return;

  const token = ++switchToken;

  if (activeSection === null) {
    activeSection = section;
    render(section);
    contentViewInner.classList.remove("is-fading");
    setActive(section);
    contentRoot.classList.add("is-open");
    document.body.classList.add("is-content-open");
    contentView.setAttribute("aria-hidden", "false");
    updateScrollState();
    menu?.classList.add("is-compressed");
    return;
  }

  contentViewInner.classList.add("is-fading");
  window.setTimeout(() => {
    if (token !== switchToken) return;
    activeSection = section;
    render(section);
    setActive(section);
    contentViewInner.classList.remove("is-fading");
    updateScrollState();
  }, SWITCH_DURATION);
}

function close(): void {
  if (activeSection === null) return;

  switchToken++;
  activeSection = null;
  setActive(null);
  contentRoot.classList.remove("is-open");
  document.body.classList.remove("is-content-open");
  contentView.setAttribute("aria-hidden", "true");
  contentView.classList.remove("scrolled");
  menu?.classList.remove("is-compressed");

  contentViewInner.classList.add("is-fading");
  window.setTimeout(() => {
    if (activeSection !== null) return;
    contentViewInner.replaceChildren();
    contentViewInner.classList.remove("is-fading");
  }, SWITCH_DURATION);
}

for (const trigger of triggers) {
  trigger.addEventListener("click", (event) => {
    const section = trigger.dataset.section;
    if (!section) return;
    if (trigger.tagName === "A") event.preventDefault();
    open(section);
  });
}

collapseBar.addEventListener("click", close);

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") close();
});

window.addEventListener("resize", updateScrollState);
