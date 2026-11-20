import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useLang } from "@/i18n";
import { LINES, waitRange, type Stop } from "@/data/stops";
import { madridNow, openState } from "@/lib/time";
import { useOpenLabel } from "@/components/brand";

const MADRID: L.LatLngTuple = [40.4168, -3.7038];

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Purple → pink → orange teardrop pin; a pulsing green ring marks units open right now. */
function pinIcon(open: boolean, selected: boolean) {
  const size = selected ? 46 : 36;
  const html = `
    <div class="parada-pin${selected ? " is-selected" : ""}" style="width:${size}px;height:${size}px">
      ${open ? '<span class="parada-pin-pulse"></span>' : ""}
      <svg viewBox="0 0 36 36" width="${size}" height="${size}" aria-hidden="true">
        <defs><linearGradient id="pg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#7c3aed"/><stop offset=".55" stop-color="#ec4899"/><stop offset="1" stop-color="#f97316"/>
        </linearGradient></defs>
        <path d="M18 2C10.3 2 4.5 7.8 4.5 15.3 4.5 25 18 34 18 34s13.5-9 13.5-18.7C31.5 7.8 25.7 2 18 2z"
          fill="${selected || open ? "url(#pg)" : "#64748b"}" stroke="#fff" stroke-width="2.5"/>
        <circle cx="18" cy="15" r="5" fill="#fff"/>
        ${open ? '<circle cx="18" cy="15" r="2.6" fill="#10b981"/>' : ""}
      </svg>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [size, size], iconAnchor: [size / 2, size - 1], popupAnchor: [0, -size + 6] });
}

export function StopsMap({
  stops, selected, onSelect, me,
}: { stops: Stop[]; selected: string | null; onSelect: (id: string) => void; me: { lat: number; lng: number } | null }) {
  const { t, lang } = useLang();
  const openLabel = useOpenLabel();
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const markers = useRef<Map<string, L.Marker>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  // Create the map once.
  useEffect(() => {
    if (!el.current) return;
    const m = L.map(el.current, { center: MADRID, zoom: 11, scrollWheelZoom: false, zoomControl: true, attributionControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    // "Ver detalles" button inside popups
    m.on("popupopen", (e) => {
      const btn = e.popup.getElement()?.querySelector<HTMLButtonElement>("[data-stop]");
      btn?.addEventListener("click", () => { onSelectRef.current(btn.dataset.stop!); m.closePopup(); }, { once: true });
    });
    map.current = m;
    const ro = new ResizeObserver(() => m.invalidateSize());
    ro.observe(el.current);
    return () => { ro.disconnect(); m.remove(); map.current = null; };
  }, []);

  // (Re)draw markers whenever the filtered stops, selection, language or "me" change.
  const signature = stops.map((s) => s.id).join(",");
  useEffect(() => {
    const m = map.current, g = layer.current;
    if (!m || !g) return;
    g.clearLayers();
    markers.current.clear();
    const now = madridNow();
    stops.forEach((s) => {
      const st = openState(s.slots, now);
      const open = st.kind === "open";
      const [lo, hi] = waitRange(s);
      const lines = s.lines
        .map((l) => `<span class="parada-line" style="background:${LINES[l].bg};color:${LINES[l].fg}">${LINES[l].label}</span>`)
        .join("");
      const popup = `
        <div class="parada-popup">
          <div class="parada-popup-lines">${lines}</div>
          <p class="parada-popup-title">${esc(s.name)}</p>
          <p class="parada-popup-status ${open ? "is-open" : ""}">${esc(openLabel(st))}</p>
          ${open ? `<p class="parada-popup-wait">${esc(t({ es: `${lo}-${hi} min de espera`, en: `${lo}-${hi} min wait` }))}</p>` : ""}
          <button type="button" data-stop="${s.id}" class="parada-popup-btn">${esc(t({ es: "Ver detalles", en: "View details" }))} →</button>
        </div>`;
      const mk = L.marker([s.lat, s.lng], {
        icon: pinIcon(open, s.id === selected),
        title: s.name,
        alt: s.name,
        riseOnHover: true,
        zIndexOffset: s.id === selected ? 1000 : open ? 500 : 0,
        keyboard: true,
      })
        .bindPopup(popup, { closeButton: true, autoPanPadding: [24, 24], minWidth: 190 })
        .bindTooltip(esc(s.name), { direction: "top", offset: [0, -30], className: "parada-tip" })
        .addTo(g);
      markers.current.set(s.id, mk);
    });
    if (me) {
      L.circleMarker([me.lat, me.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#7c3aed", fillOpacity: 1 })
        .bindTooltip(t({ es: "Tú", en: "You" }), { permanent: true, direction: "bottom", className: "parada-tip" })
        .addTo(g);
    }
  }, [signature, selected, lang, me?.lat, me?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit to the visible stops when the filter changes.
  useEffect(() => {
    const m = map.current;
    if (!m || !stops.length) return;
    const pts: L.LatLngTuple[] = stops.map((s) => [s.lat, s.lng]);
    if (me) pts.push([me.lat, me.lng]);
    m.fitBounds(L.latLngBounds(pts), { padding: [36, 36], maxZoom: 14 });
  }, [signature, me?.lat, me?.lng]); // eslint-disable-line react-hooks/exhaustive-deps

  // Pan to the selected stop.
  useEffect(() => {
    const m = map.current;
    const s = stops.find((x) => x.id === selected);
    if (m && s) m.panTo([s.lat, s.lng], { animate: true });
  }, [selected]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={el}
      className="isolate h-full w-full"
      role="region"
      aria-label={t({ es: "Mapa interactivo de todas las paradas", en: "Interactive map of all stops" })}
    />
  );
}
