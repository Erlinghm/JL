// ============================================================
// Jordleie.no – Client-side JavaScript
// Uses Leaflet.js for maps and basic UI interactions
// ============================================================

// ---- Countdown timer ----
// Finds elements with data-end-date and counts down
function startCountdowns() {
  const countdowns = document.querySelectorAll("[data-end-date]");
  countdowns.forEach((el) => {
    const endDate = new Date(el.dataset.endDate);

    function update() {
      const now  = new Date();
      const diff = endDate - now;

      if (diff <= 0) {
        el.innerHTML = '<span style="color: #9B2C2C;">Avsluttet</span>';
        return;
      }

      const days    = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours   = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      el.innerHTML = `
          <div class="ap-countdown-box">
            <div class="ap-countdown-value">${days}</div>
            <div class="ap-countdown-label-unit">Dager</div>
          </div>
          <div class="ap-countdown-box">
            <div class="ap-countdown-value">${String(hours).padStart(2,"0")}</div>
            <div class="ap-countdown-label-unit">Timer</div>
          </div>
          <div class="ap-countdown-box">
            <div class="ap-countdown-value">${String(minutes).padStart(2,"0")}</div>
            <div class="ap-countdown-label-unit">Min</div>
          </div>
          <div class="ap-countdown-box">
            <div class="ap-countdown-value">${String(seconds).padStart(2,"0")}</div>
            <div class="ap-countdown-label-unit">Sek</div>
          </div>`;
    }

    update();
    setInterval(update, 1000);
  });
}

// ---- Mini map on farm cards ----
// Each card map container has data-lat, data-lng, data-polygon
function initCardMaps() {
  document.querySelectorAll(".ap-farm-card-map[data-lat]").forEach((container) => {
    const lat     = parseFloat(container.dataset.lat);
    const lng     = parseFloat(container.dataset.lng);
    const polygon = JSON.parse(container.dataset.polygon || "[]");

    // Create a small map (not interactive, just visual)
    const map = L.map(container, {
      zoomControl:    false,
      dragging:       false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom:      false,
      keyboard:       false,
      attributionControl: false
    }).setView([lat, lng], 14);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18
    }).addTo(map);

    // Draw field polygon if available
    if (polygon.length > 2) {
      L.polygon(polygon, {
        color: "#2D5A27",
        fillColor: "#5A9E50",
        fillOpacity: 0.35,
        weight: 2
      }).addTo(map);
    } else {
      // Just a marker
      L.circleMarker([lat, lng], {
        radius: 8,
        color: "#2D5A27",
        fillColor: "#5A9E50",
        fillOpacity: 0.7
      }).addTo(map);
    }
  });
}

// ---- Full farm detail map ----
function initFarmDetailMap() {
  const mapEl = document.getElementById("farm-map");
  if (!mapEl) return;

  const lat     = parseFloat(mapEl.dataset.lat);
  const lng     = parseFloat(mapEl.dataset.lng);
  const polygon = JSON.parse(mapEl.dataset.polygon || "[]");

  const map = L.map("farm-map").setView([lat, lng], 14);

  // Satellite-like tiles (ESRI World Imagery)
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri", maxZoom: 19 }
  ).addTo(map);

  // Draw field polygon
  if (polygon.length > 2) {
    const poly = L.polygon(polygon, {
      color: "#ffffff",
      fillColor: "#8BC34A",
      fillOpacity: 0.3,
      weight: 2.5,
      dashArray: "6, 4"
    }).addTo(map);
    map.fitBounds(poly.getBounds(), { padding: [30, 30] });
  } else {
    L.marker([lat, lng]).addTo(map);
  }
}

// ---- Draw map on create-listing page ----
function initDrawMap() {
  const mapEl = document.getElementById("draw-map");
  if (!mapEl) return;

  // Default center: Norway
  const map = L.map("draw-map").setView([60.472, 8.469], 6);

  // Satellite tiles
  L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "© Esri", maxZoom: 19 }
  ).addTo(map);

  // Drawn layer group
  const drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  // Draw controls (requires leaflet.draw)
  if (L.Control && L.Control.Draw) {
    const drawControl = new L.Control.Draw({
      edit: { featureGroup: drawnItems, remove: true },
      draw: {
        polygon:   { shapeOptions: { color: "#2D5A27", fillColor: "#5A9E50", fillOpacity: 0.35 } },
        polyline:  false,
        rectangle: false,
        circle:    false,
        marker:    false,
        circlemarker: false
      }
    });
    map.addControl(drawControl);

    // When a polygon is drawn, save it + coords to hidden inputs
    map.on(L.Draw.Event.CREATED, (e) => {
      drawnItems.clearLayers();
      drawnItems.addLayer(e.layer);

      const latlngs = e.layer.getLatLngs()[0].map((p) => [p.lat, p.lng]);
      document.getElementById("fieldPolygon").value = JSON.stringify(latlngs);

      // Save center point
      const center = e.layer.getBounds().getCenter();
      document.getElementById("lat").value = center.lat.toFixed(6);
      document.getElementById("lng").value = center.lng.toFixed(6);
    });
  }

  // On address input, geocode to move map (simple approach)
  const addressInput = document.getElementById("address");
  if (addressInput) {
    addressInput.addEventListener("blur", async () => {
      const query = addressInput.value.trim();
      if (!query) return;
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ", Norway")}&limit=1`;
        const res  = await fetch(url);
        const data = await res.json();
        if (data && data[0]) {
          const { lat, lon } = data[0];
          map.setView([parseFloat(lat), parseFloat(lon)], 14);
        }
      } catch (e) {
        console.warn("Geocoding feil:", e);
      }
    });
  }
}

// ---- Fylke filter auto-submit ----
function initFilters() {
  const select = document.getElementById("fylke-filter");
  if (select) {
    select.addEventListener("change", () => {
      const url = new URL(window.location.href);
      url.searchParams.set("fylke", select.value);
      window.location.href = url.toString();
    });
  }
}

// ---- Active nav link highlight ----
function highlightNav() {
  const path = window.location.pathname;
  // Sidebar links (platform pages)
  document.querySelectorAll(".app-sidebar-link").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === path || (href !== "/" && path.startsWith(href))) {
      link.classList.add("nav-active");
    }
  });
  // Top navbar links (landing page)
  document.querySelectorAll(".lp-nav-links a").forEach((link) => {
    if (link.getAttribute("href") === path) {
      link.classList.add("nav-active");
    }
  });
}

// ---- Slik fungerer det – fane-bytte ----
function initHowTabs() {
  const tabs     = document.querySelectorAll(".how-tab");
  const contents = document.querySelectorAll(".how-content");
  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.dataset.tab;

      tabs.forEach((t) => t.classList.remove("how-tab--active"));
      tab.classList.add("how-tab--active");

      contents.forEach((c) => c.classList.add("how-content--hidden"));
      const active = document.getElementById("how-" + target);
      if (active) active.classList.remove("how-content--hidden");
    });
  });
}

// ---- Run everything on page load ----
document.addEventListener("DOMContentLoaded", () => {
  startCountdowns();
  initCardMaps();
  initFarmDetailMap();
  initDrawMap();
  initFilters();
  highlightNav();
  initHowTabs();
});
