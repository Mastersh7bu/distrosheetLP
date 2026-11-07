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
