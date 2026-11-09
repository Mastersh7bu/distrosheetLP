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

  function pulsePerson(person) {
    person.classList.remove("is-arriving");
    void person.offsetWidth;
    person.classList.add("is-arriving");
  }

  function playOutbound(motion, traveler, person, delay) {
    const launch = () => {
      if (!motion.isConnected) return;
      traveler.style.transition = "none";
      traveler.style.opacity = "0";
      motion.beginElement();
      window.requestAnimationFrame(() => {
        if (!traveler.isConnected) return;
        traveler.style.transition = "opacity 0.18s linear";
        traveler.style.opacity = "1";
      });
    };

    motion.addEventListener("endEvent", () => {
      if (!motion.isConnected) return;
      pulsePerson(person);
      traveler.style.transition = "opacity 0.42s ease";
      traveler.style.opacity = "0";
      window.setTimeout(launch, 460);
    });

    window.setTimeout(launch, delay);
  }

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

  function roundedPath(points, radius) {
    const parts = [`M ${points[0].x} ${points[0].y}`];
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const corner = points[i];
      const next = points[i + 1];
      const inX = corner.x - prev.x;
      const inY = corner.y - prev.y;
      const outX = next.x - corner.x;
      const outY = next.y - corner.y;
      const inLen = Math.hypot(inX, inY);
      const outLen = Math.hypot(outX, outY);
      const r = Math.min(radius, inLen / 2, outLen / 2);
      if (r < 0.5) {
        parts.push(`L ${corner.x} ${corner.y}`);
        continue;
      }
      const startX = corner.x - (inX / inLen) * r;
      const startY = corner.y - (inY / inLen) * r;
      const endX = corner.x + (outX / outLen) * r;
      const endY = corner.y + (outY / outLen) * r;
      const sweep = inX * outY - inY * outX > 0 ? 1 : 0;
      parts.push(`L ${startX} ${startY}`);
      parts.push(`A ${r} ${r} 0 0 ${sweep} ${endX} ${endY}`);
    }
    const last = points[points.length - 1];
    parts.push(`L ${last.x} ${last.y}`);
    return parts.join(" ");
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
      const edgeX = end.x;
      const edgeY = end.y;
      if (index === 0) {
        if (below) end.y += 18;
        else end.x += 18;
      }
      const midX = start.x + (edgeX - start.x) / 2;
      const midY = start.y + (edgeY - start.y) / 2;
      const d = index === 0
        ? (below
          ? `M ${start.x} ${start.y} V ${midY} H ${end.x} V ${end.y}`
          : `M ${start.x} ${start.y} H ${midX} V ${end.y} H ${end.x}`)
        : roundedPath(
          below
            ? [start, { x: start.x, y: midY }, { x: end.x, y: midY }, end]
            : [start, { x: midX, y: start.y }, { x: midX, y: end.y }, end],
          10
        );
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
      path.setAttribute("stroke", "#53df85");
      path.setAttribute("stroke-width", "1.75");
      path.setAttribute("stroke-linecap", "butt");
      path.setAttribute("stroke-linejoin", "miter");
      svg.appendChild(path);
    });

    routes.forEach((route, index) => {
      if (reduceMotion) {
        const parked = document.createElementNS(svgNs, "circle");
        parked.setAttribute("cx", String(route.end.x));
        parked.setAttribute("cy", String(route.end.y));
        parked.setAttribute("r", "3.5");
        parked.setAttribute("fill", "#53df85");
        svg.appendChild(parked);
        return;
      }

      const traveler = document.createElementNS(svgNs, "g");
      const inbound = index === 0;
      const motion = document.createElementNS(svgNs, "animateMotion");
      motion.setAttribute("dur", inbound ? "2.6s" : "3.2s");
      motion.setAttribute("repeatCount", "1");
      motion.setAttribute("begin", "indefinite");
      motion.setAttribute("calcMode", "linear");
      motion.setAttribute("fill", "freeze");
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
      dot.setAttribute("fill", "#53df85");
      traveler.append(halo, dot);
      svg.appendChild(traveler);
      if (inbound) {
        motion.beginElement();
        fade.beginElement();
      } else {
        playOutbound(motion, traveler, people[index - 1], index * 850);
      }
    });
  }

  drawRoutes();
  const observer = new ResizeObserver(drawRoutes);
  observer.observe(stage);
}

const accessForm = document.querySelector("[data-access-form]");

if (accessForm) {
  const status = accessForm.querySelector("[data-access-status]");
  accessForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = String(new FormData(accessForm).get("email") || "").trim();
    const button = accessForm.querySelector("button");
    status.textContent = "";
    status.classList.remove("is-error");
    button.disabled = true;
    try {
      const response = await fetch("https://formsubmit.co/ajax/dan@acumetltd.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          _subject: "DistroSheet exclusive access signup",
          _template: "table",
          _captcha: "false",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || String(data.success) === "false") throw new Error("Request failed");
      accessForm.reset();
      status.textContent = "You're signed up. We'll be in touch.";
    } catch {
      status.textContent = "Something went wrong. Try again in a moment.";
      status.classList.add("is-error");
    } finally {
      button.disabled = false;
    }
  });
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
