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
import { FaInfoCircle } from "react-icons/fa";
import { PositionType } from "./map";

interface LeftBarProps {
  setSelectedPosition: (position: PositionType | null) => void;
}

interface EntityLabel {
  pageid?: number;
  ns?: number;
  title?: string;
  lastrevid?: number;
  modified?: string;
  type?: string;
  id?: string;
  labels?: {
    [languageCode: string]: {
      language: string;
      value: string;
    };
  };
  descriptions?: {
    [languageCode: string]: {
      language: string;
      value: string;
    };
  };
  aliases?: {
    [languageCode: string]: Array<{
      language: string;
      value: string;
    }>;
  };
  claims?: {
    [propertyId: string]: Array<{
      mainsnak: Snak;
      type: string;
      id: string;
      rank: string;
      references?: Array<{
        hash: string;
        snaks: {
          [propertyId: string]: Snak[];
        };
        'snaks-order': string[];
      }>;
    }>;
  };
  sitelinks?: {
    [site: string]: {
      site: string;
      title: string;
      badges: string[];
    };
  };
}

interface Snak {
  snaktype: string;
  property: string;
  hash: string;
  datavalue?: {
    value: string | {
      'entity-type': string;
      'numeric-id': number;
      id: string;
    } | {
      time: string;
      timezone: number;
      before: number;
      after: number;
      precision: number;
      calendarmodel: string;
    } | {
      latitude: number;
      longitude: number;
      altitude: null;
      precision: number;
      globe: string;
    };
    type: string;
  };
  datatype: string;
}

const LeftBar: React.FC<LeftBarProps> = ({ setSelectedPosition }) => {

  const [place, setPlace] = useState<string>();
  const [placeDetails, setPlaceDetails] = useState<[]>([]);
  const [isdistanceModelOpen, setIsdistanceModelOpen] = useState(false);
  const [entityLabel, setEntityLabel] = useState<EntityLabel | null>(null);
  const [isEntityModalOpen, setIsEntityModalOpen] = useState(false);

  const placesDropdownRef = useRef<HTMLDivElement>(null);

  async function findPlace() {
    const response = await axios.get(`${geocodingAPI}/search.php?q=${place}&format=jsonv2&exclude_place_ids=`);
    setPlaceDetails(response.data);
  }

  async function fetchEntityId(lat: number, lng: number) {
    const url = `https://www.wikidata.org/w/api.php?action=query&list=geosearch&gscoord=${lat}|${lng}&gsradius=1000&gslimit=1&format=json&origin=*`;
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
    console.log(response.entities?.[entityId]);
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
                  onClick={async (e) => {
                    e.stopPropagation(); // Prevent event bubbling
                    setPlaceDetails([]);
                    setSelectedPosition({ lat: parseFloat(place.lat), lng: parseFloat(place.lon) });
                    const entityId = await fetchEntityId(parseFloat(place.lat), parseFloat(place.lon));
                    if (entityId) {
                      setIsEntityModalOpen(true);
                    }
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
  isEntityModalOpen && entityLabel && (
    <div className="box fixed mt-10 ml-4 flex flex-col items-start gap-4 w-[300px] bg-white p-4 rounded-md shadow-lg border border-gray-200" aria-label="place information opened">
      {/* Close Button - Now properly positioned inside the box */}
      <button
        onClick={() => { setIsEntityModalOpen(false); setEntityLabel(null); setSelectedPosition(null) }}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
        id="closeEntityBtn"
        aria-label="close place information"
      >
        <IoIosCloseCircle className="text-xl" />
      </button>

      {/* Header */}
      <div className="w-full">
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <FaInfoCircle className="text-blue-500" />
          Place Information
        </h1>
      </div>

      {/* Main Content */}
      <div className="w-full p-3 bg-blue-50 rounded-md">
        <h2 className="font-bold text-lg mb-1">{entityLabel.labels?.en?.value || "Unknown Place"}</h2>
        {entityLabel.descriptions?.en?.value && (
          <p className="text-sm text-gray-600">{entityLabel.descriptions.en.value}</p>
        )}
      </div>

      {/* Details */}
      <div className="w-full space-y-3">
        {entityLabel.claims?.P31 && (
          <div className="flex items-start">
            <span className="font-semibold min-w-[100px]">Type:</span>
            <span>
              {typeof entityLabel.claims.P31[0].mainsnak.datavalue?.value === 'object' &&
                'id' in entityLabel.claims.P31[0].mainsnak.datavalue.value
                ? entityLabel.claims.P31[0].mainsnak.datavalue.value.id.replace("Q", "")
                : "Unknown"}
            </span>
          </div>
        )}

        {entityLabel.claims?.P17 && (
          <div className="flex items-start">
            <span className="font-semibold min-w-[100px]">Country:</span>
            <span>
              {typeof entityLabel.claims.P17[0].mainsnak.datavalue?.value === 'object' &&
                'id' in entityLabel.claims.P17[0].mainsnak.datavalue.value
                ? entityLabel.claims.P17[0].mainsnak.datavalue.value.id.replace("Q", "")
                : "Unknown"}
            </span>
          </div>
        )}

        {entityLabel.claims?.P571?.[0]?.mainsnak?.datavalue?.value && (
          <div className="flex items-start">
            <span className="font-semibold min-w-[100px]">Established:</span>
            <span>
              {(() => {
                try {
                  const value = entityLabel.claims.P571[0].mainsnak.datavalue.value;
                  if (typeof value === 'object' && 'time' in value) {
                    const year = new Date(value.time).getFullYear();
                    return isNaN(year) ? "Unknown" : year.toString();
                  }
                  return "Unknown";
                } catch {
                  return "Unknown";
                }
              })()}
            </span>
          </div>
        )}

        {entityLabel.claims?.P856 && (
          <div className="flex items-start">
            <span className="font-semibold min-w-[100px]">Website:</span>
            {typeof entityLabel.claims.P856[0].mainsnak.datavalue?.value === 'string' ? (
              <a
                href={entityLabel.claims.P856[0].mainsnak.datavalue.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline text-sm break-all"
              >
                {entityLabel.claims.P856[0].mainsnak.datavalue.value}
              </a>
            ) : (
              <span>Unknown</span>
            )}
          </div>
        )}
      </div>
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
