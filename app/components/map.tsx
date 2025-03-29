"use client";
import { MapContainer, CircleMarker, Popup, TileLayer, GeoJSON, useMapEvent, Marker } from "react-leaflet";
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
  selectedPosition?: PositionType | null;
}

const Map: React.FC<MapProps> = ({ selectedPosition }) => {
  const [position, setPosition] = useState<PositionType>();
  const [borderData, setBorderData] = useState<any>(null);
  const [selectedBorderData, setSelectedBorderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function updateBorder(lat: number, lng: number, isSelectedPosition = false) {
    setIsLoading(true);
    try {
      const response = await fetch(
        `${geocodingAPI}/reverse?lat=${lat}&lon=${lng}&zoom=${6}&format=geojson&polygon_geojson=1&polygon_threshold=${1 / Math.pow(10, 3)}`
      );
      const data = await response.json();
      if (isSelectedPosition) {
        setSelectedBorderData(data); // For searched positions
      } else {
        setBorderData(data); // For clicked positions
      }
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
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedPosition) {
      setPosition(selectedPosition);
      updateBorder(selectedPosition.lat, selectedPosition.lng, true);
    }
  }, [selectedPosition]);

  useEffect(() => {
    if (position && !selectedPosition) {
      updateBorder(position.lat, position.lng);
    }
  }, [position?.lat, position?.lng]);

  function ClickHandler() {
    useMapEvent("click", (e) => {
      const { lat, lng } = e.latlng;
      setPosition({ lat, lng });
      updateBorder(lat, lng, false);

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
        radius={4}
        fillOpacity={1}
        color="black"
        fillColor="black"
      >
        <Popup>Clicked Location</Popup>
      </CircleMarker>

      {selectedPosition && (
        <Marker position={selectedPosition}>
          <Popup>Searched Location</Popup>
        </Marker>
      )}

      {borderData && !isLoading && (
        <GeoJSON
          key={`clicked-${position.lat}-${position.lng}`}
          data={borderData}
          style={{
            color: "blue",
            weight: 2,
            fillOpacity: 0
          }}
        />
      )}

      {selectedBorderData && selectedPosition && (
        <GeoJSON
          key={`selected-${selectedPosition.lat}-${selectedPosition.lng}`}
          data={selectedBorderData}
          style={{
            color: "red",
            weight: 2,
            fillColor: "yellow",
            fillOpacity: 0.4
          }}
        />
      )}
      <ClickHandler />
    </MapContainer>
  );
};

export default Map;