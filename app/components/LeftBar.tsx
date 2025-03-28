"use client"
import { MdDirections } from "react-icons/md";
import { IoSearchSharp } from "react-icons/io5";
import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { geocodingAPI } from "../utils/RouteProvider";
import { IoIosCloseCircle } from "react-icons/io";
import { FaCircle } from "react-icons/fa";
import { FaMapLocationDot } from "react-icons/fa6";
import { FaArrowCircleRight } from "react-icons/fa";

interface LeftBarProps {
  onPlaceSelect: (lat: number, lng: number) => void; // Add this prop
}

const LeftBar: React.FC<LeftBarProps> = ({ onPlaceSelect }) => {

  const [place, setPlace] = useState<string>();
  const [placeDetails, setPlaceDetails] = useState<[]>([]);
  const [isdistanceModelOpen, setIsdistanceModelOpen] = useState(false);
  const [entityLabel , setEntityLabel] = useState();

  const placesDropdownRef = useRef<HTMLDivElement>(null);

  async function findPlace() {
    const response = await axios.get(`${geocodingAPI}/search.php?q=${place}&format=jsonv2&exclude_place_ids=`);
    setPlaceDetails(response.data);
  }

  async function fetchEntityId(lat: number, lon: number) {
    const url = `https://www.wikidata.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lon}&gsradius=1000&gslimit=1&format=json&origin=*`;
    try {
      const response = await axios.get(url);
      if (response.data.query.geosearch.length > 0) {
        const entityId = response.data.query.geosearch[0].title;
        await fetchEntityLabel(entityId);
        return entityId; // This will return the entity ID, e.g., Q42
      }
    } catch (error) {
      console.error("Error fetching entity ID:", error);
    }
    return null;
  }

  async function fetchEntityLabel(entityId: string) {
    if (!entityId) return null;
    const url = `https://www.wikidata.org/wiki/Special:EntityData/${entityId}.json`;
    const response = await fetch(url).then((res) => res.json());
    setEntityLabel(response.entities?.[entityId]);
    return response.entities?.[entityId]?.labels?.en || null;
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (placesDropdownRef.current && !placesDropdownRef.current.contains(event.target as Node)) {
        setPlaceDetails([]);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col fixed w-[300px]" id="left-container">
      <div className="box-input relative top-[50px] w-full" aria-label="search places">
        <div className=" flex items-center justify-between gap-2">
          <div className="px-2 flex bg-white items-center rounded-md shadow-md border border-black w-full">
            <input
              type="text"
              placeholder="Search Places"
              onChange={(e) => setPlace(e.target.value)}
              className="w-full px-2 py-1"
            />
            <button className="cursor-pointer" onClick={findPlace}>
              <IoSearchSharp />
            </button>
          </div>
          <button onClick={() => { setIsdistanceModelOpen((prev) => !prev) }} id="trigger-icon" aria-label="find distance between places">
            <MdDirections />
          </button>
        </div>
        {
          placeDetails.length > 0 && (
            <div
              className="absolute top-[50px] left-0 w-full bg-white rounded-md shadow-md border border-black z-50 max-h-[200px] overflow-y-auto"
              ref={placesDropdownRef} // Move ref to the parent container
            >
              {placeDetails.map((place: any) => (
                <div
                  key={place.place_id}
                  className="p-2 border-b last:border-none cursor-pointer hover:bg-gray-100"
                  onClick={async(e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    setPlaceDetails([]);
                    onPlaceSelect(parseFloat(place.lat), parseFloat(place.lon));
                    const entityId = await fetchEntityId(parseFloat(place.lat), parseFloat(place.lon));
                    setPlaceDetails([]);
                  }}
                >
                  <h1 className="font-semibold">{place.display_name}</h1>
                  <p>{place.lat}, {place.lon}</p>
                </div>
              ))}
            </div>
          )
        }
        
        {
          isdistanceModelOpen &&
          <div className="box fixed mt-10 ml-4 flex flex-col items-center gap-10" id="box" aria-label="distance finder opened">
            <div className=" flex items-center justify-center w-full">
              <h1 className=" text-3xl font-semibold">Find Distance</h1>
              <button onClick={() => { setIsdistanceModelOpen(false) }} className="fas fa-times-circle relative -right-[40px]" id="closeBtn" aria-label="close distance finder"><IoIosCloseCircle /></button>
            </div>

            <div className="flex items-center">
              <span><FaCircle /></span>
              <div className="dist-input flex items-center" id="c-beginning"><input type="text" id="beginning"
                placeholder="Enter Starting point" aria-label="type place and press enter" />
                <button aria-label="click to see suggessions" id="b-searchbutton"><IoSearchSharp /></button>
              </div>
            </div>


            <div className="flex items-center">
              <span><FaCircle /></span>
              <div className="dist-input flex items-center" id="c-destination"><input type="text" id="destination"
                placeholder="Enter Destination" aria-label="type place and press enter" />
                <button id="d-searchbutton" aria-label="click to see suggessions"><IoSearchSharp /></button>
              </div>
            </div>

            <div className=" w-full flex items-center justify-between p-2">

              <button className="fas fa-map-marked-alt" aria-hidden="true" title="Choose from map" id="fromMap"><FaMapLocationDot /></button>
              <button className="fas fa-arrow-circle-right" id="find" title="Find Distance"
                aria-label=" click to Find distance"><FaArrowCircleRight /></button>
            </div>
            <div className=" flex">
              <div className=" hidden" id="" aria-live="polite">
                Distance : <span id="dist"></span><br />
                Time : <span id="time"></span>
              </div>
              <p className="text-center"><br />Directions courtesy of <a
                href="https://gis-ops.com/global-open-valhalla-server-online/" target="_blank">Valhalla (FOSSGIS)</a></p>
            </div>
          </div>
        }
      </div>
    </div>
  );
}

export default LeftBar;
