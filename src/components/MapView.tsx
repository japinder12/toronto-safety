"use client";

import { useEffect, useRef } from "react";
import type { LatLngExpression, LayerGroup } from "leaflet";
import "leaflet/dist/leaflet.css";

type Marker = {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  color?: string;
};

type MapViewProps = {
  center: LatLngExpression;
  zoom?: number;
  markers?: Marker[];
  autoFit?: boolean;
};

export default function MapView({ center, zoom = 12, markers = [], autoFit = true }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    let L: typeof import("leaflet");
    let map: any;
    let layer: any;

    const init = async () => {
      const leaflet = await import("leaflet");
      L = leaflet;

      if (!mapRef.current) return;

      map = L.map(mapRef.current, { zoomControl: true, attributionControl: true }).setView(
        center as any,
        zoom
      );
      mapInstanceRef.current = map;

      layer = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          maxZoom: 19,
          attribution: "&copy; OpenStreetMap contributors",
        }
      ).addTo(map);

      renderMarkers();
    };

    const renderMarkers = () => {
      if (!mapInstanceRef.current || !L) return;
      // Clear existing layer group if any
      if ((mapInstanceRef.current as any)._markerLayer) {
        (mapInstanceRef.current as any)._markerLayer.clearLayers();
      } else {
        (mapInstanceRef.current as any)._markerLayer = L.layerGroup().addTo(mapInstanceRef.current);
      }

      const group = (mapInstanceRef.current as any)._markerLayer as LayerGroup;

      const latlngs: [number, number][] = [];
      markers.forEach((m) => {
        const circle = L.circleMarker([m.lat, m.lng], {
          radius: 6,
          color: "#ffffff",
          weight: 2,
          fillColor: m.color || "#3b82f6",
          fillOpacity: 0.85,
        });
        if (m.label) circle.bindPopup(m.label);
        circle.addTo(group);
        latlngs.push([m.lat, m.lng]);
      });
      if (autoFit && latlngs.length > 0) {
        const bounds = L.latLngBounds(latlngs);
        mapInstanceRef.current.fitBounds(bounds, { padding: [24, 24] });
      }
    };

    init();

    return () => {
      try {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
        }
      } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update center/zoom and markers when props change
  useEffect(() => {
    const update = async () => {
      const leaflet = await import("leaflet");
      const L = leaflet;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView(center as any, zoom);
        // force re-render markers by calling our helper
        if ((mapInstanceRef.current as any)._markerLayer) {
          (mapInstanceRef.current as any)._markerLayer.clearLayers();
        }
        const group: LayerGroup =
          (mapInstanceRef.current as any)._markerLayer || (L.layerGroup().addTo(mapInstanceRef.current) as LayerGroup);
        (mapInstanceRef.current as any)._markerLayer = group as any;
        const Llib = await import("leaflet");
        const latlngs: [number, number][] = [];
        markers.forEach((m) => {
          const circle = Llib.circleMarker([m.lat, m.lng], {
            radius: 6,
            color: "#ffffff",
            weight: 2,
            fillColor: m.color || "#3b82f6",
            fillOpacity: 0.85,
          });
          if (m.label) circle.bindPopup(m.label);
          circle.addTo(group);
          latlngs.push([m.lat, m.lng]);
        });
        if (autoFit && latlngs.length > 0) {
          const bounds = Llib.latLngBounds(latlngs);
          mapInstanceRef.current.fitBounds(bounds, { padding: [24, 24] });
        }
      }
    };
    update();
  }, [center, zoom, markers]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "420px", borderRadius: 12, overflow: "hidden" }}
      aria-label="Map"
    />
  );
}
