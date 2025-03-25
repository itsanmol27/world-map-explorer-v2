"use client";

import { MapContainer, CircleMarker, Popup, TileLayer, GeoJSON, useMapEvent } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import React, { useEffect, useState } from "react";
import { geocodingAPI } from "../utils/RouteProvider";

export interface PositionType {
  lat: number;
  lng: number;
}

interface MapProps {
  selectedPosition?: PositionType; // Add this prop
}

const Map:React.FC<MapProps> = ({selectedPosition}) => {
  const [position, setPosition] = useState<PositionType>();
  const [borderData, setBorderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function updateBorder(lat: number, lng: number) {
    setIsLoading(true);
    console.log("Fetching border for:", lat, lng);
    try {
      const response = await fetch(
        `${geocodingAPI}/reverse?lat=${lat}&lon=${lng}&zoom=${6}&format=geojson&polygon_geojson=1&polygon_threshold=${1 / Math.pow(10, 3)}`
      );
      const data = await response.json();
      console.log("Fetched border data:", data);
      setBorderData(data);
    } catch (error) {
      console.error("Error fetching border data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetch("https://ipinfo.io/json")
      .then((response) => response.json())
      .then((data) => {
        const [lat, lng] = data.loc.split(",");
        if (lat && lng) {
          const newPosition = { lat: parseFloat(lat), lng: parseFloat(lng) };
          setPosition(newPosition);
          updateBorder(newPosition.lat, newPosition.lng);
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  useEffect(() => {
    if (position) {
      console.log("Position changed:", position);
      updateBorder(position.lat, position.lng);
    }
  }, [position?.lat, position?.lng]);

  function ClickHandler() {
    useMapEvent("click", (e) => {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
    });
    return null;
  }

  if (!position) return null;

  return (
    <MapContainer
      center={position}
      zoom={11}
      scrollWheelZoom={true}
      style={{ height: "100vh", width: "100vw" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <CircleMarker
        center={position}
        radius={4}  // Adjust size (in pixels)
        fillOpacity={1}  // Fully opaque
        color="black"  // Border color
        fillColor="black"  // Fill color
      >
        <Popup>
          This Marker icon is displayed correctly with <i>leaflet-defaulticon-compatibility</i>.
        </Popup>
      </CircleMarker>

      {borderData && !isLoading && (
        <GeoJSON
          key={`${position.lat}-${position.lng}`}
          data={borderData}
          style={() => ({
            color: "blue",
            weight: 2,
            fillOpacity: 0,
          })}
        />
      )}

      <ClickHandler />
    </MapContainer>
  );
}

export default Map;