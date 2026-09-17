"use client";
import { useEffect, useRef, useState } from "react";
import { validCoordinates } from "@/lib/farmLocation";
import { productLocation } from "@/lib/productUtils";
import "maplibre-gl/dist/maplibre-gl.css";
import "./phase4.css";

export default function FarmMap({ location, approximate = false }) {
  const containerRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const key = process.env.NEXT_PUBLIC_MAPTILER_API_KEY;
  const latitude = location?.latitude;
  const longitude = location?.longitude;
  const valid = validCoordinates({ latitude, longitude });

  useEffect(() => {
    if (!key || !valid || !containerRef.current) return;
    let alive = true;
    let map;
    let resizeObserver;
    async function start() {
      try {
        const imported = await import("maplibre-gl");
        const maplibregl = imported.default || imported;
        if (!alive || !containerRef.current) return;
        map = new maplibregl.Map({
          container: containerRef.current,
          style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${encodeURIComponent(key)}`,
          center: [longitude, latitude],
          zoom: approximate ? 10 : 13,
          interactive: false,
          attributionControl: true,
        });
        map.on("load", () => {
          map.resize();
          new maplibregl.Marker({ color: "#4b7732", draggable: false })
            .setLngLat([longitude, latitude])
            .addTo(map);
          if (alive) setLoading(false);
        });
        map.on("error", (event) => {
          console.error("Map initialization failed:", event?.error?.message || "MapLibre error");
          if (alive) { setFailed(true); setLoading(false); }
        });
        resizeObserver = new ResizeObserver(() => map?.resize());
        resizeObserver.observe(containerRef.current);
      } catch (error) {
        console.error("Map initialization failed:", error?.message || "Unknown error");
        if (alive) { setFailed(true); setLoading(false); }
      }
    }
    void start();
    return () => { alive = false; resizeObserver?.disconnect(); map?.remove(); };
  }, [key, valid, latitude, longitude, approximate]);

  return <section className="phase4-card"><h2>Farm Location</h2><p>{productLocation(location) || "Location not specified"}</p>{!key || !valid || failed ? <div className="map-fallback"><strong>Map currently unavailable.</strong><p>Location details are still available.</p></div> : <><div className="map-canvas" ref={containerRef} role="img" aria-label={approximate ? "Approximate farm location map" : "Farm location preview"} />{loading && <p role="status">Loading map…</p>}</>}<p className="muted">{approximate ? "Approximate Farm Location · Exact address is private." : "Marker is placed automatically. No dragging required."}</p></section>;
}


