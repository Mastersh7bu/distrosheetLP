const menuButton = document.querySelector("[data-menu-button]");
const menu = document.querySelector("[data-menu]");

if (menuButton && menu) {
  menuButton.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    menuButton.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    menu.classList.toggle("is-open", !open);
  });

  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      menuButton.setAttribute("aria-expanded", "false");
      menuButton.setAttribute("aria-label", "Open menu");
      menu.classList.remove("is-open");
    });
  });
}

const stage = document.querySelector("[data-routes]");

if (stage) {
  const svg = stage.querySelector(".routes");
  const project = stage.querySelector("[data-project]");
  const source = stage.querySelector(".mock");
  const people = [...stage.querySelectorAll("[data-person]")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const svgNs = "http://www.w3.org/2000/svg";
  const sheetNames = [
    "Client tracker",
    "Cost calculator",
    "Quote tool",
    "Team roster",
    "Budget planner",
    "Onboarding sheet",
  ];
  const sheetName = document.querySelector("[data-sheet-name]");
  let sheetNameIndex = 0;
  let lastSignature = "";

  function advanceSheetName(motion, fade) {
    const restart = () => {
      if (!motion.isConnected) return;
      motion.beginElement();
      fade.beginElement();
    };
    if (!sheetName) {
      restart();
      return;
    }
    sheetName.classList.add("is-fading");
    window.setTimeout(() => {
      sheetNameIndex = (sheetNameIndex + 1) % sheetNames.length;
      sheetName.textContent = sheetNames[sheetNameIndex];
      sheetName.classList.remove("is-fading");
      restart();
    }, 220);
  }

  function rel(x, y, box) {
    return { x: x - box.left, y: y - box.top };
  }

  function drawRoutes() {
    const box = stage.getBoundingClientRect();
    if (box.width < 10 || box.height < 10) return;

    const pairs = [
      [project, source],
      ...people.map((person) => [source, person]),
    ];
    const routes = pairs.map(([fromEl, toEl], index) => {
      const from = fromEl.getBoundingClientRect();
      const to = toEl.getBoundingClientRect();
      const fromMidX = from.left + from.width / 2;
      const fromMidY = from.top + from.height / 2;
      const toMidX = to.left + to.width / 2;
      const toMidY = to.top + to.height / 2;
      const below = to.top > from.bottom - 8;
      const start = below
        ? rel(fromMidX, from.bottom, box)
        : rel(from.right, fromMidY, box);
      const end = below
        ? rel(toMidX, to.top, box)
        : rel(to.left, toMidY, box);
      if (index === 0) {
        if (below) end.y += 18;
        else end.x += 18;
      }
      const d = below
        ? `M ${start.x} ${start.y} C ${start.x} ${start.y + (end.y - start.y) * 0.5}, ${end.x} ${end.y - (end.y - start.y) * 0.35}, ${end.x} ${end.y}`
        : `M ${start.x} ${start.y} C ${start.x + (end.x - start.x) * 0.55} ${start.y}, ${end.x - (end.x - start.x) * 0.28} ${end.y}, ${end.x} ${end.y}`;
      return { d, end };
    });

    const signature = `${box.width}x${box.height}|${routes.map((route) => route.d).join("|")}`;
    if (signature === lastSignature) return;
    lastSignature = signature;

    svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
    svg.replaceChildren();

    routes.forEach((route, index) => {
      const path = document.createElementNS(svgNs, "path");
      path.setAttribute("id", `route-${index}`);
      path.setAttribute("d", route.d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", "#8fbfa0");
      path.setAttribute("stroke-width", "1.75");
      path.setAttribute("stroke-linecap", "round");
      svg.appendChild(path);

      if (reduceMotion) {
        const parked = document.createElementNS(svgNs, "circle");
        parked.setAttribute("cx", String(route.end.x));
        parked.setAttribute("cy", String(route.end.y));
        parked.setAttribute("r", "3.5");
        parked.setAttribute("fill", "#137333");
        svg.appendChild(parked);
        return;
      }

      const traveler = document.createElementNS(svgNs, "g");
      const inbound = index === 0;
      const motion = document.createElementNS(svgNs, "animateMotion");
      motion.setAttribute("dur", inbound ? "2.6s" : "3.2s");
      motion.setAttribute("repeatCount", inbound ? "1" : "indefinite");
      motion.setAttribute("begin", inbound ? "indefinite" : `${index * 0.85}s`);
      motion.setAttribute("calcMode", "linear");
      if (inbound) motion.setAttribute("fill", "freeze");
      const mpath = document.createElementNS(svgNs, "mpath");
      mpath.setAttribute("href", `#route-${index}`);
      motion.appendChild(mpath);
      traveler.appendChild(motion);

      let fade = null;
      if (inbound) {
        traveler.setAttribute("opacity", "0");
        fade = document.createElementNS(svgNs, "animate");
        fade.setAttribute("attributeName", "opacity");
        fade.setAttribute("values", "0;1;1;0;0");
        fade.setAttribute("keyTimes", "0;0.08;0.52;0.72;1");
        fade.setAttribute("dur", "2.6s");
        fade.setAttribute("begin", "indefinite");
        fade.setAttribute("fill", "freeze");
        fade.setAttribute("calcMode", "linear");
        traveler.appendChild(fade);
        motion.addEventListener("endEvent", () => advanceSheetName(motion, fade));
      }

      const halo = document.createElementNS(svgNs, "circle");
      halo.setAttribute("r", "5.5");
      halo.setAttribute("fill", "#ffffff");
      const dot = document.createElementNS(svgNs, "circle");
      dot.setAttribute("r", "3.25");
      dot.setAttribute("fill", "#137333");
      traveler.append(halo, dot);
      svg.appendChild(traveler);
      if (inbound) {
        motion.beginElement();
        fade.beginElement();
      }
    });
  }

  drawRoutes();
  const observer = new ResizeObserver(drawRoutes);
  observer.observe(stage);
}

const mock = document.querySelector("[data-mock]");

if (mock) {
  const tabs = mock.querySelectorAll("[data-mock-tab]");
  const panels = mock.querySelectorAll("[data-mock-panel]");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const name = tab.getAttribute("data-mock-tab");
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute("aria-selected", String(selected));
      });
      panels.forEach((panel) => {
        panel.hidden = panel.getAttribute("data-mock-panel") !== name;
      });
    });
  });
}
