const menuToggle = document.querySelector("[data-menu-toggle]");
const siteMenu = document.querySelector("#site-menu");

if (menuToggle instanceof HTMLButtonElement && siteMenu instanceof HTMLElement) {
  const setMenuOpen = (open) => {
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute(
      "aria-label",
      open ? "Close project information" : "Open project information",
    );
    siteMenu.hidden = !open;
  };

  menuToggle.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  siteMenu.addEventListener("click", (event) => {
    if (event.target instanceof Element && event.target.closest("a")) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (
      menuToggle.getAttribute("aria-expanded") === "true" &&
      event.target instanceof Node &&
      !siteMenu.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      setMenuOpen(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuToggle.focus();
    }
  });
}

const experience = document.querySelector("[data-experience]");
const crawlText = document.querySelector("[data-crawl-text]");
const displacementMap = document.querySelector("#fisheye-map");
const displacementFilter = document.querySelector("#fisheye-displacement");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

if (
  experience instanceof HTMLElement &&
  crawlText instanceof HTMLElement &&
  displacementMap instanceof SVGElement &&
  displacementFilter instanceof SVGElement &&
  !reducedMotion.matches
) {
  const mapCanvas = document.createElement("canvas");
  const mapSize = 384;
  mapCanvas.width = mapSize;
  mapCanvas.height = mapSize;

  const mapContext = mapCanvas.getContext("2d");
  const mapPixels = mapContext?.createImageData(mapSize, mapSize);

  if (mapContext && mapPixels) {
    const center = (mapSize - 1) / 2;
    const maxRadius = Math.hypot(center, center);

    for (let y = 0; y < mapSize; y += 1) {
      for (let x = 0; x < mapSize; x += 1) {
        const offset = (y * mapSize + x) * 4;
        const dx = x - center;
        const dy = y - center;
        const radius = Math.hypot(dx, dy);
        const strength = Math.min(1, radius / maxRadius) * 0.47;
        const directionX = radius === 0 ? 0 : dx / radius;
        const directionY = radius === 0 ? 0 : dy / radius;

        mapPixels.data[offset] = Math.round(128 - directionX * strength * 255);
        mapPixels.data[offset + 1] = Math.round(
          128 - directionY * strength * 255,
        );
        mapPixels.data[offset + 2] = 128;
        mapPixels.data[offset + 3] = 255;
      }
    }

    mapContext.putImageData(mapPixels, 0, 0);
    const mapUrl = mapCanvas.toDataURL("image/png");
    displacementMap.setAttribute("href", mapUrl);
    displacementMap.setAttributeNS(
      "http://www.w3.org/1999/xlink",
      "xlink:href",
      mapUrl,
    );
    experience.dataset.fisheye = "ready";
  }

  experience.classList.add("is-scroll-driven");

  let frameRequested = false;

  const updateScrollEffects = () => {
    frameRequested = false;

    const viewportHeight = document.documentElement.clientHeight;
    const experienceTop = experience.getBoundingClientRect().top + window.scrollY;
    const scrollDistance = Math.max(1, experience.offsetHeight - viewportHeight);
    const progress = Math.max(
      0,
      Math.min(1, (window.scrollY - experienceTop) / scrollDistance),
    );
    const crawlHeight = crawlText.offsetHeight;
    const crawlY =
      viewportHeight * 0.55 -
      progress * (viewportHeight * 1.1 + crawlHeight);
    const crawlOpacity = Math.max(0, Math.min(1, progress * 12));
    const fisheyeStrength = Math.round(480 * progress ** 1.4);

    crawlText.style.setProperty("--crawl-y", `${crawlY}px`);
    crawlText.style.setProperty("--crawl-opacity", String(crawlOpacity));
    displacementFilter.setAttribute("scale", String(fisheyeStrength));
  };

  const requestScrollUpdate = () => {
    if (!frameRequested) {
      frameRequested = true;
      window.requestAnimationFrame(updateScrollEffects);
    }
  };

  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("resize", requestScrollUpdate);
  reducedMotion.addEventListener("change", (event) => {
    if (event.matches) {
      window.location.reload();
    }
  });
  requestScrollUpdate();
}