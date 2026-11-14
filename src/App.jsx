import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { SERIES_INFO, TIMELINE_EVENTS } from './data/timelineData.js';
import { buildEventSearchIndex, searchTimelineEvents } from './utils/timelineSearch.js';

/* ==========================================================================
   CRISP 1.5PX STROKE SVG ICONS (LUCIDE-REACT STANDARD, ZERO EMOJIS)
   ========================================================================== */
const IconSearch = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

const IconFlip = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

const IconPlay = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="6 3 20 12 6 21 6 3" />
  </svg>
);

const IconPause = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="14" y="4" width="4" height="16" rx="1" />
    <rect x="6" y="4" width="4" height="16" rx="1" />
  </svg>
);

const IconClose = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

const IconArrowLeft = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m15 18-6-6 6-6" />
  </svg>
);

const IconArrowRight = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const IconExternal = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </svg>
);

const IconFrame = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <rect x="7" y="7" width="10" height="10" rx="1" />
  </svg>
);

const IconCompass = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

const IconMapPin = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconExpand = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9" />
    <polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" />
    <line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);

const IconCheck = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const IconEyeOff = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" y1="2" x2="22" y2="22" />
  </svg>
);

const IconEye = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconChevronDown = ({ className = 'w-3 h-3' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/* ==========================================================================
   LOCAL STORAGE PERSISTENCE (ZERO-LOGIN RECITATION PROGRESS)
   ========================================================================== */
const STORAGE_KEYS = {
  activeCard: 'historia.activeCard.v1',
  learned: 'historia.learned.v1',
  playSpeed: 'historia.playSpeed.v1',
  reciteMode: 'historia.reciteMode.v1'
};
const PLAY_SPEED_OPTIONS = [1.5, 2.5, 4];

function safeStorageGet(key) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeStorageSet(key, value) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage quota or private-mode restrictions cleanly
  }
}

function loadInitialActiveEventId() {
  const raw = safeStorageGet(STORAGE_KEYS.activeCard);
  if (!raw) return null;
  const exists = TIMELINE_EVENTS.some((ev) => ev.id === raw);
  return exists ? raw : null;
}

function loadInitialLearnedSet() {
  const raw = safeStorageGet(STORAGE_KEYS.learned);
  if (!raw) return new Set();
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    const validIds = new Set(TIMELINE_EVENTS.map((ev) => ev.id));
    return new Set(parsed.filter((id) => typeof id === 'string' && validIds.has(id)));
  } catch {
    return new Set();
  }
}

function loadInitialPlaySpeed() {
  const raw = Number(safeStorageGet(STORAGE_KEYS.playSpeed));
  return PLAY_SPEED_OPTIONS.includes(raw) ? raw : 2.5;
}

const DEFAULT_RECITE_OPTIONS = {
  upcoming: false,
  title: false,
  photo: false,
  all: false
};

function loadInitialReciteOptions() {
  const raw = safeStorageGet(STORAGE_KEYS.reciteMode);
  if (!raw || raw === '0') return { ...DEFAULT_RECITE_OPTIONS };
  if (raw === '1') return { upcoming: true, title: false, photo: false, all: false };
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_RECITE_OPTIONS };
    const isAll = Boolean(parsed.all);
    return {
      upcoming: isAll || Boolean(parsed.upcoming),
      title: isAll || Boolean(parsed.title),
      photo: isAll || Boolean(parsed.photo),
      all: isAll
    };
  } catch {
    return { ...DEFAULT_RECITE_OPTIONS };
  }
}

/* ==========================================================================
   PART 3: MAPLIBRE GL PHYSICAL-RELIEF CLASSICAL ATLAS
   - Physical Shaded-Relief Basemap (Esri World Physical Relief, zero modern roads/borders)
   - Warm archival sepia tint on .maplibregl-canvas + radial vignette overlay
   - 10 Non-Interactive Classical Region Watermarks at exact historical coordinates
   - Native WebGL GeoJSON circle layers for ALL timeline pins (zero DOM transform jolt)
   - Parabolic map.flyTo() camera physics with theatre overview + drill-in site picker
   - Engraved compass-rose target reticle + Non-Truncating Ivory & Brass Active Callout Plaque
   ========================================================================== */
const CLASSICAL_REGION_WATERMARKS = [
  { name: 'MESOPOTAMIA', coords: [44.0, 33.5] },
  { name: 'AEGYPTUS', coords: [30.8, 26.8] },
  { name: 'CANAAN / JUDEA', coords: [35.2, 31.8] },
  { name: 'GRAECIA', coords: [22.4, 38.5] },
  { name: 'ITALIA', coords: [12.5, 42.8] },
  { name: 'GALLIA', coords: [2.5, 46.8] },
  { name: 'BRITANNIA', coords: [-2.0, 53.5] },
  { name: 'HISPANIA', coords: [-3.7, 40.2] },
  { name: 'ASIA MINOR', coords: [32.8, 39.0] },
  { name: 'AMERICA SEPTENTRIONALIS', coords: [-82.0, 38.0] }
];

const ATLAS_THEATRES = {
  'near-east': {
    id: 'near-east',
    label: 'Near East',
    center: [37.5, 31.2],
    zoom: 4.6,
    pitch: 22
  },
  mediterranean: {
    id: 'mediterranean',
    label: 'Mediterranean',
    center: [21.5, 37.8],
    zoom: 4.2,
    pitch: 22
  },
  europe: {
    id: 'europe',
    label: 'Europe',
    center: [8.5, 48.5],
    zoom: 4.3,
    pitch: 22
  },
  'north-america': {
    id: 'north-america',
    label: 'N. America',
    center: [-86.0, 38.5],
    zoom: 3.9,
    pitch: 20
  },
  world: {
    id: 'world',
    label: 'World',
    center: [12.0, 28.0],
    zoom: 1.9,
    pitch: 0
  }
};

/**
 * Physical Shaded-Relief Basemap Style (Zero Modern Borders or Roads)
 */
function buildClassicalAtlasStyle() {
  return {
    version: 8,
    sources: {
      'physical-relief': {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Physical_Map/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256,
        maxzoom: 8,
        attribution: 'Classical Geography | US National Park Service / Esri Physical Relief'
      },
      'events-source': {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      }
    },
    layers: [
      {
        id: 'parchment-base',
        type: 'background',
        paint: { 'background-color': '#EDE5D4' }
      },
      {
        id: 'physical-relief-layer',
        type: 'raster',
        source: 'physical-relief',
        paint: {
          'raster-opacity': 0.88,
          'raster-saturation': -0.35,
          'raster-contrast': 0.08,
          'raster-brightness-min': 0.12
        }
      },
      {
        id: 'events-pins-hover',
        type: 'circle',
        source: 'events-source',
        filter: ['==', ['get', 'index'], -1],
        paint: {
          'circle-radius': 10.5,
          'circle-color': 'rgba(28, 25, 23, 0.10)',
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#1C1917'
        }
      },
      {
        id: 'events-pins-circle',
        type: 'circle',
        source: 'events-source',
        paint: {
          'circle-radius': 4.8,
          'circle-color': '#FCFBF7',
          'circle-stroke-width': 1.8,
          'circle-stroke-color': ['get', 'seriesColor'],
          'circle-opacity': 0.9,
          'circle-stroke-opacity': 0.88
        }
      },
      {
        id: 'events-pins-era',
        type: 'circle',
        source: 'events-source',
        filter: ['==', ['get', 'seriesId'], ''],
        paint: {
          'circle-radius': 5.8,
          'circle-color': '#FCFBF7',
          'circle-stroke-width': 2.2,
          'circle-stroke-color': ['get', 'seriesColor'],
          'circle-opacity': 0.96,
          'circle-stroke-opacity': 0.96
        }
      },
      {
        id: 'events-pins-active',
        type: 'circle',
        source: 'events-source',
        filter: ['==', ['get', 'index'], -1],
        paint: {
          'circle-radius': 5.5,
          'circle-color': ['get', 'seriesColor'],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#FCFBF7',
          'circle-opacity': 1,
          'circle-stroke-opacity': 1
        }
      }
    ]
  };
}

function ensureMapLibreLoaded() {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (window.maplibregl) return Promise.resolve(window.maplibregl);

  return new Promise((resolve) => {
    if (!document.querySelector('link[data-maplibre-css]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
      link.setAttribute('data-maplibre-css', 'true');
      document.head.appendChild(link);
    }
    const existingScript = document.querySelector('script[data-maplibre-js]');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.maplibregl));
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
    script.async = true;
    script.setAttribute('data-maplibre-js', 'true');
    script.onload = () => resolve(window.maplibregl);
    script.onerror = () => resolve(null);
    document.head.appendChild(script);
  });
}

/**
 * MapLibre GL Physical-Relief Classical Atlas Component
 */
function HistoricalAtlasPlate({
  mode = 'stage',
  activeEvent,
  events,
  activeIndex,
  onSelectIndex,
  onCloseDrawer,
  onExpandToStage,
  onReturnToGallery,
  isFiltered = false
}) {
  const [cameraMode, setCameraMode] = useState('auto'); // 'auto' | 'near-east' | 'mediterranean' | 'europe' | 'north-america' | 'world' | 'free'
  const [mapReady, setMapReady] = useState(false);
  const [hoverInfo, setHoverInfo] = useState(null); // { x, y, items: [...] }
  const [sitePicker, setSitePicker] = useState(null); // { x, y, siteName, items: [...] }
  const [containerSize, setContainerSize] = useState({ width: 800, height: 400 });
  const [currentZoom, setCurrentZoom] = useState(5.2);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const watermarkMarkersRef = useRef([]);
  const activeMarkerRef = useRef(null);
  const latestPropsRef = useRef({ events, activeIndex, onSelectIndex });

  useEffect(() => {
    latestPropsRef.current = { events, activeIndex, onSelectIndex };
  }, [events, activeIndex, onSelectIndex]);

  const getMapPadding = useCallback(() => {
    const isDesktopStage =
      mode === 'stage' && typeof window !== 'undefined' && window.innerWidth >= 640;
    return isDesktopStage
      ? { left: 360, top: 105, right: 70, bottom: 60 }
      : { left: 48, top: 88, right: 48, bottom: 40 };
  }, [mode]);

  const eventsGeoJson = useMemo(() => {
    const features = [];
    events.forEach((ev, idx) => {
      const lng = ev.lng ?? ev.location?.lng;
      const lat = ev.lat ?? ev.location?.lat;
      if (typeof lng !== 'number' || typeof lat !== 'number') return;
      features.push({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          index: idx,
          cardNumber: ev.cardNumber,
          cardNumberPadded: ev.cardNumberPadded || String(ev.cardNumber).padStart(3, '0'),
          title: ev.title,
          dateDisplay: ev.dateDisplay || '',
          seriesId: ev.seriesId,
          seriesColor: ev.seriesColor || '#B85D3B',
          locationName: ev.location?.name || '',
          region: ev.location?.region || ''
        }
      });
    });
    return { type: 'FeatureCollection', features };
  }, [events]);

  // Initialize MapLibre GL map + non-interactive Classical Historical Region Watermarks + WebGL Pin Interactions
  useEffect(() => {
    let cancelled = false;
    let map = null;
    let resizeObs = null;

    ensureMapLibreLoaded().then((maplibregl) => {
      if (cancelled || !maplibregl || !mapContainerRef.current) return;

      const initLng = activeEvent?.lng ?? activeEvent?.location?.lng ?? 35.23;
      const initLat = activeEvent?.lat ?? activeEvent?.location?.lat ?? 31.78;
      const initZoom = activeEvent?.recommendedZoom || 5.2;

      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: buildClassicalAtlasStyle(),
        center: [initLng, initLat],
        zoom: mode === 'drawer' ? Math.max(2.2, initZoom - 0.8) : initZoom,
        pitch: 22,
        bearing: 0,
        minZoom: 1.4,
        maxZoom: 8.5,
        attributionControl: false
      });

      map.addControl(
        new maplibregl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        }),
        'bottom-right'
      );

      // Ensure MapLibre WebGL canvas always matches its full container dimensions
      const updateContainerSize = () => {
        if (!mapContainerRef.current) return;
        setContainerSize({
          width: mapContainerRef.current.clientWidth || 800,
          height: mapContainerRef.current.clientHeight || 400
        });
      };
      updateContainerSize();

      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObs = new ResizeObserver(() => {
          if (map) map.resize();
          updateContainerSize();
        });
        resizeObs.observe(mapContainerRef.current);
      }

      map.on('zoomend', () => {
        if (map) setCurrentZoom(map.getZoom());
      });

      map.on('dragstart', (e) => {
        if (e.originalEvent) {
          setCameraMode((prev) => (prev === 'auto' ? 'free' : prev));
          setSitePicker(null);
        }
      });

      map.on('zoomstart', (e) => {
        if (e.originalEvent) {
          setSitePicker(null);
        }
      });

      const PIN_LAYERS = ['events-pins-circle', 'events-pins-era', 'events-pins-active'];

      map.on('mousemove', 'events-pins-circle', (e) => {
        const bbox = [
          [e.point.x - 6, e.point.y - 6],
          [e.point.x + 6, e.point.y + 6]
        ];
        const hits = map.queryRenderedFeatures(bbox, { layers: PIN_LAYERS });
        const seen = new Set();
        const items = [];
        for (const f of hits) {
          const idx = f.properties?.index;
          if (typeof idx === 'number' && !seen.has(idx)) {
            seen.add(idx);
            items.push(f.properties);
          }
        }
        if (items.length === 0) return;
        items.sort((a, b) => Number(a.cardNumber) - Number(b.cardNumber));
        map.getCanvas().style.cursor = 'pointer';
        if (map.getLayer('events-pins-hover')) {
          map.setFilter('events-pins-hover', [
            'in',
            ['get', 'index'],
            ['literal', items.map((it) => it.index)]
          ]);
        }
        setHoverInfo({
          x: e.point.x,
          y: e.point.y,
          items
        });
      });

      map.on('mouseleave', 'events-pins-circle', () => {
        map.getCanvas().style.cursor = '';
        if (map.getLayer('events-pins-hover')) {
          map.setFilter('events-pins-hover', ['==', ['get', 'index'], -1]);
        }
        setHoverInfo(null);
      });

      map.on('click', (e) => {
        const bbox = [
          [e.point.x - 8, e.point.y - 8],
          [e.point.x + 8, e.point.y + 8]
        ];
        const hits = map.queryRenderedFeatures(bbox, { layers: PIN_LAYERS });
        if (!hits || hits.length === 0) {
          setSitePicker(null);
          return;
        }
        const seen = new Set();
        const items = [];
        for (const f of hits) {
          const idx = f.properties?.index;
          if (typeof idx === 'number' && !seen.has(idx)) {
            seen.add(idx);
            items.push(f.properties);
          }
        }
        if (items.length === 0) {
          setSitePicker(null);
          return;
        }
        items.sort((a, b) => Number(a.cardNumber) - Number(b.cardNumber));

        if (items.length === 1) {
          setSitePicker(null);
          setHoverInfo(null);
          latestPropsRef.current.onSelectIndex(items[0].index);
          return;
        }

        // Multiple overlapping plates at this site: show archival site picker
        setHoverInfo(null);
        setSitePicker({
          x: e.point.x,
          y: e.point.y,
          lngLat: [e.lngLat.lng, e.lngLat.lat],
          siteName: items[0].locationName || items[0].region || 'Historical Site',
          items
        });
      });

      map.on('load', () => {
        if (cancelled) return;
        map.resize();
        setTimeout(() => {
          if (!cancelled && map) map.resize();
        }, 60);
        mapInstanceRef.current = map;

        // Add the 10 Classical Historical Region Watermarks at fixed coordinates (no CSS transform transition)
        watermarkMarkersRef.current.forEach((wm) => wm.remove());
        watermarkMarkersRef.current = CLASSICAL_REGION_WATERMARKS.map((region) => {
          const el = document.createElement('div');
          el.style.cssText =
            'pointer-events:none;user-select:none;font-family:"Playfair Display","Newsreader",Georgia,serif;font-style:italic;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.22em;color:rgba(28, 25, 23, 0.55);text-shadow:0 1px 3px rgba(252, 251, 247, 0.85);white-space:nowrap;z-index:2;';
          el.textContent = region.name;
          return new maplibregl.Marker({ element: el, anchor: 'center' })
            .setLngLat(region.coords)
            .addTo(map);
        });

        setMapReady(true);
      });
    });

    return () => {
      cancelled = true;
      setMapReady(false);
      setHoverInfo(null);
      setSitePicker(null);
      if (resizeObs) resizeObs.disconnect();
      watermarkMarkersRef.current.forEach((m) => m.remove());
      watermarkMarkersRef.current = [];
      if (activeMarkerRef.current) {
        activeMarkerRef.current.remove();
        activeMarkerRef.current = null;
      }
      if (map) {
        map.remove();
      }
      mapInstanceRef.current = null;
    };
  }, [mode]);

  // Clear transient hover/site popups and update GeoJSON when events change
  useEffect(() => {
    setHoverInfo(null);
    setSitePicker(null);
  }, [events]);

  // Sync ALL timeline event pins into the native WebGL GeoJSON source (only when filtered events list changes)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    const src = map.getSource('events-source');
    if (src && src.setData) {
      src.setData(eventsGeoJson);
    }
  }, [eventsGeoJson, mapReady]);

  // Update active & era pin layer filters cleanly without rebuilding/re-uploading all 160 features
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;
    if (map.getLayer('events-pins-era')) {
      map.setFilter('events-pins-era', ['==', ['get', 'seriesId'], activeEvent?.seriesId || '']);
    }
    if (map.getLayer('events-pins-active')) {
      map.setFilter('events-pins-active', ['==', ['get', 'index'], activeIndex]);
    }
  }, [activeEvent?.seriesId, activeIndex, mapReady]);

  // Fit map camera to frame all currently filtered matching pins
  const handleFitFilteredMatches = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || events.length === 0) return;
    const coords = [];
    for (let i = 0; i < events.length; i += 1) {
      const ev = events[i];
      const lng = ev.lng ?? ev.location?.lng;
      const lat = ev.lat ?? ev.location?.lat;
      if (typeof lng === 'number' && typeof lat === 'number') {
        coords.push([lng, lat]);
      }
    }
    if (coords.length === 0) return;

    setSitePicker(null);
    let minLng = coords[0][0];
    let maxLng = coords[0][0];
    let minLat = coords[0][1];
    let maxLat = coords[0][1];
    for (let i = 1; i < coords.length; i += 1) {
      const [lng, lat] = coords[i];
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
    }

    if (maxLng - minLng < 0.05 && maxLat - minLat < 0.05) {
      setCameraMode('auto');
      map.flyTo({
        center: [minLng, minLat],
        zoom: events[0]?.recommendedZoom || 5.2,
        pitch: 22,
        bearing: 0,
        speed: 0.9,
        padding: getMapPadding(),
        essential: true
      });
      return;
    }

    setCameraMode('free');
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat]
      ],
      {
        padding: getMapPadding(),
        maxZoom: 5.4,
        pitch: 18,
        duration: 850,
        essential: true
      }
    );
  }, [events, getMapPadding, mapReady]);

  // Explicit camera jump handler for Follow Plate / Theatre Region presets
  const handleSelectCameraMode = useCallback(
    (nextMode) => {
      setCameraMode(nextMode);
      setSitePicker(null);
      const map = mapInstanceRef.current;
      if (!map || !mapReady) return;
      const padding = getMapPadding();

      if (nextMode === 'auto') {
        if (!activeEvent) return;
        const lng = activeEvent.lng ?? activeEvent.location?.lng ?? 35.23;
        const lat = activeEvent.lat ?? activeEvent.location?.lat ?? 31.78;
        const recZoom = activeEvent.recommendedZoom || 5.2;
        map.flyTo({
          center: [lng, lat],
          zoom: mode === 'drawer' ? Math.max(2.4, recZoom - 0.75) : recZoom,
          pitch: 22,
          bearing: 0,
          speed: 0.9,
          curve: 1.35,
          padding,
          essential: true
        });
        return;
      }

      const preset = ATLAS_THEATRES[nextMode] || ATLAS_THEATRES.world;
      map.flyTo({
        center: preset.center,
        zoom: mode === 'drawer' ? Math.max(1.6, preset.zoom - 0.65) : preset.zoom,
        pitch: preset.pitch,
        bearing: 0,
        speed: 0.9,
        curve: 1.35,
        padding:
          mode === 'stage' && typeof window !== 'undefined' && window.innerWidth >= 640
            ? { left: 340, top: 40, right: 40, bottom: 40 }
            : { left: 20, top: 20, right: 20, bottom: 20 },
        essential: true
      });
    },
    [activeEvent, getMapPadding, mapReady, mode]
  );

  // Parabolic map.flyTo() Camera Physics ONLY when in 'auto' (Follow Plate) mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady || !activeEvent || cameraMode !== 'auto') return;

    const lng = activeEvent.lng ?? activeEvent.location?.lng ?? 35.23;
    const lat = activeEvent.lat ?? activeEvent.location?.lat ?? 31.78;
    const recZoom = activeEvent.recommendedZoom || 5.2;

    map.flyTo({
      center: [lng, lat],
      zoom: mode === 'drawer' ? Math.max(2.4, recZoom - 0.75) : recZoom,
      pitch: 22,
      bearing: 0,
      speed: 0.85,
      curve: 1.35,
      padding: getMapPadding(),
      essential: true
    });
  }, [activeEvent, cameraMode, mode, mapReady, getMapPadding]);

  // Render Engraved Target Reticle & Non-Truncating Ivory Callout Plaque (Zero innerHTML / Zero CSS transform transition)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const maplibregl = typeof window !== 'undefined' ? window.maplibregl : null;
    if (!map || !maplibregl || !mapReady || !activeEvent) return;

    if (activeMarkerRef.current) {
      activeMarkerRef.current.remove();
      activeMarkerRef.current = null;
    }

    const activeLng = activeEvent.lng ?? activeEvent.location?.lng;
    const activeLat = activeEvent.lat ?? activeEvent.location?.lat;
    if (typeof activeLng !== 'number' || typeof activeLat !== 'number') return;

    const container = document.createElement('div');
    container.style.cssText =
      'position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;z-index:25;pointer-events:none;';

    // Ivory Museum Callout Plaque floating above (or below if near top edge)
    const plaque = document.createElement('div');
    const updatePlaquePlacement = () => {
      const projected = map.project([activeLng, activeLat]);
      const placeBelow = projected.y < 115;
      plaque.style.top = placeBelow ? 'calc(100% + 12px)' : '';
      plaque.style.bottom = placeBelow ? '' : 'calc(100% + 12px)';
    };

    plaque.style.cssText =
      'position:absolute;left:50%;transform:translateX(-50%);background:#FCFBF7;color:#1C1917;border:1px solid #1C1917;border-top:3px solid ' +
      activeEvent.seriesColor +
      ';box-shadow:0 6px 20px rgba(28,25,23,0.18);padding:6px 12px;border-radius:3px;width:max-content;max-width:min(310px,calc(100vw - 48px));pointer-events:auto;' +
      (sitePicker ? 'display:none;' : '');
    updatePlaquePlacement();

    const plaqueHeader = document.createElement('div');
    plaqueHeader.style.cssText =
      'display:flex;align-items:center;justify-content:space-between;gap:10px;font-family:Inter,sans-serif;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:' +
      activeEvent.seriesColor +
      ';margin-bottom:2px;';

    const headerNumSpan = document.createElement('span');
    headerNumSpan.textContent = `NO. ${String(activeEvent.cardNumber).padStart(3, '0')} OF ${TIMELINE_EVENTS.length}`;

    const headerDateSpan = document.createElement('span');
    headerDateSpan.style.cssText =
      "font-family:'Playfair Display',Georgia,serif;font-style:italic;font-weight:400;letter-spacing:0;text-transform:none;color:#57534E;";
    headerDateSpan.textContent = activeEvent.dateDisplay || '';

    plaqueHeader.appendChild(headerNumSpan);
    plaqueHeader.appendChild(headerDateSpan);

    const plaqueTitle = document.createElement('div');
    plaqueTitle.style.cssText =
      'font-family:"Playfair Display","Newsreader",Georgia,serif;font-size:13.5px;font-weight:600;color:#1C1917;line-height:1.25;';
    plaqueTitle.textContent = activeEvent.title;

    const plaqueLocus = document.createElement('div');
    plaqueLocus.style.cssText =
      'font-family:"Newsreader","Playfair Display",Georgia,serif;font-style:italic;font-size:11.5px;color:#57534E;line-height:1.25;margin-top:1px;';
    plaqueLocus.textContent = `${activeEvent.location?.name || ''} | ${activeEvent.location?.region || ''}`;

    plaque.appendChild(plaqueHeader);
    plaque.appendChild(plaqueTitle);
    plaque.appendChild(plaqueLocus);

    // Engraved Compass-Rose / Target Reticle SVG centered at [lng, lat] via safe DOM SVG API
    const reticle = document.createElement('div');
    reticle.style.cssText = 'width:36px;height:36px;display:flex;align-items:center;justify-content:center;';
    const svgNs = 'http://www.w3.org/2000/svg';
    const svgEl = document.createElementNS(svgNs, 'svg');
    svgEl.setAttribute('width', '36');
    svgEl.setAttribute('height', '36');
    svgEl.setAttribute('viewBox', '0 0 36 36');
    svgEl.setAttribute('fill', 'none');

    const outerRing = document.createElementNS(svgNs, 'circle');
    outerRing.setAttribute('cx', '18');
    outerRing.setAttribute('cy', '18');
    outerRing.setAttribute('r', '14');
    outerRing.setAttribute('fill', activeEvent.seriesColor);
    outerRing.setAttribute('fill-opacity', '0.14');
    outerRing.setAttribute('stroke', '#1C1917');
    outerRing.setAttribute('stroke-width', '1.2');
    svgEl.appendChild(outerRing);

    const innerRing = document.createElementNS(svgNs, 'circle');
    innerRing.setAttribute('cx', '18');
    innerRing.setAttribute('cy', '18');
    innerRing.setAttribute('r', '9.5');
    innerRing.setAttribute('fill', 'none');
    innerRing.setAttribute('stroke', activeEvent.seriesColor);
    innerRing.setAttribute('stroke-width', '1.2');
    innerRing.setAttribute('stroke-dasharray', '2 2');
    svgEl.appendChild(innerRing);

    const crossLines = [
      ['18', '1', '18', '9'],
      ['18', '27', '18', '35'],
      ['1', '18', '9', '18'],
      ['27', '18', '35', '18']
    ];
    for (const [x1, y1, x2, y2] of crossLines) {
      const line = document.createElementNS(svgNs, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', '#1C1917');
      line.setAttribute('stroke-width', '1.3');
      svgEl.appendChild(line);
    }
    reticle.appendChild(svgEl);

    container.appendChild(plaque);
    container.appendChild(reticle);

    const activeMarker = new maplibregl.Marker({
      element: container,
      anchor: 'center'
    })
      .setLngLat([activeLng, activeLat])
      .addTo(map);
    activeMarkerRef.current = activeMarker;

    map.on('moveend', updatePlaquePlacement);
    return () => {
      map.off('moveend', updatePlaquePlacement);
      if (activeMarkerRef.current) {
        activeMarkerRef.current.remove();
        activeMarkerRef.current = null;
      }
    };
  }, [activeEvent, mapReady, Boolean(sitePicker)]);

  const containerWidth = containerSize.width;
  const containerHeight = containerSize.height;

  return (
    <section
      className={`relative w-full flex flex-col select-none overflow-hidden ${
        mode === 'stage' ? 'flex-1 min-h-[500px]' : 'h-[245px] sm:h-[270px] border-t'
      }`}
      style={{
        backgroundColor: '#EDE5D4',
        borderColor: '#DCD6C8'
      }}
    >
      {/* Top Physical-Relief Atlas Control Bar */}
      <div
        className="relative z-20 px-4 lg:px-8 py-2 flex flex-wrap items-center justify-between gap-2 border-b"
        style={{ backgroundColor: '#F5F2EB', borderColor: '#DCD6C8' }}
      >
        {/* Left: Active Historical Locus */}
        {activeEvent ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className="inline-flex items-center gap-1.5 text-[11px] font-sans font-semibold uppercase tracking-[0.14em] shrink-0"
              style={{ color: activeEvent.seriesColor }}
            >
              <IconCompass className="w-3.5 h-3.5" />
              <span>NO. {String(activeEvent.cardNumber).padStart(3, '0')} ATLAS</span>
            </span>
            <span className="text-[#DCD6C8]">|</span>
            <span className="font-serif font-semibold text-xs sm:text-sm text-[#1C1917] truncate">
              {activeEvent.location?.name || activeEvent.title}
            </span>
            {activeEvent.location?.region && (
              <span className="hidden md:inline font-serif italic text-xs text-[#57534E] truncate">
                ({activeEvent.location.region})
              </span>
            )}
          </div>
        ) : (
          <div className="text-xs font-serif italic text-[#57534E]">Classical Atlas</div>
        )}

        {/* Right: Theatre Camera Presets & Stage/Drawer Controls */}
        <div className="flex flex-wrap items-center gap-1.5">
          {mode === 'stage' && isFiltered && events.length > 1 && (
            <button
              onClick={handleFitFilteredMatches}
              className="px-2.5 py-1 rounded-[4px] bg-[#FCFBF7] hover:bg-[#1C1917] hover:text-[#FCFBF7] text-[#1C1917] border border-[#C8C0B0] text-[11px] font-medium transition tabular-nums"
              title="Zoom map to frame all matching pins"
            >
              Fit {events.length} Pins
            </button>
          )}
          <div className="flex items-center bg-[#EDE8DD] border border-[#DCD6C8] rounded-[4px] p-0.5 text-[11px]">
            {[
              { id: 'auto', label: 'Follow Plate' },
              { id: 'near-east', label: 'Near East' },
              { id: 'mediterranean', label: 'Mediterranean' },
              { id: 'europe', label: 'Europe' },
              { id: 'north-america', label: 'N. America' },
              { id: 'world', label: 'World' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => handleSelectCameraMode(t.id)}
                className={`px-2.5 py-1 rounded-[3px] font-medium transition ${
                  cameraMode === t.id
                    ? 'bg-[#FCFBF7] text-[#1C1917] shadow-sm'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {mode === 'drawer' ? (
            <>
              <button
                onClick={onExpandToStage}
                className="px-2.5 py-1 rounded-[4px] bg-[#FCFBF7] hover:bg-[#1C1917] hover:text-[#FCFBF7] text-[#1C1917] border border-[#DCD6C8] text-[11px] font-medium flex items-center gap-1 transition"
                title="Expand Atlas to Full Exhibition Stage"
              >
                <IconExpand className="w-3 h-3" />
                <span className="hidden sm:inline">Full Stage</span>
              </button>
              <button
                onClick={onCloseDrawer}
                className="w-6 h-6 rounded-[4px] bg-[#FCFBF7] hover:bg-[#1C1917] hover:text-[#FCFBF7] text-[#1C1917] border border-[#DCD6C8] flex items-center justify-center transition"
                title="Collapse Atlas Drawer"
              >
                <IconClose className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <button
              onClick={onReturnToGallery}
              className="px-3 py-1 rounded-[4px] bg-[#1C1917] text-[#FCFBF7] text-xs font-medium flex items-center gap-1.5 hover:opacity-90 transition"
            >
              <span>Gallery Stage</span>
            </button>
          )}
        </div>
      </div>

      {/* Main MapLibre GL Physical-Relief Canvas */}
      <div
        className="relative flex-1 w-full overflow-hidden"
        style={{
          minHeight: mode === 'stage' ? 'calc(100vh - 152px)' : '240px'
        }}
      >
        <div
          ref={mapContainerRef}
          className="classical-atlas-map"
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: '#EDE5D4'
          }}
        />

        {/* Subtle Radial Vignette Overlay (pointer-events: none) so terrain blends into #F5F2EB UI */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at center, transparent 58%, rgba(245, 242, 235, 0.42) 100%)',
            boxShadow: 'inset 0 0 32px rgba(28, 25, 23, 0.14)'
          }}
        />

        {/* Hover Preview Tooltip for Map Pins */}
        {hoverInfo && !sitePicker && (
          <div
            className="pointer-events-none absolute z-30 rounded-[3px] border px-2.5 py-1.5 shadow-md"
            style={{
              left: Math.min(Math.max(12, hoverInfo.x + 12), Math.max(12, containerWidth - 250)),
              top: Math.min(Math.max(12, hoverInfo.y - 44), Math.max(12, containerHeight - 72)),
              maxWidth: '240px',
              backgroundColor: '#FCFBF7',
              borderColor: '#1C1917',
              borderTopWidth: '2px',
              borderTopColor: hoverInfo.items[0]?.seriesColor || '#1C1917'
            }}
          >
            {hoverInfo.items.length === 1 ? (
              <>
                <div className="flex items-center justify-between gap-2 text-[10px] font-sans font-semibold uppercase tracking-[0.12em]">
                  <span style={{ color: hoverInfo.items[0].seriesColor }}>
                    No. {hoverInfo.items[0].cardNumberPadded}
                  </span>
                  <span className="font-serif italic font-normal normal-case tracking-normal text-[#57534E]">
                    {hoverInfo.items[0].dateDisplay}
                  </span>
                </div>
                <div className="font-serif font-semibold text-xs text-[#1C1917] leading-snug truncate">
                  {hoverInfo.items[0].title}
                </div>
                <div className="font-serif italic text-[11px] text-[#57534E] truncate">
                  {hoverInfo.items[0].locationName}
                </div>
              </>
            ) : (
              <>
                <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.12em] text-[#1C1917]">
                  {hoverInfo.items.length} Plates at Site
                </div>
                <div className="font-serif font-semibold text-xs text-[#1C1917] truncate">
                  {hoverInfo.items[0].locationName || hoverInfo.items[0].region}
                </div>
                <div className="text-[10px] font-serif italic text-[#57534E]">
                  Click to choose frame
                </div>
              </>
            )}
          </div>
        )}

        {/* Co-located Site Plates Picker (for overlapping pins like Jerusalem, Rome, Philadelphia) */}
        {sitePicker && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute z-40 w-64 sm:w-72 rounded-[3px] border shadow-xl overflow-hidden"
            style={{
              left: Math.min(Math.max(12, sitePicker.x + 10), Math.max(12, containerWidth - 296)),
              top: Math.min(Math.max(12, sitePicker.y - 20), Math.max(12, containerHeight - 210)),
              backgroundColor: '#FCFBF7',
              borderColor: '#1C1917'
            }}
          >
            <div
              className="px-3 py-1.5 border-b flex items-center justify-between gap-2"
              style={{ backgroundColor: '#F5F2EB', borderColor: '#DCD6C8' }}
            >
              <div className="min-w-0">
                <div className="text-[10px] font-sans font-semibold uppercase tracking-[0.14em] text-[#57534E]">
                  Site Plates ({sitePicker.items.length})
                </div>
                <div className="font-serif font-semibold text-xs text-[#1C1917] truncate">
                  {sitePicker.siteName}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {currentZoom < 5.2 && sitePicker.lngLat && (
                  <button
                    onClick={() => {
                      const map = mapInstanceRef.current;
                      if (!map) return;
                      setCameraMode((prev) => (prev === 'auto' ? 'free' : prev));
                      map.easeTo({
                        center: sitePicker.lngLat,
                        zoom: Math.min(6.4, map.getZoom() + 1.8),
                        duration: 550
                      });
                      setSitePicker(null);
                    }}
                    className="px-1.5 py-0.5 rounded-[2px] border border-[#DCD6C8] bg-[#FCFBF7] text-[10px] font-medium text-[#1C1917] hover:bg-[#1C1917] hover:text-[#FCFBF7] transition"
                    title="Zoom in to inspect individual pins"
                  >
                    Drill In
                  </button>
                )}
                <button
                  onClick={() => setSitePicker(null)}
                  className="w-5 h-5 rounded-[2px] border border-[#DCD6C8] bg-[#FCFBF7] text-[#57534E] hover:text-[#1C1917] flex items-center justify-center"
                  title="Close site list"
                >
                  <IconClose className="w-3 h-3" />
                </button>
              </div>
            </div>
            <div className="max-h-44 overflow-y-auto divide-y divide-[#EAE5DA]">
              {sitePicker.items.map((item) => {
                const isSelected = item.index === activeIndex;
                return (
                  <button
                    key={item.index}
                    onClick={() => {
                      onSelectIndex(item.index);
                      setSitePicker(null);
                    }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 transition ${
                      isSelected ? 'bg-[#EDE8DD]' : 'hover:bg-[#F5F2EB]'
                    }`}
                  >
                    <span
                      className="w-1 self-stretch rounded-[1px] shrink-0"
                      style={{ backgroundColor: item.seriesColor }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 text-[10px]">
                        <span
                          className="font-sans font-semibold uppercase tracking-[0.12em] tabular-nums"
                          style={{ color: item.seriesColor }}
                        >
                          No. {item.cardNumberPadded}
                        </span>
                        <span className="font-serif italic text-[#57534E] truncate">
                          {item.dateDisplay}
                        </span>
                      </div>
                      <div className="font-serif font-semibold text-xs text-[#1C1917] leading-snug truncate">
                        {item.title}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Left-Hand Museum Dossier Card (Kept Intact in Full Atlas Stage Mode) */}
        {mode === 'stage' && activeEvent && (
          <div
            className="absolute top-4 left-4 z-20 w-[290px] sm:w-[325px] rounded-[6px] border overflow-hidden shadow-xl"
            style={{ backgroundColor: '#FCFBF7', borderColor: '#DCD6C8' }}
          >
            <div
              className="h-[3px] w-full"
              style={{ backgroundColor: activeEvent.seriesColor }}
            />
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px]">
                <span
                  className="font-sans font-semibold uppercase tracking-[0.14em] tabular-nums"
                  style={{ color: activeEvent.seriesColor }}
                >
                  NO. {String(activeEvent.cardNumber).padStart(3, '0')} OF {TIMELINE_EVENTS.length}
                </span>
                <span className="font-serif italic text-[#57534E]">
                  {activeEvent.dateDisplay}
                </span>
              </div>

              <div className="relative h-36 w-full border border-[#DCD6C8] bg-[#EAE4D7] overflow-hidden">
                <ResilientCardImage
                  event={activeEvent}
                  customUrl={null}
                  forceContain={true}
                  thumbWidth={500}
                />
              </div>

              <div>
                <h3 className="font-serif font-semibold text-base sm:text-lg text-[#1C1917] leading-snug">
                  {activeEvent.title}
                </h3>
                <p className="text-xs font-serif italic text-[#57534E] mt-0.5 flex items-center gap-1">
                  <IconMapPin className="w-3 h-3 shrink-0" />
                  <span>{activeEvent.location?.name}</span>
                </p>
              </div>

              <p className="text-xs text-[#1C1917] leading-relaxed line-clamp-3">
                {activeEvent.summaryBack}
              </p>

              <div className="pt-2 flex items-center justify-between gap-1.5 border-t border-[#DCD6C8]">
                <button
                  onClick={() => {
                    setCameraMode('auto');
                    onSelectIndex(Math.max(0, activeIndex - 1));
                  }}
                  disabled={activeIndex === 0}
                  className="px-2.5 py-1 rounded-[4px] bg-[#F5F2EB] border border-[#DCD6C8] text-xs font-medium text-[#1C1917] disabled:opacity-40"
                >
                  Prev
                </button>
                {(activeEvent.resourceUrl || activeEvent.wikiUrl) && (
                  <a
                    href={activeEvent.resourceUrl || activeEvent.wikiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ backgroundColor: activeEvent.seriesColor }}
                    className="px-2.5 py-1 rounded-[4px] text-[#FCFBF7] text-xs font-medium inline-flex items-center gap-1 hover:opacity-95 transition"
                  >
                    <span>
                      {activeEvent.resourceType === 'scripture' ? 'Read in ESV' : 'More Info'}
                    </span>
                    <IconExternal className="w-3 h-3" />
                  </a>
                )}
                <button
                  onClick={() => {
                    setCameraMode('auto');
                    onSelectIndex(Math.min(events.length - 1, activeIndex + 1));
                  }}
                  disabled={activeIndex >= events.length - 1}
                  className="px-2.5 py-1 rounded-[4px] bg-[#F5F2EB] border border-[#DCD6C8] text-xs font-medium text-[#1C1917] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ==========================================================================
   PART 4: WIKIMEDIA IMAGE RESILIENCE & PASSEPARTOUT FRAMING
   ========================================================================== */
function ClassicalMuseumPlacard({ event }) {
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-6 text-center relative overflow-hidden select-none"
      style={{
        backgroundColor: '#F5F2EB',
        border: '1px solid #DCD6C8'
      }}
    >
      <div
        className="absolute inset-2.5 pointer-events-none"
        style={{ border: `1px solid ${event.seriesColor}35` }}
      />
      <span
        className="text-[11px] font-sans font-semibold uppercase tracking-[0.14em] mb-2"
        style={{ color: event.seriesColor }}
      >
        {event.seriesRoman ? `${event.seriesRoman}. ` : ''}{event.seriesShortName}
      </span>

      <div
        className="font-serif font-semibold text-2xl opacity-35 mb-1.5"
        style={{ color: event.seriesColor }}
      >
        No. {String(event.cardNumber).padStart(3, '0')}
      </div>

      <h4 className="font-serif font-semibold text-sm sm:text-base text-[#1C1917] max-w-[230px] leading-snug">
        {event.title}
      </h4>

      <p className="font-serif italic text-xs text-[#57534E] mt-1">
        {event.dateDisplay}
      </p>
    </div>
  );
}

/**
 * Rewrites Wikimedia Commons URLs to official CDN step widths (330, 500, 960)
 * so Grid/Dossier thumbnails don't download full 960px plates or trigger CDN 429s.
 */
function getSizedWikimediaUrl(url, thumbWidth = 960) {
  if (!url) return '';
  if (url.includes('commons.wikimedia.org/wiki/Special:FilePath/')) {
    const clean = url.split('?')[0];
    return `${clean}?width=${thumbWidth}`;
  }
  if (url.includes('upload.wikimedia.org') && url.includes('/thumb/') && thumbWidth !== 960) {
    return url.replace(/\/\d+px-/, `/${thumbWidth}px-`);
  }
  return url;
}

/**
 * Extracts a Wikimedia Commons filename from a thumb/original or Special:FilePath URL
 * and builds an official step-sized Special:FilePath redirect URL (330px or 500px).
 */
function getSpecialFilePathRedirect(url, targetWidth = 500) {
  if (!url) return null;
  if (!url.includes('upload.wikimedia.org') && !url.includes('commons.wikimedia.org/wiki/Special:FilePath/')) {
    return null;
  }
  try {
    const clean = url.split('?')[0];
    const parts = clean.split('/');
    let filename = parts[parts.length - 1];
    if (clean.includes('/thumb/') && parts.length >= 2) {
      filename = parts[parts.length - 2];
    }
    if (!filename) return null;
    const safeWidth = targetWidth <= 330 ? 330 : 500;
    return `https://commons.wikimedia.org/wiki/Special:FilePath/${filename}?width=${safeWidth}`;
  } catch {
    return null;
  }
}

function ResilientCardImage({
  event,
  customUrl,
  forceContain = false,
  thumbWidth = 960,
  onResolvedSrc
}) {
  const initialSrc = getSizedWikimediaUrl(customUrl || event.coverImage, thumbWidth);
  const [imgSrc, setImgSrc] = useState(initialSrc);
  const [fallbackStep, setFallbackStep] = useState(0);
  const [needsPassepartoutMat, setNeedsPassepartoutMat] = useState(false);

  useEffect(() => {
    setImgSrc(getSizedWikimediaUrl(customUrl || event.coverImage, thumbWidth));
    setFallbackStep(0);
    setNeedsPassepartoutMat(false);
  }, [event.id, customUrl, event.coverImage, thumbWidth]);

  const handleLoad = (e) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      const ratio = naturalWidth / naturalHeight;
      setNeedsPassepartoutMat(ratio < 1.15 || ratio > 1.65);
    }
    if (onResolvedSrc) {
      onResolvedSrc(event.id, e.currentTarget.currentSrc || imgSrc);
    }
  };

  const handleError = () => {
    const current = imgSrc || '';
    if (fallbackStep === 0 && (current.includes('/960px-') || current.includes('?width=960'))) {
      setFallbackStep(1);
      setImgSrc(
        current.includes('/960px-')
          ? current.replace('/960px-', '/500px-')
          : current.replace('?width=960', '?width=500')
      );
    } else if (fallbackStep <= 1) {
      const stepWidth = thumbWidth <= 330 ? 330 : 500;
      const specialRedirect = getSpecialFilePathRedirect(event.coverImage || current, stepWidth);
      if (specialRedirect && specialRedirect !== current) {
        setFallbackStep(2);
        setImgSrc(specialRedirect);
        return;
      }
      setFallbackStep(3);
    } else {
      setFallbackStep(3);
    }
  };

  if (fallbackStep >= 3 || !imgSrc) {
    return <ClassicalMuseumPlacard event={event} />;
  }

  const usePassepartoutMat = forceContain || needsPassepartoutMat;

  if (usePassepartoutMat) {
    return (
      <div
        className="w-full h-full flex items-center justify-center p-2 select-none"
        style={{
          backgroundColor: '#EAE4D7',
          boxShadow: 'inset 0 1px 4px rgba(28, 25, 23, 0.1)'
        }}
      >
        <img
          src={imgSrc}
          alt={event.title}
          loading="lazy"
          decoding="async"
          draggable={false}
          onLoad={handleLoad}
          onError={handleError}
          className="max-w-full max-h-full w-auto h-auto object-contain select-none border border-[#C8C0B0] shadow-[0_2px_8px_rgba(28,25,23,0.16)] bg-[#FCFBF7]"
        />
      </div>
    );
  }

  return (
    <img
      src={imgSrc}
      alt={event.title}
      loading="lazy"
      decoding="async"
      draggable={false}
      onLoad={handleLoad}
      onError={handleError}
      style={{ objectPosition: '50% 18%' }}
      className="w-full h-full object-cover select-none"
    />
  );
}

/**
 * Classical Museum Frame Face:
 * - Outer Dark Walnut Espresso Molding (#241E1A -> #181310) with top bevel catchlight
 * - Inner Antique Brass Fillet (#B49A67)
 * - Recessed Warm Rag Passepartout Mat (#F4EFE6) with 45-degree bevel shadow
 * Shared by the live frame front and the honed marble floor reflection.
 */
function MuseumFrameFace({
  event,
  customUrl,
  isCenter = false,
  isReflection = false,
  renderArtwork = true,
  thumbWidth = 960,
  isVeiled = false,
  scrimOpacity = 0,
  resolvedUrl = null,
  onResolvedSrc,
  onRevealCard
}) {
  return (
    <div
      className={`w-full h-full flex flex-col relative select-none ${
        isCenter ? 'p-[9px] sm:p-[12px]' : 'p-[7px] sm:p-[9px]'
      }`}
      style={{
        borderRadius: '2px',
        background: 'linear-gradient(148deg, #312822 0%, #221C18 48%, #171310 100%)',
        boxShadow: isReflection
          ? 'inset 0 1px 0 rgba(255, 248, 235, 0.14)'
          : isCenter
          ? '0 26px 56px -14px rgba(24, 19, 16, 0.42), 0 8px 18px -4px rgba(24, 19, 16, 0.22), inset 0 1px 0 rgba(255, 246, 230, 0.22), inset 0 -1px 0 rgba(10, 8, 6, 0.7)'
          : '0 14px 28px -10px rgba(24, 19, 16, 0.34), inset 0 1px 0 rgba(255, 246, 230, 0.16), inset 0 -1px 0 rgba(10, 8, 6, 0.6)'
      }}
    >
      {/* Subtle Antique Brass Inner Fillet */}
      <div
        className="w-full h-full p-[1.5px] flex flex-col"
        style={{
          borderRadius: '1px',
          background: 'linear-gradient(135deg, #C7B080 0%, #967B4B 48%, #B89E6B 100%)',
          boxShadow: 'inset 0 0 2px rgba(24, 19, 16, 0.45)'
        }}
      >
        {/* Recessed Warm Rag Passepartout Mat */}
        <div
          className={`w-full h-full flex flex-col relative ${
            isCenter ? 'p-[9px] sm:p-[13px]' : 'p-[6px] sm:p-[8px]'
          }`}
          style={{
            backgroundColor: '#F4EFE6',
            boxShadow: 'inset 0 1px 3px rgba(28, 25, 23, 0.14)'
          }}
        >
          {/* Beveled Mat Opening */}
          <div
            className="relative flex-1 w-full overflow-hidden bg-[#E9E2D4]"
            style={{
              border: '1px solid #C6BDB0',
              boxShadow:
                'inset 0 2px 6px rgba(28, 25, 23, 0.18), inset 0 -1px 0 rgba(255, 255, 255, 0.72)'
            }}
          >
            {isVeiled ? (
              <div
                className="w-full h-full flex flex-col items-center justify-center p-4 text-center select-none"
                style={{
                  backgroundColor: '#EAE4D7',
                  backgroundImage:
                    'radial-gradient(circle at 50% 45%, rgba(252, 251, 247, 0.45) 0%, rgba(220, 214, 200, 0.35) 100%)'
                }}
              >
                <div className="w-10 h-[1px] bg-[#B49A67] opacity-70 mb-2.5" />
                <span
                  className="text-[11px] font-sans font-semibold uppercase tracking-[0.22em] tabular-nums"
                  style={{ color: '#57534E' }}
                >
                  No. {String(event.cardNumber).padStart(3, '0')}
                </span>
                <span className="mt-1 font-serif italic text-[11px] text-[#78716C]">
                  Plate Hidden
                </span>
                {!isReflection && isCenter && onRevealCard && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevealCard();
                    }}
                    className="mt-3 px-3 py-1 rounded-[2px] border border-[#1C1917] bg-[#FCFBF7] hover:bg-[#1C1917] text-[#1C1917] hover:text-[#FCFBF7] text-[10px] font-sans font-semibold uppercase tracking-[0.14em] flex items-center gap-1.5 shadow-sm transition"
                    title="Reveal current plate"
                  >
                    <IconEye className="w-3 h-3" />
                    <span>Reveal</span>
                  </button>
                )}
                <div className="w-10 h-[1px] bg-[#B49A67] opacity-70 mt-2.5" />
              </div>
            ) : isReflection ? (
              renderArtwork ? (
                <img
                  src={resolvedUrl || getSizedWikimediaUrl(customUrl || event.coverImage, 500)}
                  alt=""
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  style={{ objectPosition: '50% 18%' }}
                  className="w-full h-full object-cover select-none"
                />
              ) : (
                <div className="w-full h-full bg-[#DFD7C8]" />
              )
            ) : renderArtwork ? (
              <ResilientCardImage
                event={event}
                customUrl={customUrl}
                thumbWidth={thumbWidth}
                onResolvedSrc={onResolvedSrc}
              />
            ) : (
              <div className="w-full h-full bg-[#DFD7C8]" />
            )}
          </div>
        </div>
      </div>

      {/* Non-flattening Side-Frame Dimming Scrim (preserves preserve-3d without parent CSS filter) */}
      {!isReflection && scrimOpacity > 0 && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            borderRadius: '2px',
            backgroundColor: '#181310',
            opacity: scrimOpacity
          }}
        />
      )}
    </div>
  );
}

/**
 * Five Consolidated Museum Wing Architectural Themes:
 * Grounded in real museum interiors & period architecture (Met Egyptian / Temple of Dendur,
 * Met Leon Levy & Shelby White Court / Duveen Gallery, Met Cloisters / Uffizi,
 * Queen's House Greenwich / Enlightenment Gallery / Frick, and Kimbell Art Museum / Musee d'Orsay).
 * All walls remain in dignified stone/plaster neutrals—no pastel RGB tints.
 */
const GALLERY_WING_THEMES = {
  'ot-egypt': {
    id: 'ot-egypt',
    roman: 'I',
    wingTitle: 'Gallery I',
    wingSubtitle: 'Old Testament & Ancient Egypt',
    wallBase: '#EBE1D0',
    spotlightColor: 'rgba(255, 249, 236, 0.72)',
    edgeShade: 'rgba(132, 108, 78, 0.16)',
    floorBase: '#E5DAC7',
    floorHorizon: '#D8CCB7',
    floorGrout: 'rgba(150, 128, 100, 0.24)',
    inlayCss: `
      linear-gradient(
        to bottom,
        transparent 0%,
        transparent 16%,
        rgba(164, 96, 62, 0.16) 16%,
        rgba(164, 96, 62, 0.16) 21%,
        transparent 21%,
        transparent 23%,
        rgba(140, 118, 90, 0.22) 23%,
        rgba(140, 118, 90, 0.22) 24.5%,
        transparent 24.5%
      )
    `
  },
  'nt-greece-rome': {
    id: 'nt-greece-rome',
    roman: 'II',
    wingTitle: 'Gallery II',
    wingSubtitle: 'New Testament, Greece & Rome',
    wallBase: '#EFECE5',
    spotlightColor: 'rgba(255, 253, 249, 0.80)',
    edgeShade: 'rgba(116, 110, 98, 0.14)',
    floorBase: '#E9E6E0',
    floorHorizon: '#DDD8CF',
    floorGrout: 'rgba(132, 128, 120, 0.22)',
    inlayCss: `
      repeating-linear-gradient(
        90deg,
        rgba(74, 72, 74, 0.19) 0px,
        rgba(74, 72, 74, 0.19) 34px,
        rgba(128, 82, 76, 0.17) 34px,
        rgba(128, 82, 76, 0.17) 50px,
        rgba(252, 250, 246, 0.36) 50px,
        rgba(252, 250, 246, 0.36) 62px
      ),
      linear-gradient(
        to bottom,
        transparent 0%,
        transparent 15%,
        rgba(74, 72, 74, 0.22) 15%,
        rgba(74, 72, 74, 0.22) 16.5%,
        transparent 16.5%,
        transparent 23%,
        rgba(74, 72, 74, 0.22) 23%,
        rgba(74, 72, 74, 0.22) 24.5%,
        transparent 24.5%
      )
    `,
    inlayMask:
      'linear-gradient(to bottom, transparent 0%, transparent 15.5%, rgba(0,0,0,0.95) 16%, rgba(0,0,0,0.95) 24%, transparent 24.5%)'
  },
  'middle-ages': {
    id: 'middle-ages',
    roman: 'III',
    wingTitle: 'Gallery III',
    wingSubtitle: 'Middle Ages, Renaissance & Reformation',
    wallBase: '#EAE4D9',
    spotlightColor: 'rgba(254, 250, 242, 0.68)',
    edgeShade: 'rgba(84, 72, 58, 0.19)',
    floorBase: '#E3DDD2',
    floorHorizon: '#D5CEC0',
    floorGrout: 'rgba(124, 116, 102, 0.24)',
    inlayCss: `
      radial-gradient(rgba(116, 104, 88, 0.18) 1px, transparent 1px),
      linear-gradient(
        to bottom,
        transparent 0%,
        transparent 16%,
        rgba(96, 86, 74, 0.18) 16%,
        rgba(96, 86, 74, 0.18) 20%,
        transparent 20%
      )
    `,
    inlaySize: '18px 18px, 100% 100%'
  },
  'explorers-1815': {
    id: 'explorers-1815',
    roman: 'IV',
    wingTitle: 'Gallery IV',
    wingSubtitle: 'Explorers to 1815',
    wallBase: '#E8E6DE',
    spotlightColor: 'rgba(255, 253, 248, 0.74)',
    edgeShade: 'rgba(96, 94, 84, 0.15)',
    floorBase: '#E4E2DA',
    floorHorizon: '#D7D4CA',
    floorGrout: 'rgba(118, 116, 108, 0.22)',
    inlayCss: `
      repeating-conic-gradient(
        rgba(70, 72, 74, 0.16) 0% 25%,
        rgba(252, 250, 245, 0.34) 0% 50%
      )
    `,
    inlaySize: '36px 36px',
    inlayMask:
      'linear-gradient(to bottom, transparent 0%, transparent 14%, rgba(0,0,0,0.9) 14.5%, rgba(0,0,0,0.9) 24.5%, transparent 25%)'
  },
  'modern-america': {
    id: 'modern-america',
    roman: 'V',
    wingTitle: 'Gallery V',
    wingSubtitle: '1815 to Present',
    wallBase: '#ECECE8',
    spotlightColor: 'rgba(255, 255, 253, 0.80)',
    edgeShade: 'rgba(112, 114, 110, 0.12)',
    floorBase: '#E5E6E2',
    floorHorizon: '#D9DBD6',
    floorGrout: 'rgba(128, 130, 126, 0.20)',
    inlayCss: `
      linear-gradient(
        to bottom,
        transparent 0%,
        transparent 18%,
        rgba(92, 94, 92, 0.18) 18%,
        rgba(92, 94, 92, 0.18) 18.8%,
        transparent 18.8%
      )
    `
  }
};

/**
 * Drafted Architectural Wall Elevations for Each Historical Wing
 * Renders beveled moldings, stone masonry, fluted pilasters, cloister arches,
 * Georgian boiserie wall bays, or Kimbell travertine bays behind the artwork.
 */
function GalleryArchitectureBackdrop({ wingId, hasFloor }) {
  const wallBottom = hasFloor ? '28%' : '0%';

  if (wingId === 'ot-egypt') {
    return (
      <div
        className="gallery-wing-fade pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
        style={{ bottom: wallBottom }}
      >
        {/* Stepped Cavetto Cornice & Torus Cord Molding at Ceiling Edge */}
        <div
          className="absolute inset-x-0 top-0 h-6"
          style={{
            background:
              'linear-gradient(to bottom, rgba(140, 116, 86, 0.18) 0%, rgba(168, 142, 108, 0.08) 58%, rgba(255, 251, 242, 0.45) 82%, rgba(128, 104, 74, 0.18) 100%)',
            borderBottom: '1px solid rgba(144, 120, 88, 0.22)'
          }}
        />
        <div
          className="absolute inset-x-0 top-6 h-[5px]"
          style={{
            background:
              'linear-gradient(to bottom, rgba(255, 251, 242, 0.5) 0%, rgba(138, 114, 82, 0.18) 100%)'
          }}
        />

        {/* Staggered Dry-Jointed Ashlar Limestone Courses (subtle bevel highlight + chisel shadow) */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.42]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="ashlar-courses" width="280" height="140" patternUnits="userSpaceOnUse">
              <path
                d="M0 70 H280 M0 140 H280 M140 0 V70 M0 70 V140 M280 70 V140"
                stroke="rgba(138, 114, 84, 0.34)"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M0 71 H280 M0 1 H280 M141 0 V70 M1 70 V140"
                stroke="rgba(255, 252, 244, 0.55)"
                strokeWidth="1"
                fill="none"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#ashlar-courses)" />
        </svg>

        {/* Battered Sandstone Temple Portal Jambs on Outer Gallery Edges */}
        <svg
          className="hidden lg:block absolute left-0 top-6 bottom-0 w-24 h-[calc(100%-24px)]"
          viewBox="0 0 96 400"
          preserveAspectRatio="none"
        >
          <polygon
            points="0,0 54,0 78,400 0,400"
            fill="rgba(196, 174, 142, 0.24)"
          />
          <line x1="54" y1="0" x2="78" y2="400" stroke="rgba(128, 104, 74, 0.26)" strokeWidth="1.2" />
          <line x1="55.5" y1="0" x2="79.5" y2="400" stroke="rgba(255, 251, 244, 0.45)" strokeWidth="1" />
        </svg>
        <svg
          className="hidden lg:block absolute right-0 top-6 bottom-0 w-24 h-[calc(100%-24px)]"
          viewBox="0 0 96 400"
          preserveAspectRatio="none"
        >
          <polygon
            points="96,0 42,0 18,400 96,400"
            fill="rgba(196, 174, 142, 0.24)"
          />
          <line x1="42" y1="0" x2="18" y2="400" stroke="rgba(128, 104, 74, 0.26)" strokeWidth="1.2" />
          <line x1="40.5" y1="0" x2="16.5" y2="400" stroke="rgba(255, 251, 244, 0.45)" strokeWidth="1" />
        </svg>

        {/* Lower Carved Orthostat Stone Plinth */}
        {hasFloor && (
          <div
            className="absolute inset-x-0 bottom-0 h-[21%]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(212, 194, 166, 0.34) 0%, rgba(196, 176, 146, 0.26) 100%)',
              borderTop: '1px solid rgba(255, 251, 244, 0.65)',
              boxShadow: 'inset 0 2px 4px rgba(128, 104, 74, 0.12)'
            }}
          />
        )}
      </div>
    );
  }

  if (wingId === 'nt-greece-rome') {
    return (
      <div
        className="gallery-wing-fade pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
        style={{ bottom: wallBottom }}
      >
        {/* Classical Dentil & Architrave Cornice */}
        <div
          className="absolute inset-x-0 top-0 h-5"
          style={{
            background:
              'linear-gradient(to bottom, rgba(130, 124, 114, 0.14) 0%, rgba(255, 253, 249, 0.55) 75%, rgba(130, 124, 114, 0.18) 100%)',
            borderBottom: '1px solid rgba(130, 124, 114, 0.22)'
          }}
        />
        <div
          className="absolute inset-x-0 top-5 h-[7px]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, rgba(120, 114, 104, 0.16) 0px, rgba(120, 114, 104, 0.16) 10px, transparent 10px, transparent 18px)',
            borderBottom: '1px solid rgba(130, 124, 114, 0.15)'
          }}
        />

        {/* Drafted Fluted Classical Pilasters Flanking Left & Right Edges */}
        {['left-4 xl:left-10', 'right-4 xl:right-10'].map((pos, i) => (
          <svg
            key={pos}
            className={`hidden lg:block absolute top-6 bottom-0 ${pos} w-14 h-[calc(100%-24px)] opacity-75`}
            viewBox="0 0 64 420"
            preserveAspectRatio="none"
          >
            {/* Capital & Necking */}
            <rect x="4" y="0" width="56" height="8" fill="rgba(222, 217, 208, 0.72)" stroke="rgba(130, 124, 114, 0.28)" strokeWidth="0.8" />
            <path d="M7 8 H57 L52 22 H12 Z" fill="rgba(216, 211, 202, 0.65)" stroke="rgba(130, 124, 114, 0.26)" strokeWidth="0.8" />
            <rect x="11" y="22" width="42" height="4" fill="rgba(255, 253, 249, 0.7)" stroke="rgba(130, 124, 114, 0.24)" strokeWidth="0.7" />
            {/* Pilaster Shaft with Shaded Flutes */}
            <rect x="12" y="26" width="40" height="368" fill="rgba(232, 228, 220, 0.52)" stroke="rgba(130, 124, 114, 0.24)" strokeWidth="0.9" />
            {[17, 23, 29, 35, 41, 47].map((fx) => (
              <g key={fx}>
                <line x1={fx} y1="30" x2={fx} y2="390" stroke="rgba(128, 122, 112, 0.22)" strokeWidth="1.2" />
                <line x1={fx + 1.2} y1="30" x2={fx + 1.2} y2="390" stroke="rgba(255, 253, 249, 0.65)" strokeWidth="1" />
              </g>
            ))}
            {/* Attic Plinth Base */}
            <rect x="8" y="394" width="48" height="8" fill="rgba(226, 221, 212, 0.72)" stroke="rgba(130, 124, 114, 0.28)" strokeWidth="0.8" />
            <rect x="4" y="402" width="56" height="18" fill="rgba(214, 208, 198, 0.72)" stroke="rgba(130, 124, 114, 0.30)" strokeWidth="0.9" />
          </svg>
        ))}

        {/* Carved Classical Stone Dado Rail */}
        {hasFloor && (
          <div
            className="absolute inset-x-0 bottom-[21%] h-[6px]"
            style={{
              background:
                'linear-gradient(to bottom, rgba(255, 253, 249, 0.7) 0%, rgba(188, 182, 172, 0.32) 60%, rgba(128, 122, 112, 0.24) 100%)'
            }}
          />
        )}
      </div>
    );
  }

  if (wingId === 'middle-ages') {
    return (
      <div
        className="gallery-wing-fade pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
        style={{ bottom: wallBottom }}
      >
        {/* Cloister Vaulted Stone Arch Springers & Corbels Framing Upper Corners */}
        <svg
          className="hidden md:block absolute left-0 top-0 w-56 h-56 opacity-75"
          viewBox="0 0 220 220"
          fill="none"
        >
          <path
            d="M0 164 C 24 84, 92 22, 206 0 L 220 0 L 0 0 Z"
            fill="rgba(206, 198, 184, 0.22)"
          />
          <path
            d="M0 164 C 24 84, 92 22, 206 0"
            stroke="rgba(116, 104, 88, 0.28)"
            strokeWidth="2.2"
          />
          <path
            d="M0 156 C 22 79, 87 19, 196 0"
            stroke="rgba(255, 251, 244, 0.55)"
            strokeWidth="1.4"
          />
          {/* Carved Stone Corbel */}
          <path d="M0 162 H18 L12 180 H0 Z" fill="rgba(196, 188, 174, 0.55)" stroke="rgba(116, 104, 88, 0.28)" strokeWidth="1" />
        </svg>
        <svg
          className="hidden md:block absolute right-0 top-0 w-56 h-56 opacity-75"
          viewBox="0 0 220 220"
          fill="none"
        >
          <path
            d="M220 164 C 196 84, 128 22, 14 0 L 0 0 L 220 0 Z"
            fill="rgba(206, 198, 184, 0.22)"
          />
          <path
            d="M220 164 C 196 84, 128 22, 14 0"
            stroke="rgba(116, 104, 88, 0.28)"
            strokeWidth="2.2"
          />
          <path
            d="M220 156 C 198 79, 133 19, 24 0"
            stroke="rgba(255, 251, 244, 0.55)"
            strokeWidth="1.4"
          />
          <path d="M220 162 H202 L208 180 H220 Z" fill="rgba(196, 188, 174, 0.55)" stroke="rgba(116, 104, 88, 0.28)" strokeWidth="1" />
        </svg>

        {/* Architectural Recessed Wainscot Paneling Along Lower Wall */}
        {hasFloor && (
          <div
            className="absolute inset-x-0 bottom-0 h-[25%] flex flex-col"
            style={{
              backgroundColor: 'rgba(214, 205, 190, 0.42)',
              borderTop: '2px solid rgba(132, 120, 104, 0.26)',
              boxShadow: 'inset 0 2px 0 rgba(255, 251, 244, 0.58)'
            }}
          >
            <div className="flex-1 max-w-[1440px] w-full mx-auto px-6 sm:px-10 py-3 grid grid-cols-3 sm:grid-cols-5 gap-4">
              {[0, 1, 2, 3, 4].map((panel) => (
                <div
                  key={panel}
                  className={`h-full rounded-[1px] ${panel >= 3 ? 'hidden sm:block' : ''}`}
                  style={{
                    border: '1px solid rgba(126, 114, 98, 0.24)',
                    boxShadow:
                      'inset 1px 1px 0 rgba(126, 114, 98, 0.16), inset -1px -1px 0 rgba(255, 251, 244, 0.52), 0 1px 0 rgba(255, 251, 244, 0.45)'
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (wingId === 'explorers-1815') {
    return (
      <div
        className="gallery-wing-fade pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
        style={{ bottom: wallBottom }}
      >
        {/* Georgian Crown Cornice */}
        <div
          className="absolute inset-x-0 top-0 h-4"
          style={{
            background:
              'linear-gradient(to bottom, rgba(122, 120, 110, 0.16) 0%, rgba(255, 253, 248, 0.6) 72%, rgba(122, 120, 110, 0.18) 100%)',
            borderBottom: '1px solid rgba(122, 120, 110, 0.22)'
          }}
        />

        {/* Georgian Boiserie Raised Wall Bays (Left, Center Framing Painting, Right) */}
        <div className="absolute inset-x-0 top-[108px] bottom-[23%] max-w-[1380px] mx-auto px-4 sm:px-10 grid grid-cols-1 md:grid-cols-[1fr_1.6fr_1fr] gap-5 sm:gap-8">
          {[0, 1, 2].map((bay) => (
            <div
              key={bay}
              className={`h-full p-1.5 ${bay !== 1 ? 'hidden md:block' : ''}`}
              style={{
                border: '1px solid rgba(124, 122, 112, 0.22)',
                boxShadow:
                  'inset 0 1px 0 rgba(255, 253, 248, 0.65), 0 1px 0 rgba(255, 253, 248, 0.5)'
              }}
            >
              <div
                className="w-full h-full"
                style={{
                  border: '1px solid rgba(124, 122, 112, 0.14)',
                  boxShadow: 'inset 0 0 12px rgba(118, 116, 106, 0.05)'
                }}
              />
            </div>
          ))}
        </div>

        {/* Classic Georgian Chair Rail & Lower Dado */}
        {hasFloor && (
          <div
            className="absolute inset-x-0 bottom-0 h-[19%]"
            style={{
              backgroundColor: 'rgba(220, 217, 207, 0.34)',
              borderTop: '2px solid rgba(126, 124, 114, 0.25)',
              boxShadow: 'inset 0 2px 0 rgba(255, 253, 248, 0.68)'
            }}
          />
        )}
      </div>
    );
  }

  // Gallery V: 1815 to Present — Kimbell Travertine Vault & Modern Shadow-Gap Pavilion
  return (
    <div
      className="gallery-wing-fade pointer-events-none absolute inset-x-0 top-0 overflow-hidden"
      style={{ bottom: wallBottom }}
    >
      {/* Louis Kahn Kimbell-Inspired "Silvery Gleam" Vaulted Daylight Wash */}
      <div
        className="absolute inset-x-0 top-0 h-[36%]"
        style={{
          background:
            'linear-gradient(to bottom, rgba(255, 255, 255, 0.64) 0%, rgba(246, 247, 244, 0.28) 52%, transparent 100%)'
        }}
      />

      {/* Monumental Travertine / Architectural Concrete Bays with Crisp Shadow-Gap Reveals */}
      <div className="absolute inset-0 max-w-[1440px] mx-auto grid grid-cols-3">
        <div
          className="h-full"
          style={{
            borderRight: '1px solid rgba(116, 118, 114, 0.18)',
            boxShadow: '1px 0 0 rgba(255, 255, 255, 0.55)'
          }}
        />
        <div />
        <div
          className="h-full"
          style={{
            borderLeft: '1px solid rgba(116, 118, 114, 0.18)',
            boxShadow: '-1px 0 0 rgba(255, 255, 255, 0.55)'
          }}
        />
      </div>

      {/* Minimalist Architectural Shadow-Gap Baseboard Reveal */}
      {hasFloor && (
        <div
          className="absolute inset-x-0 bottom-0 h-[3px]"
          style={{
            backgroundColor: 'rgba(92, 94, 90, 0.18)',
            borderTop: '1px solid rgba(255, 255, 255, 0.65)'
          }}
        />
      )}
    </div>
  );
}

let _titleMeasureCtx = null;
function getTitleMeasureContext() {
  if (_titleMeasureCtx) return _titleMeasureCtx;
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  _titleMeasureCtx = canvas.getContext('2d');
  return _titleMeasureCtx;
}

/**
 * Keeps the museum placard title strictly on one line with zero vertical jolt
 * by sizing it via offscreen Canvas measureText (zero DOM layout-thrash reflow).
 */
function AutoFitSingleLineTitle({ text, maxPx, minPx = 11, className = '', depsKey }) {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [fontsTick, setFontsTick] = useState(0);

  useEffect(() => {
    if (typeof document === 'undefined' || !document.fonts || !document.fonts.ready) {
      return undefined;
    }
    let active = true;
    document.fonts.ready.then(() => {
      if (active) setFontsTick((t) => t + 1);
    });
    return () => {
      active = false;
    };
  }, []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const el = textRef.current;
    if (!container || !el) return;

    const availableWidth = container.clientWidth;
    if (!availableWidth) return;

    const ctx = getTitleMeasureContext();
    if (!ctx) {
      el.style.fontSize = `${maxPx}px`;
      return;
    }

    const computed = window.getComputedStyle(el);
    const fontWeight = computed.fontWeight || '600';
    const fontFamily = computed.fontFamily || '"Playfair Display", Georgia, serif';
    // Account subtly for -0.02em tracking safely (canvas doesn't apply CSS letter-spacing)
    const targetWidth = availableWidth - 2;

    const fits = (px) => {
      ctx.font = `${fontWeight} ${px}px ${fontFamily}`;
      return ctx.measureText(text).width <= targetWidth;
    };

    if (fits(maxPx)) {
      el.style.fontSize = `${maxPx}px`;
      return;
    }

    let low = minPx;
    let high = maxPx;
    let best = minPx;

    while (high - low > 0.5) {
      const mid = (low + high) / 2;
      if (fits(mid)) {
        best = mid;
        low = mid;
      } else {
        high = mid;
      }
    }

    el.style.fontSize = `${Math.floor(best * 2) / 2}px`;
  }, [text, maxPx, minPx, depsKey, fontsTick]);

  return (
    <div
      ref={containerRef}
      className={`w-full overflow-hidden flex items-center justify-center ${className}`}
    >
      <h2
        ref={textRef}
        className="max-w-full font-serif font-semibold text-[#1C1917] tracking-[-0.02em] leading-[1.15] whitespace-nowrap truncate"
        style={{ fontSize: `${maxPx}px` }}
      >
        {text}
      </h2>
    </div>
  );
}

/* ==========================================================================
   MAIN APPLICATION COMPONENT
   ========================================================================== */
export default function App() {
  // Filtering
  const [selectedSeries, setSelectedSeries] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('coverflow'); // 'coverflow' | 'atlas' | 'grid'

  // Toggleable Companion Cartographic Atlas Drawer (in 3D Cover Flow mode)
  const [isAtlasDrawerOpen, setIsAtlasDrawerOpen] = useState(false);

  // Active Plate & Flip State
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Recitation Tools & Zero-Login LocalStorage Persistence
  const [reciteOptions, setReciteOptions] = useState(() => loadInitialReciteOptions());
  const [isReciteMenuOpen, setIsReciteMenuOpen] = useState(false);
  const [isCurrentCardRevealed, setIsCurrentCardRevealed] = useState(false);
  const [learnedCards, setLearnedCards] = useState(() => loadInitialLearnedSet());
  const [isProgressMenuOpen, setIsProgressMenuOpen] = useState(false);

  // Auto-Play Slideshow with Simple Cadence Control
  const [isPlaying, setIsPlaying] = useState(false);
  const [playIntervalSec, setPlayIntervalSec] = useState(() => loadInitialPlaySpeed());
  const [isPlaySpeedMenuOpen, setIsPlaySpeedMenuOpen] = useState(false);

  // Minimalist Chrome Controls (Expandable Quick-Jump & Filter Search)
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [isSearchFilterActive, setIsSearchFilterActive] = useState(false);
  const [highlightedSearchIdx, setHighlightedSearchIdx] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1280
  );
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const progressMenuRef = useRef(null);
  const playSpeedMenuRef = useRef(null);
  const reciteMenuRef = useRef(null);
  const lastActiveReciteOptionsRef = useRef(null);
  const resolvedUrlsRef = useRef({});
  const activeEventIdRef = useRef(loadInitialActiveEventId());
  const pendingJumpEventIdRef = useRef(null);
  const prevFilterKeyRef = useRef('');

  // Drag / Velocity & Wheel refs
  const dragStartX = useRef(null);
  const dragStartTime = useRef(0);
  const dragDeltaX = useRef(0);
  const wheelLockRef = useRef(0);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.select();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handlePointerOutside = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setIsSearchDropdownOpen(false);
        if (!searchQuery.trim()) {
          setIsSearchOpen(false);
        }
      }
      if (progressMenuRef.current && !progressMenuRef.current.contains(e.target)) {
        setIsProgressMenuOpen(false);
      }
      if (playSpeedMenuRef.current && !playSpeedMenuRef.current.contains(e.target)) {
        setIsPlaySpeedMenuOpen(false);
      }
      if (reciteMenuRef.current && !reciteMenuRef.current.contains(e.target)) {
        setIsReciteMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerOutside);
    return () => document.removeEventListener('mousedown', handlePointerOutside);
  }, [searchQuery]);

  const eventSearchIndex = useMemo(() => buildEventSearchIndex(TIMELINE_EVENTS), []);

  const searchOutput = useMemo(
    () => searchTimelineEvents(TIMELINE_EVENTS, searchQuery, selectedSeries, eventSearchIndex),
    [searchQuery, selectedSeries, eventSearchIndex]
  );

  const globalSearchFallback = useMemo(() => {
    if (
      selectedSeries === 'all' ||
      !searchOutput.isQueryActive ||
      searchOutput.results.length > 0
    ) {
      return [];
    }
    return searchTimelineEvents(TIMELINE_EVENTS, searchQuery, 'all', eventSearchIndex).results;
  }, [
    selectedSeries,
    searchOutput.isQueryActive,
    searchOutput.results.length,
    searchQuery,
    eventSearchIndex
  ]);

  // Filtered & Ordered Timeline Events (Filter mode uses relevance ranking; Browse mode keeps card order)
  const filteredEvents = useMemo(() => {
    if (isSearchFilterActive && searchOutput.isQueryActive) {
      return searchOutput.results.map((r) => r.event);
    }

    const list =
      selectedSeries === 'all'
        ? [...TIMELINE_EVENTS]
        : TIMELINE_EVENTS.filter((e) => e.seriesId === selectedSeries);

    list.sort((a, b) => a.cardNumber - b.cardNumber);
    return list;
  }, [selectedSeries, isSearchFilterActive, searchOutput]);

  const filterKey =
    isSearchFilterActive && searchOutput.isQueryActive ? searchQuery.trim() : '';

  useEffect(() => {
    const prevFilterKey = prevFilterKeyRef.current;
    prevFilterKeyRef.current = filterKey;

    if (pendingJumpEventIdRef.current) {
      const jumpIdx = filteredEvents.findIndex((e) => e.id === pendingJumpEventIdRef.current);
      pendingJumpEventIdRef.current = null;
      if (jumpIdx !== -1) {
        setActiveIndex(jumpIdx);
        setIsFlipped(false);
        return;
      }
    }

    if (filterKey && filterKey !== prevFilterKey) {
      setActiveIndex(0);
      setIsFlipped(false);
      return;
    }

    const currentId = activeEventIdRef.current;
    if (currentId) {
      const preservedIdx = filteredEvents.findIndex((e) => e.id === currentId);
      if (preservedIdx !== -1) {
        setActiveIndex(preservedIdx);
        setIsFlipped(false);
        return;
      }
    }

    setActiveIndex(0);
    setIsFlipped(false);
  }, [filteredEvents, filterKey]);

  // Automatically reset isFlipped = false whenever activeIndex changes
  useEffect(() => {
    setIsFlipped(false);
  }, [activeIndex]);

  const goToIndex = useCallback(
    (newIndex) => {
      if (filteredEvents.length === 0) return;
      const clamped = Math.max(0, Math.min(filteredEvents.length - 1, newIndex));
      setActiveIndex(clamped);
      setIsFlipped(false);
    },
    [filteredEvents.length]
  );

  const stepCard = useCallback(
    (delta) => {
      if (filteredEvents.length === 0) return;
      setActiveIndex((prev) => Math.max(0, Math.min(filteredEvents.length - 1, prev + delta)));
      setIsFlipped(false);
    },
    [filteredEvents.length]
  );

  useEffect(() => {
    if (!isPlaying || filteredEvents.length <= 1) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1 >= filteredEvents.length ? 0 : prev + 1));
      setIsFlipped(false);
    }, playIntervalSec * 1000);
    return () => clearInterval(timer);
  }, [isPlaying, playIntervalSec, filteredEvents.length]);

  const safeActiveIndex =
    filteredEvents.length === 0 ? 0 : Math.min(activeIndex, filteredEvents.length - 1);
  const activeEvent = filteredEvents[safeActiveIndex] || null;

  useEffect(() => {
    activeEventIdRef.current = activeEvent ? activeEvent.id : null;
    if (activeEvent) {
      safeStorageSet(STORAGE_KEYS.activeCard, activeEvent.id);
    }
  }, [activeEvent]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.learned, JSON.stringify(Array.from(learnedCards)));
  }, [learnedCards]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.playSpeed, String(playIntervalSec));
  }, [playIntervalSec]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.reciteMode, JSON.stringify(reciteOptions));
  }, [reciteOptions]);

  useEffect(() => {
    setIsCurrentCardRevealed(false);
  }, [activeEvent?.id, reciteOptions]);

  const isReciteActive =
    reciteOptions.all || reciteOptions.upcoming || reciteOptions.title || reciteOptions.photo;

  useEffect(() => {
    if (isReciteActive) {
      lastActiveReciteOptionsRef.current = reciteOptions;
    }
  }, [isReciteActive, reciteOptions]);

  const toggleReciteOption = useCallback((key) => {
    setReciteOptions((prev) => {
      if (key === 'all') {
        return prev.all
          ? { ...DEFAULT_RECITE_OPTIONS }
          : { upcoming: true, title: true, photo: true, all: true };
      }
      if (prev.all) {
        return {
          ...prev,
          all: false,
          [key]: false
        };
      }
      return {
        ...prev,
        all: false,
        [key]: !prev[key]
      };
    });
  }, []);

  const clearReciteOptions = useCallback(() => {
    setReciteOptions({ ...DEFAULT_RECITE_OPTIONS });
    setIsReciteMenuOpen(false);
  }, []);

  const toggleReciteShortcut = useCallback(() => {
    setIsReciteMenuOpen(false);
    setReciteOptions((prev) => {
      const active = prev.all || prev.upcoming || prev.title || prev.photo;
      if (active) {
        lastActiveReciteOptionsRef.current = prev;
        return { ...DEFAULT_RECITE_OPTIONS };
      }
      return (
        lastActiveReciteOptionsRef.current || {
          upcoming: true,
          title: false,
          photo: false,
          all: false
        }
      );
    });
  }, []);

  const toggleLearnedCard = useCallback((eventId) => {
    if (!eventId) return;
    setLearnedCards((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }, []);

  const markLearnedUpTo = useCallback((cardNumber) => {
    if (!cardNumber || cardNumber < 1) return;
    setLearnedCards((prev) => {
      const next = new Set(prev);
      for (const ev of TIMELINE_EVENTS) {
        if (ev.cardNumber <= cardNumber) {
          next.add(ev.id);
        }
      }
      return next;
    });
    setIsProgressMenuOpen(false);
  }, []);

  const clearLearnedProgress = useCallback(() => {
    setLearnedCards(new Set());
    setIsProgressMenuOpen(false);
  }, []);

  const handleResolvedSrc = useCallback((eventId, url) => {
    if (eventId && url) {
      resolvedUrlsRef.current[eventId] = url;
    }
  }, []);

  const handleSelectSearchResult = useCallback(
    (ev, expandToAllSeries = false) => {
      if (!ev) return;
      setIsPlaying(false);
      setIsSearchDropdownOpen(false);
      if (searchInputRef.current) searchInputRef.current.blur();

      if (expandToAllSeries) {
        pendingJumpEventIdRef.current = ev.id;
        setIsSearchFilterActive(false);
        setSelectedSeries('all');
        return;
      }

      const idx = filteredEvents.findIndex((item) => item.id === ev.id);
      if (idx !== -1) {
        goToIndex(idx);
      } else {
        pendingJumpEventIdRef.current = ev.id;
        setIsSearchFilterActive(false);
      }
    },
    [filteredEvents, goToIndex]
  );

  const handleApplySearchFilter = useCallback(
    (expandToAllSeries = false) => {
      setIsPlaying(false);
      setIsSearchDropdownOpen(false);
      if (searchInputRef.current) searchInputRef.current.blur();
      if (expandToAllSeries) {
        setSelectedSeries('all');
      }
      setIsSearchFilterActive(true);
    },
    []
  );

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchFilterActive(false);
    setIsSearchDropdownOpen(false);
    setIsSearchOpen(false);
    setHighlightedSearchIdx(0);
  }, []);

  const veilUpcomingPhotos = Boolean(reciteOptions.all || reciteOptions.upcoming);
  const veilCurrentTitle = !isCurrentCardRevealed && Boolean(reciteOptions.all || reciteOptions.title);
  const veilCurrentYear = !isCurrentCardRevealed && Boolean(reciteOptions.all);
  const veilCurrentPhoto = !isCurrentCardRevealed && Boolean(reciteOptions.all || reciteOptions.photo);

  const activeReciteLabels = reciteOptions.all
    ? ['All']
    : [
        reciteOptions.upcoming ? 'Hide Upcoming Photos' : null,
        reciteOptions.title ? 'Hide Title' : null,
        reciteOptions.photo ? 'Hide Photo' : null
      ].filter(Boolean);
  const reciteButtonTitle = isReciteActive
    ? `Recite Mode (${activeReciteLabels.join(', ')}) — click for options, R to toggle`
    : 'Recite Mode: Choose what to hide (click for options, R to toggle)';

  const activeWing =
    (activeEvent && GALLERY_WING_THEMES[activeEvent.seriesId]) ||
    GALLERY_WING_THEMES['ot-egypt'];

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      const target = e.target;
      const isFormInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');
      if (isFormInput) {
        if (e.key === 'Escape') {
          target.blur();
          setIsSearchDropdownOpen(false);
          if (!searchQuery.trim()) setIsSearchOpen(false);
        }
        return;
      }

      const isInteractiveElement = target && Boolean(target.closest('button, a, [role="button"]'));

      if (e.key === '/') {
        e.preventDefault();
        setIsSearchOpen(true);
        if (searchQuery.trim()) setIsSearchDropdownOpen(true);
        requestAnimationFrame(() => {
          if (searchInputRef.current) {
            searchInputRef.current.focus();
            searchInputRef.current.select();
          }
        });
      } else if (e.key === 'ArrowRight' && viewMode !== 'grid') {
        e.preventDefault();
        stepCard(e.shiftKey ? 5 : 1);
      } else if (e.key === 'ArrowLeft' && viewMode !== 'grid') {
        e.preventDefault();
        stepCard(e.shiftKey ? -5 : -1);
      } else if ((e.key === ' ' || e.key === 'Enter') && viewMode === 'coverflow' && !isInteractiveElement) {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if ((e.key === 'm' || e.key === 'M') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        setIsAtlasDrawerOpen((a) => !a);
      } else if ((e.key === 'r' || e.key === 'R') && !e.metaKey && !e.ctrlKey && !e.altKey && viewMode === 'coverflow') {
        e.preventDefault();
        toggleReciteShortcut();
      } else if (e.key === 'Escape') {
        if (isReciteMenuOpen) setIsReciteMenuOpen(false);
        else if (isPlaySpeedMenuOpen) setIsPlaySpeedMenuOpen(false);
        else if (isProgressMenuOpen) setIsProgressMenuOpen(false);
        else if (isSearchDropdownOpen) setIsSearchDropdownOpen(false);
        else if (isSearchOpen && !searchQuery.trim()) setIsSearchOpen(false);
        else if (isFlipped) setIsFlipped(false);
        else if (isAtlasDrawerOpen) setIsAtlasDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    stepCard,
    toggleReciteShortcut,
    viewMode,
    isFlipped,
    isAtlasDrawerOpen,
    isReciteMenuOpen,
    isPlaySpeedMenuOpen,
    isProgressMenuOpen,
    isSearchOpen,
    isSearchDropdownOpen,
    searchQuery
  ]);

  // Trackpad / Wheel Horizontal & Vertical Scrubbing on Stage (respect scrollable verso)
  const handleStageWheel = (e) => {
    const versoScroll = e.target && e.target.closest('.card-face-back-scroll');
    if (versoScroll && versoScroll.scrollHeight > versoScroll.clientHeight) {
      return;
    }
    const now = Date.now();
    if (now - wheelLockRef.current < 85) return;
    const dominant = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(dominant) < 12) return;
    wheelLockRef.current = now;
    stepCard(dominant > 0 ? 1 : -1);
  };

  const handlePointerDown = (e) => {
    if (e.target.closest('button, a') || (isFlipped && e.target.closest('.card-face-back-scroll'))) {
      return;
    }
    dragStartX.current = e.clientX;
    dragStartTime.current = Date.now();
    dragDeltaX.current = 0;
  };

  const handlePointerMove = (e) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = e.clientX - dragStartX.current;
  };

  const handlePointerUp = () => {
    if (dragStartX.current === null) return;
    const delta = dragDeltaX.current;
    const elapsed = Math.max(1, Date.now() - dragStartTime.current);
    const velocity = Math.abs(delta) / elapsed;
    dragStartX.current = null;
    dragDeltaX.current = 0;

    if (Math.abs(delta) > 38) {
      const momentumSteps = velocity > 0.85 ? Math.min(5, Math.round(velocity * 2.5)) : 1;
      const distanceSteps = Math.min(4, Math.max(1, Math.round(Math.abs(delta) / 120)));
      const steps = Math.max(momentumSteps, distanceSteps);
      stepCard(delta < 0 ? steps : -steps);
    }
  };

  // PART 2: Track Virtualization (Windowing: only mount cards where Math.abs(offset) <= 7)
  const visibleCards = useMemo(() => {
    const radius = 7;
    const items = [];
    const start = Math.max(0, safeActiveIndex - radius);
    const end = Math.min(filteredEvents.length - 1, safeActiveIndex + radius);
    for (let i = start; i <= end; i++) {
      items.push({ event: filteredEvents[i], index: i, offset: i - safeActiveIndex });
    }
    return items;
  }, [filteredEvents, safeActiveIndex]);

  /**
   * PART 2: Piecewise 3D Cover Flow Math & Opaque Framed Canvases (No Wing Text Bleed)
   * Returns transform style (without CSS filter so preserve-3d isn't flattened) + side-card scrimOpacity.
   */
  const getPiecewiseCoverFlowStyle = (offset) => {
    const absOffset = Math.abs(offset);
    if (offset === 0) {
      return {
        style: {
          transform: 'translate3d(0px, 0px, 0px) rotateY(0deg) scale(1)',
          zIndex: 100,
          opacity: 1,
          filter: 'none'
        },
        scrimOpacity: 0
      };
    }

    const isWide = viewportWidth >= 1024;
    const isTablet = viewportWidth >= 640;
    const baseGap = isAtlasDrawerOpen
      ? isTablet
        ? 165
        : 120
      : isWide
      ? 235
      : isTablet
      ? 185
      : 128;
    const stepGap = isWide ? 72 : isTablet ? 60 : 44;
    const scrimOpacity = Math.min(0.42, 0.12 + (absOffset - 1) * 0.06);

    if (offset < 0) {
      const x = offset * stepGap - baseGap;
      return {
        style: {
          transform: `translate3d(${x}px, 0px, -195px) rotateY(54deg) scale(0.84)`,
          zIndex: 100 - absOffset,
          opacity: 1
        },
        scrimOpacity
      };
    }

    const x = offset * stepGap + baseGap;
    return {
      style: {
        transform: `translate3d(${x}px, 0px, -195px) rotateY(-54deg) scale(0.84)`,
        zIndex: 100 - absOffset,
        opacity: 1
      },
      scrimOpacity
    };
  };

  return (
    <div
      className="min-h-screen flex flex-col select-none overflow-x-hidden font-sans"
      style={{ backgroundColor: '#F3EFE6', color: '#1C1917' }}
    >
      {/* Top 2px Era Pigment Hairline */}
      <div
        className="h-[2px] w-full transition-colors duration-500 shrink-0"
        style={{ backgroundColor: activeEvent ? activeEvent.seriesColor : '#B85D3B' }}
      />

      {/* ==================== MINIMALIST SINGLE-ROW GALLERY HEADER ==================== */}
      <header
        className="relative z-40 border-b shrink-0"
        style={{ backgroundColor: '#F5F2EB', borderColor: '#DCD6C8' }}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 h-11 flex items-center justify-between gap-3">
          {/* Left: Compact Gallery Wordmark + 5-Wing Roman Numeral Navigation */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => {
                setSelectedSeries('all');
                setViewMode('coverflow');
              }}
              className="font-serif text-base sm:text-[17px] font-semibold tracking-[-0.02em] text-[#1C1917] whitespace-nowrap shrink-0 hover:opacity-80 transition"
              title="Historia — 160 Exhibition Works"
            >
              Historia
            </button>

            <span className="h-4 w-[1px] bg-[#DCD6C8] shrink-0" />

            {/* Architectural Gallery Wing Tabs (Zero pills, zero status dots) */}
            <nav
              aria-label="Historical Wings"
              className="flex items-stretch h-11 overflow-x-auto no-scrollbar"
            >
              <button
                onClick={() => setSelectedSeries('all')}
                className={`relative px-2.5 text-xs whitespace-nowrap transition flex items-center gap-1 ${
                  selectedSeries === 'all'
                    ? 'font-semibold text-[#1C1917]'
                    : 'font-normal text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <span>All</span>
                <span className="hidden xl:inline text-[10px] text-[#78716C] tabular-nums">
                  001–160
                </span>
                {selectedSeries === 'all' && (
                  <span
                    className="absolute bottom-0 left-1 right-1 h-[2px]"
                    style={{ backgroundColor: '#1C1917' }}
                  />
                )}
              </button>

              {SERIES_INFO.map((s) => {
                const isActive = selectedSeries === s.id;
                const roman = s.roman || ['I', 'II', 'III', 'IV', 'V'][s.number - 1];
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSeries(s.id)}
                    className={`relative px-2.5 text-xs whitespace-nowrap transition flex items-center gap-1 ${
                      isActive
                        ? 'font-semibold text-[#1C1917]'
                        : 'font-normal text-[#57534E] hover:text-[#1C1917]'
                    }`}
                    title={`${roman}. ${s.name} (${s.range})`}
                  >
                    <span className="font-serif font-semibold" style={{ color: s.color }}>
                      {roman}.
                    </span>
                    <span className="hidden md:inline">{s.shortName}</span>
                    {isActive && (
                      <span
                        className="absolute bottom-0 left-1 right-1 h-[2px]"
                        style={{ backgroundColor: s.color }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right: Quiet Gallery Tools (Quick-Jump & Filter Search + View Switcher) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Expandable Quick-Jump / Filter Search */}
            <div ref={searchContainerRef} className="relative flex items-center gap-1">
              {isSearchOpen || searchQuery ? (
                <div className="relative flex items-center">
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onFocus={() => {
                      if (searchQuery.trim()) setIsSearchDropdownOpen(true);
                    }}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      setHighlightedSearchIdx(0);
                      if (val.trim()) {
                        setIsSearchDropdownOpen(true);
                      } else {
                        setIsSearchDropdownOpen(false);
                        setIsSearchFilterActive(false);
                      }
                    }}
                    onKeyDown={(e) => {
                      const dropdownItems = searchOutput.results.slice(0, 8);
                      const fallbackItems =
                        dropdownItems.length === 0 ? globalSearchFallback.slice(0, 8) : [];
                      const activeItems = dropdownItems.length > 0 ? dropdownItems : fallbackItems;
                      const isFallback = dropdownItems.length === 0 && fallbackItems.length > 0;

                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        if (!isSearchDropdownOpen && searchQuery.trim()) {
                          setIsSearchDropdownOpen(true);
                        }
                        if (activeItems.length > 0) {
                          setHighlightedSearchIdx((prev) => (prev + 1) % activeItems.length);
                        }
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        if (activeItems.length > 0) {
                          setHighlightedSearchIdx((prev) =>
                            (prev - 1 + activeItems.length) % activeItems.length
                          );
                        }
                      } else if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) {
                          if (dropdownItems.length > 0) {
                            handleApplySearchFilter(false);
                          } else if (isFallback) {
                            handleApplySearchFilter(true);
                          }
                        } else if (activeItems.length > 0) {
                          const picked = activeItems[highlightedSearchIdx] || activeItems[0];
                          handleSelectSearchResult(picked.event, isFallback);
                        }
                      }
                    }}
                    placeholder="Jump or filter (#, title, year)..."
                    aria-label="Search catalog plates"
                    aria-expanded={isSearchDropdownOpen && searchOutput.isQueryActive}
                    className={`w-44 sm:w-64 bg-[#FCFBF7] border rounded-[3px] pl-7 pr-6 py-1 text-xs text-[#1C1917] placeholder-[#78716C] focus:outline-none transition ${
                      isSearchFilterActive && searchOutput.isQueryActive
                        ? 'border-[#1C1917]'
                        : 'border-[#C8C0B0] focus:border-[#1C1917]'
                    }`}
                  />
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[#78716C] pointer-events-none">
                    <IconSearch className="w-3 h-3" />
                  </span>
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#78716C] hover:text-[#1C1917]"
                    title="Clear & close search"
                    aria-label="Clear search"
                  >
                    <IconClose className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-7 h-7 rounded-[3px] bg-transparent hover:bg-[#EAE4D7] text-[#57534E] hover:text-[#1C1917] flex items-center justify-center transition"
                  title="Search catalog (Shortcut: /)"
                  aria-label="Open search"
                >
                  <IconSearch className="w-3.5 h-3.5" />
                </button>
              )}

              {isSearchFilterActive && searchOutput.isQueryActive && (
                <button
                  onClick={() => setIsSearchFilterActive(false)}
                  className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-[3px] bg-[#1C1917] text-[#FCFBF7] text-[11px] font-medium hover:opacity-90 transition whitespace-nowrap tabular-nums"
                  title="Exit gallery filter and return to full timeline at current plate"
                >
                  <span>Filtered ({searchOutput.results.length})</span>
                  <IconClose className="w-2.5 h-2.5" />
                </button>
              )}

              {/* Quick-Jump Ranked Results Dropdown */}
              {isSearchDropdownOpen && searchOutput.isQueryActive && (
                <div
                  role="listbox"
                  aria-label="Matching catalog plates"
                  className="absolute right-0 top-full mt-1.5 w-[310px] sm:w-[390px] bg-[#FCFBF7] border border-[#C8C0B0] rounded-[4px] shadow-[0_14px_32px_-8px_rgba(28,25,23,0.22)] z-50 overflow-hidden flex flex-col"
                >
                  {/* Dropdown Header */}
                  <div className="px-3 py-1.5 bg-[#F5F2EB] border-b border-[#DCD6C8] flex items-center justify-between text-[11px] text-[#57534E]">
                    <span className="tabular-nums font-medium">
                      {searchOutput.results.length > 0
                        ? `${searchOutput.results.length} matching ${
                            searchOutput.results.length === 1 ? 'plate' : 'plates'
                          }`
                        : 'No plates in current wing'}
                    </span>
                    <span className="hidden sm:inline text-[10px] text-[#78716C]">
                      Enter Jump · Shift+Enter Filter
                    </span>
                  </div>

                  {/* Results List */}
                  {searchOutput.results.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-[#EDE8DD]">
                      {searchOutput.results.slice(0, 8).map((item, idx) => {
                        const { event: ev, matchLabel } = item;
                        const isHighlighted = idx === highlightedSearchIdx;
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            role="option"
                            aria-selected={isHighlighted}
                            onMouseEnter={() => setHighlightedSearchIdx(idx)}
                            onClick={() => handleSelectSearchResult(ev, false)}
                            className={`w-full text-left px-3 py-2 flex items-start justify-between gap-2.5 transition border-l-2 ${
                              isHighlighted
                                ? 'bg-[#F3EFE6] border-l-[#1C1917]'
                                : 'bg-[#FCFBF7] hover:bg-[#F5F2EB] border-l-transparent'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2 min-w-0">
                                <span
                                  className="font-sans text-[11px] font-semibold tabular-nums shrink-0"
                                  style={{ color: ev.seriesColor }}
                                >
                                  {ev.cardNumberPadded}
                                </span>
                                <span className="font-serif font-semibold text-[13px] text-[#1C1917] truncate">
                                  {ev.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#57534E] truncate">
                                <span className="font-serif italic shrink-0">
                                  {ev.dateDisplay}
                                </span>
                                {ev.location && ev.location.name && (
                                  <>
                                    <span className="text-[#C8C0B0]">·</span>
                                    <span className="truncate text-[#78716C]">
                                      {ev.location.name.split(' (')[0]}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                            {matchLabel && (
                              <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded-[2px] border border-[#DCD6C8] bg-[#F5F2EB] text-[10px] font-medium uppercase tracking-[0.06em] text-[#78716C]">
                                {matchLabel}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : globalSearchFallback.length > 0 ? (
                    <div className="max-h-[300px] overflow-y-auto divide-y divide-[#EDE8DD]">
                      <div className="px-3 py-1.5 bg-[#FAF7F0] text-[11px] text-[#57534E] flex items-center justify-between">
                        <span>
                          Found {globalSearchFallback.length}{' '}
                          {globalSearchFallback.length === 1 ? 'plate' : 'plates'} across all wings
                        </span>
                      </div>
                      {globalSearchFallback.slice(0, 8).map((item, idx) => {
                        const { event: ev, matchLabel } = item;
                        const isHighlighted = idx === highlightedSearchIdx;
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            role="option"
                            aria-selected={isHighlighted}
                            onMouseEnter={() => setHighlightedSearchIdx(idx)}
                            onClick={() => handleSelectSearchResult(ev, true)}
                            className={`w-full text-left px-3 py-2 flex items-start justify-between gap-2.5 transition border-l-2 ${
                              isHighlighted
                                ? 'bg-[#F3EFE6] border-l-[#1C1917]'
                                : 'bg-[#FCFBF7] hover:bg-[#F5F2EB] border-l-transparent'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2 min-w-0">
                                <span
                                  className="font-sans text-[11px] font-semibold tabular-nums shrink-0"
                                  style={{ color: ev.seriesColor }}
                                >
                                  {ev.cardNumberPadded}
                                </span>
                                <span className="font-serif font-semibold text-[13px] text-[#1C1917] truncate">
                                  {ev.title}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#57534E] truncate">
                                <span className="font-serif italic shrink-0">
                                  {ev.dateDisplay}
                                </span>
                                <span className="text-[#C8C0B0]">·</span>
                                <span className="truncate text-[#78716C]">{ev.seriesShortName}</span>
                              </div>
                            </div>
                            {matchLabel && (
                              <span className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded-[2px] border border-[#DCD6C8] bg-[#F5F2EB] text-[10px] font-medium uppercase tracking-[0.06em] text-[#78716C]">
                                {matchLabel}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-3 py-4 text-center text-xs text-[#78716C]">
                      No catalog plates match &ldquo;{searchQuery.trim()}&rdquo;.
                    </div>
                  )}

                  {/* Dropdown Footer Action */}
                  {(searchOutput.results.length > 0 || globalSearchFallback.length > 0) && (
                    <div className="px-3 py-2 bg-[#F5F2EB] border-t border-[#DCD6C8] flex items-center justify-between gap-2">
                      {isSearchFilterActive ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsSearchFilterActive(false);
                            setIsSearchDropdownOpen(false);
                          }}
                          className="w-full py-1 px-2.5 rounded-[3px] border border-[#C8C0B0] bg-[#FCFBF7] hover:bg-[#EAE4D7] text-[11px] font-medium text-[#1C1917] transition"
                        >
                          {viewMode === 'atlas'
                            ? 'Show All Map Pins (Keep Current Plate)'
                            : 'Show Full Timeline (Keep Current Plate)'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            handleApplySearchFilter(searchOutput.results.length === 0)
                          }
                          className="w-full py-1 px-2.5 rounded-[3px] bg-[#1C1917] text-[#FCFBF7] hover:opacity-90 text-[11px] font-medium transition tabular-nums"
                        >
                          {searchOutput.results.length > 0
                            ? viewMode === 'atlas'
                              ? `Filter map to ${searchOutput.results.length} ${
                                  searchOutput.results.length === 1 ? 'pin' : 'pins'
                                }`
                              : `Filter gallery to ${searchOutput.results.length} ${
                                  searchOutput.results.length === 1 ? 'plate' : 'plates'
                                }`
                            : viewMode === 'atlas'
                            ? `Filter all wings to ${globalSearchFallback.length} ${
                                globalSearchFallback.length === 1 ? 'pin' : 'pins'
                              }`
                            : `Filter all wings to ${globalSearchFallback.length} ${
                                globalSearchFallback.length === 1 ? 'plate' : 'plates'
                              }`}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Compact View Switcher (Gallery | Atlas | Index) */}
            <div className="flex items-center bg-[#EAE4D7] border border-[#DCD6C8] rounded-[3px] p-0.5 text-[11px]">
              <button
                onClick={() => setViewMode('coverflow')}
                className={`px-2 py-0.5 rounded-[2px] font-medium transition ${
                  viewMode === 'coverflow'
                    ? 'bg-[#FCFBF7] text-[#1C1917] shadow-sm'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Gallery
              </button>
              <button
                onClick={() => setViewMode('atlas')}
                className={`px-2 py-0.5 rounded-[2px] font-medium transition flex items-center gap-1 ${
                  viewMode === 'atlas'
                    ? 'bg-[#FCFBF7] text-[#1C1917] shadow-sm'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <IconCompass className="w-3 h-3" />
                <span className="hidden sm:inline">Atlas</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-2 py-0.5 rounded-[2px] font-medium transition tabular-nums ${
                  viewMode === 'grid'
                    ? 'bg-[#FCFBF7] text-[#1C1917] shadow-sm'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Index
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ==================== MAIN EXHIBITION WORKSPACE ==================== */}
      {filteredEvents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <p className="font-serif text-lg text-[#1C1917] mb-3">
            No catalog plates match your current filter.
          </p>
          <button
            onClick={() => {
              handleClearSearch();
              setSelectedSeries('all');
            }}
            className="px-4 py-2 rounded-[4px] bg-[#1C1917] text-[#FCFBF7] text-xs font-medium hover:opacity-90 transition"
          >
            Restore Full Collection
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ==================== ARCHIVAL CATALOGUE INDEX GRID ==================== */
        <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-8 py-6 overflow-y-auto">
          <div className="mb-5 pb-3 border-b border-[#DCD6C8] flex flex-wrap items-center justify-between gap-3 text-xs text-[#57534E]">
            <div className="flex flex-wrap items-center gap-3">
              {isSearchFilterActive && searchOutput.isQueryActive ? (
                <span className="tabular-nums">
                  Showing <strong className="text-[#1C1917]">{filteredEvents.length}</strong>{' '}
                  matching {filteredEvents.length === 1 ? 'plate' : 'plates'} for{' '}
                  <span className="font-serif italic text-[#1C1917]">
                    &ldquo;{searchQuery.trim()}&rdquo;
                  </span>
                </span>
              ) : (
                <span className="tabular-nums">
                  Learned <strong className="text-[#1C1917]">{learnedCards.size}</strong> of{' '}
                  {TIMELINE_EVENTS.length} plates
                </span>
              )}
              {isSearchFilterActive && searchOutput.isQueryActive && (
                <button
                  type="button"
                  onClick={() => setIsSearchFilterActive(false)}
                  className="px-2.5 py-1 rounded-[3px] border border-[#C8C0B0] bg-[#FCFBF7] hover:bg-[#EAE4D7] text-[#1C1917] font-medium transition"
                >
                  Show Full Collection
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {activeEvent && activeEvent.cardNumber > 1 && (
                <button
                  type="button"
                  onClick={() => markLearnedUpTo(activeEvent.cardNumber)}
                  className="px-2.5 py-1 rounded-[3px] border border-[#C8C0B0] bg-[#FCFBF7] hover:bg-[#EAE4D7] text-[#1C1917] font-medium transition tabular-nums"
                  title={`Mark plates #001 through ${activeEvent.cardNumberPadded} as learned`}
                >
                  Mark #001&ndash;{activeEvent.cardNumberPadded} Learned
                </button>
              )}
              {learnedCards.size > 0 && (
                <button
                  type="button"
                  onClick={clearLearnedProgress}
                  className="px-2 py-1 rounded-[3px] border border-[#DCD6C8] bg-[#F5F2EB] hover:bg-[#EAE4D7] text-[#57534E] hover:text-[#1C1917] transition"
                >
                  Clear Learned
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {filteredEvents.map((ev, idx) => {
              const isLearned = learnedCards.has(ev.id);
              const isSelected = idx === safeActiveIndex;
              return (
                <div
                  key={ev.id}
                  className={`group relative rounded-[2px] bg-[#FAF7F0] border transition flex flex-col justify-between ${
                    isSelected
                      ? 'border-[#1C1917] ring-1 ring-[#1C1917] shadow-md'
                      : 'border-[#DCD6C8] hover:border-[#78716C] shadow-sm'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleLearnedCard(ev.id)}
                    aria-label={isLearned ? `Unmark ${ev.title} as learned` : `Mark ${ev.title} as learned`}
                    aria-pressed={isLearned}
                    title={isLearned ? 'Learned (click to unmark)' : 'Mark plate learned'}
                    className={`absolute top-2 right-2 z-10 w-5 h-5 rounded-[2px] border flex items-center justify-center transition ${
                      isLearned
                        ? 'bg-[#1C1917] text-[#FCFBF7] border-[#1C1917]'
                        : 'bg-[#FCFBF7] text-[#C8C0B0] border-[#DCD6C8] hover:border-[#78716C] hover:text-[#57534E]'
                    }`}
                  >
                    <IconCheck className="w-3 h-3" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      goToIndex(idx);
                      setViewMode('coverflow');
                    }}
                    className="w-full h-full p-2.5 text-left flex flex-col justify-between focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1C1917] rounded-[2px]"
                  >
                    {/* Wall Label Above Miniature Frame */}
                    <div className="mb-2 pr-6">
                      <div className="flex items-center justify-between gap-1 text-[10px] mb-0.5">
                        <span
                          className="font-sans font-semibold tracking-[0.12em] tabular-nums"
                          style={{ color: ev.seriesColor }}
                        >
                          {ev.cardNumberPadded}
                        </span>
                      </div>
                      <h3 className="font-serif font-semibold text-xs sm:text-[13.5px] text-[#1C1917] tracking-[-0.01em] line-clamp-2 leading-snug">
                        {ev.title}
                      </h3>
                      <p className="font-serif italic text-[11px] text-[#57534E] truncate mt-0.5">
                        {ev.dateDisplay}
                      </p>
                    </div>

                    {/* Miniature Dark Walnut & Brass Frame */}
                    <div
                      className="p-[4px] rounded-[2px]"
                      style={{
                        background: 'linear-gradient(148deg, #312822 0%, #221C18 52%, #171310 100%)',
                        boxShadow: '0 4px 10px -3px rgba(24, 19, 16, 0.25)'
                      }}
                    >
                      <div
                        className="p-[1px]"
                        style={{
                          background:
                            'linear-gradient(135deg, #C7B080 0%, #967B4B 48%, #B89E6B 100%)'
                        }}
                      >
                        <div className="p-[4px] bg-[#F4EFE6]">
                          <div className="relative aspect-[4/3] w-full bg-[#E9E2D4] overflow-hidden border border-[#C6BDB0]">
                            <ResilientCardImage
                              event={ev}
                              customUrl={null}
                              thumbWidth={330}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </main>
      ) : viewMode === 'atlas' ? (
        /* ==================== PART 3: FULL CARTOGRAPHIC ATLAS STAGE MODE ==================== */
        <main className="relative flex-1 flex flex-col justify-between overflow-hidden">
          <HistoricalAtlasPlate
            mode="stage"
            activeEvent={activeEvent}
            events={filteredEvents}
            activeIndex={safeActiveIndex}
            onSelectIndex={goToIndex}
            onCloseDrawer={() => setViewMode('coverflow')}
            onExpandToStage={() => setViewMode('atlas')}
            onReturnToGallery={() => setViewMode('coverflow')}
            isFiltered={isSearchFilterActive && searchOutput.isQueryActive}
          />
        </main>
      ) : (
        /* ==================== PART 2: MUSEUM GALLERY HALL STAGE ==================== */
        <main
          className="relative flex-1 flex flex-col justify-between overflow-hidden transition-colors duration-700"
          style={{ backgroundColor: activeWing.wallBase }}
        >
          <style>{`
            .museum-marble-floor {
              background-color: var(--floor-base, #E7E0D2);
              background-image:
                radial-gradient(ellipse 52% 68% at 50% 58%, rgba(255, 253, 248, 0.48) 0%, rgba(255, 253, 248, 0.14) 48%, transparent 76%),
                linear-gradient(to bottom, var(--floor-horizon, #DDD5C5) 0%, var(--floor-base, #EAE3D5) 42%, var(--floor-base, #E4DDD0) 100%),
                repeating-linear-gradient(90deg, var(--floor-grout, rgba(168, 158, 140, 0.22)) 0px, var(--floor-grout, rgba(168, 158, 140, 0.22)) 1px, transparent 1px, transparent 140px),
                repeating-linear-gradient(0deg, var(--floor-grout, rgba(168, 158, 140, 0.18)) 0px, var(--floor-grout, rgba(168, 158, 140, 0.18)) 1px, transparent 1px, transparent 96px);
              transition: background-color 850ms ease;
            }
            @keyframes galleryWingFadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
            }
            .gallery-wing-fade {
              animation: galleryWingFadeIn 700ms ease-out;
            }
            @media (prefers-reduced-motion: reduce) {
              .carousel-item-positioner,
              .card-flip-inner,
              .museum-marble-floor,
              .gallery-wing-fade {
                transition-duration: 0.01ms !important;
                animation-duration: 0.01ms !important;
              }
            }
          `}</style>

          {/* 3D Perspective Museum Hall Stage */}
          <div
            onWheel={handleStageWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative flex-1 flex flex-col items-center justify-between w-full overflow-hidden cursor-grab active:cursor-grabbing"
          >
            {/* LAYER 0: Heritage Museum Wall Paint, Period Architectural Relief, Track Light & Marble Floor */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-hidden"
              style={{ zIndex: 0 }}
            >
              {/* Choice 1: Heritage Gallery Wall Base + Overhead Track Spotlight & Wing Corridor Vignette */}
              <div
                className="absolute inset-0 transition-colors duration-700"
                style={{
                  backgroundColor: activeWing.wallBase,
                  backgroundImage: `
                    radial-gradient(ellipse 56% 62% at 50% 34%, ${activeWing.spotlightColor} 0%, rgba(255, 253, 248, 0.18) 54%, transparent 82%),
                    radial-gradient(ellipse 100% 90% at 50% 45%, transparent 48%, ${activeWing.edgeShade} 100%)
                  `
                }}
              />

              {/* Choice 2: Period Museum Gallery Architecture (cornices, stone joints, pilasters, wainscot) */}
              <GalleryArchitectureBackdrop
                key={`arch-${activeWing.id}`}
                wingId={activeWing.id}
                hasFloor={!isAtlasDrawerOpen}
              />

              {/* Perspective Honed Limestone / Marble Floor & Baseboard Horizon (Full Stage) */}
              {!isAtlasDrawerOpen && (
                <>
                  {/* Subtle Wall-to-Floor Baseboard / Dado Horizon */}
                  <div
                    className="absolute inset-x-0 transition-colors duration-700"
                    style={{
                      bottom: '28%',
                      height: '14px',
                      background:
                        'linear-gradient(to bottom, transparent 0%, rgba(160, 152, 138, 0.24) 68%, rgba(128, 120, 108, 0.36) 86%, rgba(255, 252, 245, 0.5) 100%)',
                      borderBottom: '1px solid rgba(154, 146, 132, 0.42)'
                    }}
                  />

                  {/* Perspective-Tilted Honed Marble Slab Plane */}
                  <div
                    className="absolute inset-x-0 bottom-0 overflow-hidden"
                    style={{
                      height: '28%',
                      perspective: '780px'
                    }}
                  >
                    <div
                      className="museum-marble-floor absolute left-[-45%] right-[-45%] bottom-0 h-[250%]"
                      style={{
                        '--floor-base': activeWing.floorBase,
                        '--floor-horizon': activeWing.floorHorizon,
                        '--floor-grout': activeWing.floorGrout,
                        transform: 'rotateX(74deg)',
                        transformOrigin: 'bottom center'
                      }}
                    >
                      {activeWing.inlayCss && (
                        <div
                          key={`inlay-${activeWing.id}`}
                          className="gallery-wing-fade absolute inset-0"
                          style={{
                            backgroundImage: activeWing.inlayCss,
                            backgroundSize: activeWing.inlaySize || '100% 100%',
                            backgroundRepeat: activeWing.inlaySize ? 'repeat' : 'no-repeat',
                            WebkitMaskImage: activeWing.inlayMask || 'none',
                            maskImage: activeWing.inlayMask || 'none'
                          }}
                        />
                      )}
                    </div>
                    {/* Soft Front Vignette into Bottom Rail */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-8 transition-colors duration-700"
                      style={{
                        background: `linear-gradient(to bottom, transparent 0%, ${activeWing.floorBase}A8 100%)`
                      }}
                    />
                  </div>
                </>
              )}
            </div>

            {/* TOP WALL TITLE PLAQUE (Centered archival museum wall label, fixed single-line height) */}
            {activeEvent && (
              <div
                className={`relative z-20 w-full flex justify-center px-4 shrink-0 ${
                  isAtlasDrawerOpen ? 'pt-2 pb-1' : 'pt-3 sm:pt-4 pb-1.5'
                }`}
              >
                <div
                  className={`w-full max-w-2xl rounded-[2px] border text-center transition-colors duration-500 ${
                    isAtlasDrawerOpen ? 'px-4 py-1.5' : 'px-5 sm:px-7 py-2 sm:py-2.5'
                  }`}
                  style={{
                    backgroundColor: '#FCFBF7',
                    borderColor: '#CFC7B8',
                    borderTopWidth: '2px',
                    borderTopColor: activeEvent.seriesColor,
                    boxShadow: '0 3px 12px -2px rgba(28, 25, 23, 0.08)'
                  }}
                >
                  <div className="flex items-center justify-center gap-2 text-xs sm:text-[13px] font-serif italic tracking-normal whitespace-nowrap overflow-hidden">
                    <span className="font-semibold tabular-nums shrink-0" style={{ color: activeEvent.seriesColor }}>
                      No. {String(activeEvent.cardNumber).padStart(3, '0')}
                    </span>
                    <span className="font-sans not-italic text-[10px] sm:text-[11px] text-[#C8C0B0] shrink-0">|</span>
                    <span className="text-[#57534E] truncate">
                      {activeEvent.seriesShortName}
                    </span>
                    <span className="font-sans not-italic text-[10px] sm:text-[11px] text-[#C8C0B0] shrink-0">|</span>
                    {veilCurrentYear ? (
                      <span className="text-[#A8A092] truncate">Date Hidden</span>
                    ) : (
                      <span className="text-[#57534E] truncate">
                        {activeEvent.dateDisplay}
                      </span>
                    )}
                  </div>

                  {veilCurrentTitle ? (
                    <div
                      className={`w-full flex items-center justify-center gap-2.5 ${
                        isAtlasDrawerOpen
                          ? 'mt-1 h-[24px] sm:h-[28px]'
                          : 'mt-1 h-[26px] sm:h-[32px] md:h-[35px]'
                      }`}
                    >
                      <span className="font-serif italic text-sm sm:text-base text-[#78716C] tracking-normal">
                        Title Hidden
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsCurrentCardRevealed(true)}
                        className="px-2 py-0.5 rounded-[3px] border border-[#DCD6C8] bg-[#F5F2EB] text-[#1C1917] text-[10px] font-sans font-semibold uppercase tracking-[0.14em] hover:border-[#1C1917] hover:bg-[#FCFBF7] transition flex items-center gap-1 shrink-0"
                        title="Reveal hidden card details"
                      >
                        <IconEye className="w-3 h-3" />
                        <span>Reveal</span>
                      </button>
                    </div>
                  ) : (
                    <AutoFitSingleLineTitle
                      text={activeEvent.title}
                      maxPx={
                        isAtlasDrawerOpen
                          ? viewportWidth < 640
                            ? 19
                            : 23
                          : viewportWidth < 640
                          ? 21
                          : viewportWidth < 768
                          ? 26
                          : 29
                      }
                      minPx={11}
                      depsKey={`${viewportWidth}-${isAtlasDrawerOpen}`}
                      className={
                        isAtlasDrawerOpen
                          ? 'mt-1 h-[24px] sm:h-[28px]'
                          : 'mt-1 h-[26px] sm:h-[32px] md:h-[35px]'
                      }
                    />
                  )}
                </div>
              </div>
            )}

            {/* 3D Perspective Frame Track */}
            <div
              className={`relative z-10 w-full flex-1 flex items-center justify-center transition-all duration-300 ${
                isAtlasDrawerOpen ? 'py-1' : 'pb-14 sm:pb-16 pt-1'
              }`}
              style={{ perspective: '1250px', transformStyle: 'preserve-3d' }}
            >
              <div
                className={`relative w-full flex items-center justify-center ${
                  isAtlasDrawerOpen
                    ? 'h-[260px] sm:h-[300px]'
                    : 'h-[335px] sm:h-[415px] md:h-[460px] lg:h-[min(57vh,530px)]'
                }`}
                style={{ transformStyle: 'preserve-3d' }}
              >
                {visibleCards.map(({ event: ev, index: idx, offset }) => {
                  const isCenter = offset === 0;
                  const absOffset = Math.abs(offset);
                  const isVeiled = (isCenter && veilCurrentPhoto) || (offset > 0 && veilUpcomingPhotos);
                  const isLearned = learnedCards.has(ev.id);
                  const { style: positionerStyle, scrimOpacity } = getPiecewiseCoverFlowStyle(offset);

                  return (
                    /* LAYER 1: Outer Carousel Positioner (div.carousel-item-positioner)
                       100% Opaque (opacity: 1) so wing frames never bleed through foreground frames. */
                    <div
                      key={ev.id}
                      role="button"
                      tabIndex={isCenter ? 0 : -1}
                      aria-label={
                        isVeiled
                          ? isCenter
                            ? `Recite mode hidden plate ${ev.cardNumberPadded}`
                            : `Recite mode hidden upcoming plate ${ev.cardNumberPadded}`
                          : `${ev.cardNumberPadded} ${ev.title}${isCenter ? (isFlipped ? ' (show front)' : ' (turn for summary)') : ' (focus plate)'}`
                      }
                      onClick={() => {
                        if (!isCenter) {
                          goToIndex(idx);
                        } else {
                          const selectedText = typeof window !== 'undefined' && window.getSelection ? window.getSelection().toString() : '';
                          if (selectedText.length > 0) return;
                          setIsFlipped((f) => !f);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.target.closest('button, a')) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          if (!isCenter) goToIndex(idx);
                          else setIsFlipped((f) => !f);
                        }
                      }}
                      style={{
                        ...positionerStyle,
                        transformStyle: 'preserve-3d',
                        transition: 'transform 480ms cubic-bezier(0.22, 1, 0.36, 1)'
                      }}
                      className={`carousel-item-positioner group absolute cursor-pointer select-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1C1917] ${
                        isAtlasDrawerOpen
                          ? 'w-[280px] sm:w-[370px] md:w-[410px] h-[250px] sm:h-[290px]'
                          : 'w-[300px] sm:w-[430px] md:w-[500px] lg:w-[min(46vw,590px)] h-[320px] sm:h-[400px] md:h-[445px] lg:h-[min(55vh,515px)]'
                      }`}
                    >
                      {/* LAYER 2: Inner Flip Container (div.card-flip-inner)
                          Handles ONLY the 180-degree flip (rotateY(0deg) vs rotateY(180deg)) */}
                      <div
                        className="card-flip-inner relative w-full h-full"
                        style={{
                          transformStyle: 'preserve-3d',
                          transition: 'transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                          transform: isCenter && isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
                        }}
                      >
                        {/* LAYER 3A: Front Museum Frame Face (Dark Walnut + Antique Brass Fillet + Rag Mat) */}
                        <div
                          className="card-face-front absolute inset-0"
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(0deg)'
                          }}
                        >
                          <MuseumFrameFace
                            event={ev}
                            customUrl={null}
                            isCenter={isCenter}
                            thumbWidth={960}
                            isVeiled={isVeiled}
                            scrimOpacity={scrimOpacity}
                            onResolvedSrc={handleResolvedSrc}
                            onRevealCard={isCenter && veilCurrentPhoto ? () => setIsCurrentCardRevealed(true) : undefined}
                          />

                          {/* Quiet Hover Affordance on Center Frame Only */}
                          {isCenter && (
                            <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute bottom-4 right-4 px-2 py-1 rounded-[2px] bg-[#1C1917]/85 text-[#FCFBF7] text-[10px] font-sans tracking-wide flex items-center gap-1">
                              <IconFlip className="w-3 h-3" />
                              <span>Turn Plate</span>
                            </div>
                          )}
                        </div>

                        {/* LAYER 3B: Back Card Face (Archival Canvas Verso inside matching Walnut Frame) */}
                        <div
                          className="card-face-back absolute inset-0 p-[9px] sm:p-[12px] text-left"
                          style={{
                            backfaceVisibility: 'hidden',
                            WebkitBackfaceVisibility: 'hidden',
                            transform: 'rotateY(180deg)',
                            borderRadius: '2px',
                            background:
                              'linear-gradient(148deg, #312822 0%, #221C18 48%, #171310 100%)',
                            boxShadow:
                              '0 26px 56px -14px rgba(24, 19, 16, 0.42), 0 8px 18px -4px rgba(24, 19, 16, 0.22), inset 0 1px 0 rgba(255, 246, 230, 0.22)'
                          }}
                        >
                          <div
                            className="w-full h-full p-[1.5px] flex flex-col"
                            style={{
                              borderRadius: '1px',
                              background:
                                'linear-gradient(135deg, #C7B080 0%, #967B4B 48%, #B89E6B 100%)'
                            }}
                          >
                            <div
                              className="card-face-back-scroll w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-text cursor-auto"
                              style={{ backgroundColor: '#FAF7F0' }}
                            >
                              <div>
                                {/* Verso Top Catalog Header */}
                                <div
                                  className="flex items-center justify-between pb-2.5 mb-3 border-b gap-2"
                                  style={{ borderColor: '#DCD6C8' }}
                                >
                                  <div className="flex items-baseline gap-2 min-w-0">
                                    <span
                                      className="text-[11px] font-sans font-semibold uppercase tracking-[0.14em] tabular-nums shrink-0"
                                      style={{ color: ev.seriesColor }}
                                    >
                                      NO. {String(ev.cardNumber).padStart(3, '0')} OF {TIMELINE_EVENTS.length}
                                    </span>
                                    <span className="text-[#DCD6C8] shrink-0">|</span>
                                    <span className="font-serif italic text-xs sm:text-sm text-[#57534E] truncate">
                                      {ev.dateDisplay}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleLearnedCard(ev.id);
                                      }}
                                      aria-pressed={isLearned}
                                      className={`px-2 py-0.5 rounded-[3px] text-[11px] font-medium border flex items-center gap-1 transition ${
                                        isLearned
                                          ? 'bg-[#1C1917] text-[#FCFBF7] border-[#1C1917]'
                                          : 'bg-[#FCFBF7] text-[#57534E] border-[#DCD6C8] hover:text-[#1C1917]'
                                      }`}
                                      title={isLearned ? 'Marked learned (click to unmark)' : 'Mark plate learned'}
                                    >
                                      <IconCheck className="w-3 h-3" />
                                      <span>{isLearned ? 'Learned' : 'Mark Learned'}</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsFlipped(false);
                                      }}
                                      className="px-2 py-0.5 rounded-[3px] text-[11px] font-medium border bg-[#F5F2EB] text-[#57534E] border-[#DCD6C8] hover:text-[#1C1917] flex items-center gap-1 transition"
                                      title="Turn back to front plate"
                                    >
                                      <IconFlip className="w-3 h-3" />
                                      <span>Front</span>
                                    </button>
                                  </div>
                                </div>

                                <h3 className="font-serif font-semibold text-lg sm:text-[22px] text-[#1C1917] tracking-[-0.02em] leading-snug mb-1.5">
                                  {ev.title}
                                </h3>

                                <div
                                  className="text-[11px] font-serif italic mb-3 pb-2 border-b flex flex-wrap items-center justify-between gap-2"
                                  style={{ color: '#57534E', borderColor: '#EAE5DA' }}
                                >
                                  <span>{ev.reference}</span>
                                  {ev.location && (
                                    <span className="inline-flex items-center gap-1 text-[#57534E]">
                                      <IconMapPin className="w-3 h-3" />
                                      <span>{ev.location.name}</span>
                                    </span>
                                  )}
                                </div>

                                <p className="text-xs sm:text-[14px] text-[#1C1917] leading-relaxed">
                                  {ev.summaryBack}
                                </p>

                                {(ev.artworkCredit || ev.sourceName) && (
                                  <div
                                    className="mt-3 pt-2 border-t text-[11px] leading-snug space-y-0.5"
                                    style={{ color: '#57534E', borderColor: '#EAE5DA' }}
                                  >
                                    {ev.artworkCredit && (
                                      <div>
                                        <span className="font-semibold text-[#44403C]">Plate:</span>{' '}
                                        <span>{ev.artworkCredit}</span>
                                      </div>
                                    )}
                                    {ev.sourceName && (
                                      <div>
                                        <span className="font-semibold text-[#44403C]">Source:</span>{' '}
                                        <span>{ev.sourceName}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Verso Footer: External Scripture / Encyclopedia Link */}
                              {(ev.resourceUrl || ev.wikiUrl) && (
                                <div
                                  className="pt-3 mt-3 border-t flex items-center justify-between gap-2"
                                  style={{ borderColor: '#DCD6C8' }}
                                >
                                  <a
                                    href={ev.resourceUrl || ev.wikiUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ backgroundColor: ev.seriesColor }}
                                    className="flex-1 py-2 px-3 rounded-[3px] text-[#FCFBF7] font-medium text-xs text-center flex items-center justify-center gap-1.5 hover:opacity-95 transition"
                                  >
                                    <span>
                                      {ev.resourceType === 'scripture' ? 'Read in ESV' : 'More Info'}
                                    </span>
                                    <IconExternal className="w-3 h-3" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* CONTACT AMBIENT-OCCLUSION SHADOW directly under bottom walnut rail */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -bottom-[7px] left-[2%] right-[2%] h-[11px]"
                        style={{
                          background: isCenter
                            ? 'radial-gradient(ellipse at center, rgba(20, 16, 13, 0.34) 0%, rgba(20, 16, 13, 0.11) 56%, transparent 84%)'
                            : 'radial-gradient(ellipse at center, rgba(20, 16, 13, 0.24) 0%, rgba(20, 16, 13, 0.08) 54%, transparent 82%)',
                          filter: 'blur(2px)'
                        }}
                      />

                      {/* HONED MARBLE FLOOR REFLECTION (3D perspective-matched, optical blur + fast fade) */}
                      {!isAtlasDrawerOpen && (
                        <div
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-x-0"
                          style={{
                            top: 'calc(100% + 5px)',
                            height: '100%',
                            clipPath: 'inset(0 0 calc(100% - 88px) 0)',
                            WebkitMaskImage:
                              'linear-gradient(to bottom, rgba(0, 0, 0, 0.21) 0px, rgba(0, 0, 0, 0.07) 34px, transparent 84px)',
                            maskImage:
                              'linear-gradient(to bottom, rgba(0, 0, 0, 0.21) 0px, rgba(0, 0, 0, 0.07) 34px, transparent 84px)',
                            filter: isCenter ? 'blur(1.5px)' : 'blur(2.1px)'
                          }}
                        >
                          <div className="w-full h-full" style={{ transform: 'scaleY(-1)' }}>
                            <MuseumFrameFace
                              event={ev}
                              customUrl={null}
                              isCenter={isCenter}
                              isReflection={true}
                              isVeiled={isVeiled}
                              resolvedUrl={resolvedUrlsRef.current[ev.id] || null}
                              renderArtwork={!(isCenter && isFlipped) && absOffset <= 3 && !isVeiled}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Architectural Left / Right Step Buttons */}
            <button
              type="button"
              onClick={() => stepCard(-1)}
              disabled={safeActiveIndex === 0}
              aria-label="Previous Plate"
              className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-40 w-9 h-9 rounded-[3px] bg-[#FAF7F0]/90 hover:bg-[#1C1917] hover:text-[#FCFBF7] text-[#1C1917] border border-[#C8C0B0] flex items-center justify-center shadow-sm disabled:opacity-25 disabled:pointer-events-none transition"
              title="Previous Work (Left Arrow)"
            >
              <IconArrowLeft />
            </button>
            <button
              type="button"
              onClick={() => stepCard(1)}
              disabled={safeActiveIndex >= filteredEvents.length - 1}
              aria-label="Next Plate"
              className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-40 w-9 h-9 rounded-[3px] bg-[#FAF7F0]/90 hover:bg-[#1C1917] hover:text-[#FCFBF7] text-[#1C1917] border border-[#C8C0B0] flex items-center justify-center shadow-sm disabled:opacity-25 disabled:pointer-events-none transition"
              title="Next Work (Right Arrow)"
            >
              <IconArrowRight />
            </button>
          </div>

          {/* ==================== TOGGLEABLE CARTOGRAPHIC ATLAS DRAWER ==================== */}
          {isAtlasDrawerOpen && activeEvent && (
            <HistoricalAtlasPlate
              mode="drawer"
              activeEvent={activeEvent}
              events={filteredEvents}
              activeIndex={safeActiveIndex}
              onSelectIndex={goToIndex}
              onCloseDrawer={() => setIsAtlasDrawerOpen(false)}
              onExpandToStage={() => setViewMode('atlas')}
              onReturnToGallery={() => setViewMode('coverflow')}
              isFiltered={isSearchFilterActive && searchOutput.isQueryActive}
            />
          )}

          {/* ==================== SLIM SINGLE-ROW GALLERY SCRUBBER RAIL ==================== */}
          {activeEvent && (
            <footer
              className="relative z-30 w-full border-t shrink-0"
              style={{ backgroundColor: '#F5F2EB', borderColor: '#DCD6C8' }}
            >
              <div className="max-w-[1440px] mx-auto px-3 sm:px-5 lg:px-8 h-12 flex items-center justify-between gap-2.5 sm:gap-4">
                {/* Left: Plate Counter, Learned Progress Menu & Interactive Atlas Locus */}
                <div className="flex items-center gap-2 md:w-[300px] lg:w-[340px] shrink-0">
                  <span className="w-[54px] shrink-0 text-[11px] font-sans font-medium text-[#57534E] tabular-nums">
                    {String(safeActiveIndex + 1).padStart(3, '0')} / {String(filteredEvents.length).padStart(3, '0')}
                  </span>

                  {/* Zero-login localStorage Learned Progress & Bulk Catch-Up Menu */}
                  <div ref={progressMenuRef} className="relative shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsProgressMenuOpen((o) => !o)}
                      aria-expanded={isProgressMenuOpen}
                      aria-haspopup="menu"
                      className={`h-7 px-2 rounded-[3px] border text-[11px] font-medium flex items-center gap-1 tabular-nums transition ${
                        learnedCards.has(activeEvent.id)
                          ? 'bg-[#1C1917] text-[#FCFBF7] border-[#1C1917]'
                          : 'bg-[#FCFBF7] text-[#57534E] border-[#DCD6C8] hover:border-[#78716C] hover:text-[#1C1917]'
                      }`}
                      title={`Recitation progress (${learnedCards.size} of ${TIMELINE_EVENTS.length} learned)`}
                    >
                      <IconCheck className="w-3 h-3 shrink-0" />
                      <span>
                        {learnedCards.size}/{TIMELINE_EVENTS.length}
                      </span>
                      <IconChevronDown className="w-2.5 h-2.5 opacity-75 shrink-0" />
                    </button>

                    {isProgressMenuOpen && (
                      <div
                        role="menu"
                        className="absolute left-0 bottom-full mb-2 w-60 rounded-[3px] border shadow-xl overflow-hidden z-50"
                        style={{ backgroundColor: '#FCFBF7', borderColor: '#1C1917' }}
                      >
                        <div
                          className="px-3 py-1.5 border-b flex items-center justify-between text-[10px] font-sans font-semibold uppercase tracking-[0.12em] text-[#57534E]"
                          style={{ backgroundColor: '#F5F2EB', borderColor: '#DCD6C8' }}
                        >
                          <span>Saved on Device</span>
                          <span className="tabular-nums text-[#1C1917]">
                            {learnedCards.size}/{TIMELINE_EVENTS.length}
                          </span>
                        </div>
                        <div className="p-1.5 flex flex-col gap-1">
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => toggleLearnedCard(activeEvent.id)}
                            className="w-full text-left px-2.5 py-1.5 rounded-[2px] text-xs font-medium text-[#1C1917] hover:bg-[#EAE4D7] flex items-center justify-between gap-2 transition"
                          >
                            <span>
                              {learnedCards.has(activeEvent.id)
                                ? `Unmark ${activeEvent.cardNumberPadded}`
                                : `Mark ${activeEvent.cardNumberPadded} Learned`}
                            </span>
                            {learnedCards.has(activeEvent.id) && <IconCheck className="w-3.5 h-3.5" />}
                          </button>

                          {activeEvent.cardNumber > 1 && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => markLearnedUpTo(activeEvent.cardNumber)}
                              className="w-full text-left px-2.5 py-1.5 rounded-[2px] text-xs font-medium text-[#1C1917] hover:bg-[#EAE4D7] transition tabular-nums"
                            >
                              Mark #001&ndash;{activeEvent.cardNumberPadded} Learned
                            </button>
                          )}

                          {learnedCards.size > 0 && (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={clearLearnedProgress}
                              className="w-full text-left px-2.5 py-1.5 rounded-[2px] text-[11px] text-[#78716C] hover:bg-[#F5F2EB] hover:text-[#1C1917] border-t border-[#EAE5DA] mt-0.5 pt-2 transition"
                            >
                              Reset Learned Progress
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {activeEvent.location && (
                    <button
                      type="button"
                      onClick={() => setIsAtlasDrawerOpen((a) => !a)}
                      className={`hidden md:inline-flex items-center gap-1.5 px-2 py-1 rounded-[3px] text-xs border transition min-w-0 max-w-full overflow-hidden ${
                        isAtlasDrawerOpen
                          ? 'bg-[#1C1917] text-[#FCFBF7] border-[#1C1917]'
                          : 'bg-transparent text-[#57534E] border-transparent hover:border-[#DCD6C8] hover:text-[#1C1917]'
                      }`}
                      title={`${activeEvent.location.name} — Toggle Atlas Drawer (Shortcut: M)`}
                    >
                      <IconMapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{activeEvent.location.name.split(' (')[0]}</span>
                    </button>
                  )}
                </div>

                {/* Center: Scrubber + Ultra-Slim 5-Era Pigment Ruler */}
                <div className="flex-1 flex flex-col justify-center gap-1 min-w-[90px]">
                  <input
                    type="range"
                    min={0}
                    max={Math.max(0, filteredEvents.length - 1)}
                    value={safeActiveIndex}
                    onChange={(e) => goToIndex(Number(e.target.value))}
                    aria-label="Timeline Scrubber"
                    style={{ accentColor: activeEvent.seriesColor }}
                    className="w-full h-1.5 rounded-[2px] appearance-none cursor-pointer bg-[#DCD6C8]"
                  />
                  {selectedSeries === 'all' && !(isSearchFilterActive && searchOutput.isQueryActive) && (
                    <div className="hidden sm:grid grid-cols-5 gap-1">
                      {SERIES_INFO.map((s) => {
                        const isCurrentSeries = activeEvent.seriesId === s.id;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              const firstSeriesIdx = filteredEvents.findIndex((ev) => ev.seriesId === s.id);
                              if (firstSeriesIdx !== -1) goToIndex(firstSeriesIdx);
                            }}
                            className="h-[2px] w-full transition-opacity focus:outline-none"
                            style={{
                              backgroundColor: s.color,
                              opacity: isCurrentSeries ? 1 : 0.28
                            }}
                            title={`Jump to ${s.roman}. ${s.shortName}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Recitation & Curatorial Tools */}
                <div className="flex items-center gap-1 shrink-0">
                  <div ref={reciteMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsReciteMenuOpen((o) => !o)}
                      aria-expanded={isReciteMenuOpen}
                      aria-haspopup="menu"
                      aria-pressed={isReciteActive}
                      className={`w-7 h-7 sm:w-auto sm:px-2 rounded-[3px] border text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                        isReciteActive
                          ? 'bg-[#1C1917] text-[#FCFBF7] border-[#1C1917]'
                          : isReciteMenuOpen
                          ? 'bg-[#FCFBF7] text-[#1C1917] border-[#78716C]'
                          : 'bg-[#FCFBF7] text-[#57534E] border-[#DCD6C8] hover:border-[#78716C] hover:text-[#1C1917]'
                      }`}
                      title={reciteButtonTitle}
                    >
                      {isReciteActive ? (
                        <IconEyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <IconEye className="w-3.5 h-3.5" />
                      )}
                      <span className="hidden lg:inline">Recite Mode</span>
                    </button>

                    {isReciteMenuOpen && (
                      <div
                        role="menu"
                        aria-label="Recite Mode options"
                        className="absolute right-0 bottom-full mb-2 w-56 rounded-[3px] border border-[#DCD6C8] bg-[#FCFBF7] shadow-xl overflow-hidden z-50"
                      >
                        <div className="px-3 py-2 border-b border-[#EAE4D7] bg-[#F5F2EB] flex items-center justify-between">
                          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#57534E]">
                            Recite Mode
                          </span>
                          {isReciteActive && (
                            <button
                              type="button"
                              onClick={clearReciteOptions}
                              className="text-[10px] font-medium text-[#78716C] hover:text-[#1C1917] underline underline-offset-2 transition"
                            >
                              Off
                            </button>
                          )}
                        </div>
                        <div className="p-1.5 space-y-0.5">
                          {[
                            {
                              key: 'upcoming',
                              label: 'Hide Upcoming Photos',
                              desc: 'Hide plates ahead of focus'
                            },
                            {
                              key: 'title',
                              label: 'Hide Title',
                              desc: 'Hide current card title'
                            },
                            {
                              key: 'photo',
                              label: 'Hide Photo',
                              desc: 'Hide current card image'
                            }
                          ].map((opt) => {
                            const isChecked = Boolean(reciteOptions.all || reciteOptions[opt.key]);
                            return (
                              <button
                                key={opt.key}
                                type="button"
                                role="menuitemcheckbox"
                                aria-checked={isChecked}
                                onClick={() => toggleReciteOption(opt.key)}
                                className={`w-full px-2.5 py-2 rounded-[2px] text-left flex items-start gap-2.5 transition ${
                                  isChecked
                                    ? 'bg-[#F5F2EB] text-[#1C1917]'
                                    : 'text-[#1C1917] hover:bg-[#F5F2EB]/60'
                                }`}
                              >
                                <span
                                  className={`mt-0.5 w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center shrink-0 transition ${
                                    isChecked
                                      ? 'bg-[#1C1917] border-[#1C1917] text-[#FCFBF7]'
                                      : 'bg-[#FCFBF7] border-[#C8C0B0] text-transparent'
                                  }`}
                                >
                                  <IconCheck className="w-2.5 h-2.5" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-[11px] font-medium leading-tight">
                                    {opt.label}
                                  </span>
                                  <span className="block text-[10px] text-[#78716C] leading-snug mt-0.5">
                                    {opt.desc}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                        <div className="border-t border-[#EAE4D7] p-1.5 bg-[#FAF7F0]">
                          <button
                            type="button"
                            role="menuitemcheckbox"
                            aria-checked={Boolean(reciteOptions.all)}
                            onClick={() => toggleReciteOption('all')}
                            className={`w-full px-2.5 py-2 rounded-[2px] text-left flex items-start gap-2.5 transition ${
                              reciteOptions.all
                                ? 'bg-[#1C1917] text-[#FCFBF7]'
                                : 'text-[#1C1917] hover:bg-[#EAE4D7]/60'
                            }`}
                          >
                            <span
                              className={`mt-0.5 w-3.5 h-3.5 rounded-[2px] border flex items-center justify-center shrink-0 transition ${
                                reciteOptions.all
                                  ? 'bg-[#FCFBF7] border-[#FCFBF7] text-[#1C1917]'
                                  : 'bg-[#FCFBF7] border-[#C8C0B0] text-transparent'
                              }`}
                            >
                              <IconCheck className="w-2.5 h-2.5" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block text-[11px] font-semibold leading-tight">
                                All
                              </span>
                              <span
                                className={`block text-[10px] leading-snug mt-0.5 ${
                                  reciteOptions.all ? 'text-[#DCD6C8]' : 'text-[#78716C]'
                                }`}
                              >
                                Hide photo, title, year &amp; ahead
                              </span>
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsFlipped((f) => !f)}
                    className={`w-7 h-7 sm:w-auto sm:px-2 rounded-[3px] border text-[11px] font-medium flex items-center justify-center gap-1 transition ${
                      isFlipped
                        ? 'bg-[#1C1917] text-[#FCFBF7] border-[#1C1917]'
                        : 'bg-[#FCFBF7] text-[#1C1917] border-[#DCD6C8] hover:border-[#78716C]'
                    }`}
                    title={isFlipped ? 'Show Front Artwork (Space)' : 'Turn Frame for Summary (Space)'}
                  >
                    <IconFlip className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">{isFlipped ? 'Front' : 'Summary'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAtlasDrawerOpen((a) => !a)}
                    className={`w-7 h-7 rounded-[3px] border flex items-center justify-center transition ${
                      isAtlasDrawerOpen
                        ? 'bg-[#1C1917] text-[#FCFBF7] border-[#1C1917]'
                        : 'bg-[#FCFBF7] text-[#57534E] border-[#DCD6C8] hover:text-[#1C1917]'
                    }`}
                    title="Toggle Atlas Drawer (M)"
                  >
                    <IconCompass className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setIsPlaying((p) => !p)}
                      className={`w-7 h-7 rounded-l-[3px] border flex items-center justify-center transition ${
                        isPlaying
                          ? 'bg-[#1C1917] text-[#FCFBF7] border-[#1C1917]'
                          : 'bg-[#FCFBF7] text-[#57534E] border-[#DCD6C8] hover:text-[#1C1917]'
                      }`}
                      title={isPlaying ? 'Pause Gallery Tour' : `Auto-Play Gallery Tour (${playIntervalSec}s)`}
                    >
                      {isPlaying ? <IconPause /> : <IconPlay />}
                    </button>
                    <div ref={playSpeedMenuRef} className="relative flex items-center">
                      <button
                        type="button"
                        onClick={() => setIsPlaySpeedMenuOpen((o) => !o)}
                        aria-expanded={isPlaySpeedMenuOpen}
                        aria-haspopup="menu"
                        className={`h-7 px-1.5 rounded-r-[3px] border border-l-0 text-[10px] font-sans font-medium tabular-nums transition flex items-center justify-center ${
                          isPlaySpeedMenuOpen
                            ? 'bg-[#EAE4D7] text-[#1C1917] border-[#78716C]'
                            : 'border-[#DCD6C8] bg-[#FCFBF7] hover:border-[#78716C] text-[#57534E] hover:text-[#1C1917]'
                        }`}
                        title={`Auto-Play Cadence: ${playIntervalSec}s per plate (click to select)`}
                      >
                        {playIntervalSec}s
                      </button>

                      {isPlaySpeedMenuOpen && (
                        <div
                          role="menu"
                          aria-label="Auto-Play Cadence"
                          className="absolute right-0 bottom-full mb-2 w-24 rounded-[3px] border shadow-xl overflow-hidden z-50"
                          style={{ backgroundColor: '#FCFBF7', borderColor: '#1C1917' }}
                        >
                          <div
                            className="px-2.5 py-1 border-b text-[9px] font-sans font-semibold uppercase tracking-[0.12em] text-[#57534E]"
                            style={{ backgroundColor: '#F5F2EB', borderColor: '#DCD6C8' }}
                          >
                            Cadence
                          </div>
                          <div className="p-1 flex flex-col gap-0.5">
                            {PLAY_SPEED_OPTIONS.map((sec) => {
                              const isSelected = sec === playIntervalSec;
                              return (
                                <button
                                  key={sec}
                                  type="button"
                                  role="menuitemradio"
                                  aria-checked={isSelected}
                                  onClick={() => {
                                    setPlayIntervalSec(sec);
                                    setIsPlaySpeedMenuOpen(false);
                                  }}
                                  className={`w-full text-left px-2 py-1 rounded-[2px] text-[11px] font-sans font-medium tabular-nums flex items-center justify-between gap-2 transition ${
                                    isSelected
                                      ? 'bg-[#1C1917] text-[#FCFBF7]'
                                      : 'text-[#1C1917] hover:bg-[#EAE4D7]'
                                  }`}
                                >
                                  <span>{sec}s</span>
                                  {isSelected && <IconCheck className="w-3 h-3 shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </main>
      )}
    </div>
  );
}
