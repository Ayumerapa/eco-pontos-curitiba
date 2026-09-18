"use strict";
const points = window.ECO_POINTS || [],
  results = document.querySelector("#results"),
  input = document.querySelector("#search");
const esc = (s) =>
  String(s || "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const normalize = (s) =>
  String(s)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
let map,
  selected = null,
  visible = points;
const markers = new Map();
function icon(p) {
  return L.divIcon({
    className: "eco-marker" + (selected === p.id ? " selected" : ""),
    html: `<span><b>${p.number}</b></span>`,
    iconSize: [38, 43],
    iconAnchor: [19, 40],
    popupAnchor: [0, -38],
  });
}
function render() {
  const q = normalize(input.value.trim());
  visible = points.filter((p) =>
    normalize(p.name + " " + p.address + " " + p.neighborhood).includes(q),
  );
  document.querySelector("#count").textContent = visible.length;
  results.innerHTML = visible.length
    ? visible
        .map(
          (p) =>
            `<button class="point${selected === p.id ? " active" : ""}" data-id="${p.id}" aria-pressed="${selected === p.id}"><span class="number">${String(p.number).padStart(2, "0")}</span><span><span class="neighborhood">${esc(p.neighborhood)}</span><strong>${esc(p.name)}</strong><span class="address">${esc(p.address)}</span><span class="collection-description"><b>O que recebe</b>${esc(p.description)}</span></span></button>`,
        )
        .join("")
    : '<p class="empty">Nenhum ecoponto encontrado. Tente outro nome, bairro ou rua.</p>';
  if (map)
    markers.forEach((m, id) => {
      if (visible.some((p) => p.id === id)) {
        if (!map.hasLayer(m)) m.addTo(map);
        m.setIcon(icon(points.find((p) => p.id === id)));
      } else map.removeLayer(m);
    });
}
function choose(id) {
  selected = id;
  render();
  const p = points.find((p) => p.id === id);
  if (map && p) {
    map.setView([p.lat, p.lng], 15);
    markers.get(id).openPopup();
    if (innerWidth <= 800)
      document
        .querySelector(".map-section")
        .scrollIntoView({ block: "center" });
  }
}
function fit() {
  if (map && visible.length)
    map.fitBounds(
      visible.map((p) => [p.lat, p.lng]),
      { padding: [60, 60], maxZoom: 14 },
    );
}
results.addEventListener("click", (e) => {
  const b = e.target.closest("[data-id]");
  if (b) choose(Number(b.dataset.id));
});
input.addEventListener("input", () => {
  selected = null;
  render();
  if (map) map.closePopup();
  fit();
});
document.querySelector("#reset").addEventListener("click", () => {
  input.value = "";
  selected = null;
  render();
  if (map) map.closePopup();
  fit();
});
if (location.protocol === "file:") {
  document.querySelector("#map").innerHTML =
    '<div class="map-loading"><div><b>Abra pelo Iniciar EcoCuritiba</b><br>Feche esta aba e dê dois cliques em<br><b>Iniciar EcoCuritiba.cmd</b> na pasta do site.<br>O mapa precisa de um endereço local para carregar.</div></div>';
  render();
} else if (window.L) {
  map = L.map("map", { zoomControl: false }).setView([-25.48, -49.29], 11);
  L.control
    .zoom({
      position: "topright",
      zoomInTitle: "Aproximar",
      zoomOutTitle: "Afastar",
    })
    .addTo(map);
  let errors = 0;
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> | GeoCuritiba / IPPUC',
  })
    .addTo(map)
    .on("tileerror", () => {
      if (++errors > 4) {
        const el = document.querySelector("#message");
        el.hidden = false;
        el.textContent =
          "Parte do mapa não carregou. Verifique a conexão. Os endereços continuam disponíveis na lista.";
      }
    });
  points.forEach((p) => {
    const m = L.marker([p.lat, p.lng], {
      icon: icon(p),
      title: p.name,
      alt: p.name,
    }).bindPopup(
      `<h3>${esc(p.name)}</h3><p>${esc(p.address)}<br>${esc(p.neighborhood)} · Curitiba</p><h4>O que recebe</h4><ul>${p.materials.map((s) => `<li>${esc(s)}</li>`).join("")}</ul><p class="disposal-note">${esc(p.disposalNote)}</p><a class="materials-source" href="${esc(p.materialsSource)}" target="_blank" rel="noopener">Fonte: Prefeitura de Curitiba ↗</a><p>Confirme condições de recebimento e atendimento pelo 156.</p><a class="route" href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(p.lat + "," + p.lng)}" target="_blank" rel="noopener">Como chegar ↗</a>`,
      { maxWidth: 320, maxHeight: 300 },
    );
    m.on("click", () => choose(p.id));
    markers.set(p.id, m);
  });
  render();
  fit();
  new ResizeObserver(() => map.invalidateSize()).observe(
    document.querySelector("#map"),
  );
} else {
  document.querySelector("#map").innerHTML =
    '<div class="map-loading">Mapa indisponível. Verifique sua conexão com a internet.</div>';
  render();
}
