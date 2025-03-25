"use client";

import { MapContainer, Marker, Popup, TileLayer, useMap, GeoJSON, useMapEvent } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import { useEffect, useState } from "react";
import { geocodingAPI } from "../utils/RouteProvider";

interface PositionType {
  lat: number;
  lng: number;
}

export default function Map() {
  const [position, setPosition] = useState<PositionType>();
  const [borderData, setBorderData] = useState<any>(null);

  function UpdateMapCenter({ position }: { position: PositionType }) {
    const map = useMap();
    useEffect(() => {
      if (position.lat && position.lng) {
        map.setView([position.lat, position.lng], map.getZoom());
      } else {
        map.setView([52.507932, 13.338414], map.getZoom());
      }
    }, [position, map]);
    return null;
  }

  function HandleMapClick({ setPosition }: { setPosition: (position: PositionType) => void }) {
    useMapEvent("click", (event) => {
      const { lat, lng } = event.latlng;
      setPosition({ lat, lng });
    });

    const map = useMap();
    
    useEffect(() => {
      async function fetchBorderData() {
        const { lat, lng } = map.getCenter();
        const geoData = await getBorder(lat, lng);
        setBorderData(geoData);
      }

      fetchBorderData();
    }, [map]);

    return null;
  }

  // Function to fetch border GeoJSON data
  async function getBorder(lat: number, lng: number) {
    try {
      const response = await fetch(
        `${geocodingAPI}/reverse?lat=${lat}&lon=${lng}&zoom=${6}&format=geojson&polygon_geojson=1&polygon_threshold=${1 / Math.pow(10, 3)}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching border data:", error);
      return null;
    }
  }

  // Fetch user's location on mount
  useEffect(() => {
    fetch("https://ipinfo.io/json")
      .then((response) => response.json())
      .then((data) => {
        const [lat, lng] = data.loc.split(",");
        if (lat && lng) {
          const newPosition = { lng: parseFloat(lng), lat: parseFloat(lat) };
          setPosition(newPosition);

          // Fetch and set border data for the location
          getBorder(newPosition.lat, newPosition.lng).then((geoData) => {
            console.log(geoData);
            setBorderData(geoData);
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, []);

  // Fetch new border data on position change
  useEffect(() => {
    if (position) {
      getBorder(position.lat, position.lng).then((geoData) => {
        setBorderData(geoData);
      });
    }
  }, [position]);

  if (position) {
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

        <Marker position={position}>
          <Popup>
            This Marker icon is displayed correctly with <i>leaflet-defaulticon-compatibility</i>.
          </Popup>
        </Marker>

        {/* Render the border GeoJSON data */}
        {borderData && (
          <GeoJSON
            data={borderData}
            style={() => ({
              color: "blue", // Set the border color
              weight: 2,    // Border thickness
              fillOpacity: 0, // Make sure the inside is transparent
            })}
          />
        )}

        {/* <UpdateMapCenter position={position} /> */}
        {/* Component to handle map clicks */}
        {/* <HandleMapClick setPosition={setPosition} /> */}
      </MapContainer>
    );
  }

  return null;
}