"use client";

import dynamic from "next/dynamic";
import Header from "./components/Header";
import LeftBar from "./components/LeftBar";
import { useState } from "react";
import { PositionType } from "@/app/components/map";


const LazyMap = dynamic(() => import("@/app/components/map"), {
  ssr: false,
  loading: () => <p>Loading...</p>,
});

export default function Home() {

  const [selectedPosition, setSelectedPosition] = useState<PositionType>();

  return (
    <main>
      {/* <Disclaimer /> */}
      <Header />
      <LeftBar onPlaceSelect={(lat, lng) => setSelectedPosition({ lat, lng })} />
      <LazyMap selectedPosition={selectedPosition} />
    </main>
  );
}