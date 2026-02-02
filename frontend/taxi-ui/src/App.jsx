import { useState } from "react";
import axios from "axios";

import {
  GoogleMap,
  Marker,
  Polyline,
  TrafficLayer,
  useJsApiLoader
} from "@react-google-maps/api";

import "./App.css";


const API = "http://127.0.0.1:8000";

// 🔴 Put your Google API key here
const GOOGLE_KEY = "AIzaSyCDEXPpzFqouMu1KW9TW2-YSC2_B_fLl8U";


const center = {
  lat: 17.385,
  lng: 78.4867 // Hyderabad
};


// Taxi colors
const COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f97316",
  "#e11d48",
  "#a855f7"
];


function App() {

  /* ================= STATES ================= */

  const [training, setTraining] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const [episodes, setEpisodes] = useState(3000);

  const [result, setResult] = useState(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);


  /* ================= MAP LOADER ================= */

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_KEY,
    libraries: ["visualization"]
  });


  /* ================= TRAIN ================= */

  const trainModel = async () => {

    setTraining(true);

    try {

      await axios.post(`${API}/train?episodes=${episodes}`);

      alert("✅ Training Completed");

    } catch (err) {

      alert("❌ Training Failed");
      console.error(err);

    }

    setTraining(false);
  };


  /* ================= SIMULATE ================= */

  const runSimulation = async () => {

    setSimulating(true);

    setCurrentStep(0);
    setPlaying(false);

    try {

      const res = await axios.get(`${API}/simulate`);

      setResult(res.data);

    } catch (err) {

      alert("❌ Simulation Failed");
      console.error(err);

    }

    setSimulating(false);
  };


  /* ================= PLAY ================= */

  const play = () => {

    if (!result?.taxis) return;

    setPlaying(true);

    let i = 0;

    const timer = setInterval(() => {

      i++;

      setCurrentStep(i);

      const maxLen = Math.max(
        ...result.taxis.map(t => t.path.length)
      );

      if (i >= maxLen - 1) {

        clearInterval(timer);
        setPlaying(false);
      }

    }, 600);
  };


  /* ================= GRID → MAP ================= */

  const convertToLatLng = (row, col, offset = 0) => {

    const baseLat = 17.385;
    const baseLng = 78.4867;

    return {
      lat: baseLat + row * 0.01 + offset,
      lng: baseLng + col * 0.01 + offset
    };
  };


  /* ================= RENDER MAP ================= */

  const renderMap = () => {

    if (!isLoaded || !result?.taxis) return null;


    return (

      <GoogleMap
        center={center}
        zoom={12}
        mapContainerStyle={{
          width: "100%",
          height: "100%"
        }}
        options={{
          mapTypeId: "roadmap",
          disableDefaultUI: true,
          zoomControl: true
        }}
      >

        {/* Traffic */}
        <TrafficLayer />


        {/* Taxis */}
        {result.taxis.map((taxi, idx) => {

          const color = COLORS[idx % COLORS.length];

          const path = taxi.path.map(p =>
            convertToLatLng(p[0], p[1], idx * 0.002)
          );

          const pos =
            path[Math.min(currentStep, path.length - 1)];

          const pickup = taxi.pickup
            ? convertToLatLng(
                taxi.pickup[0],
                taxi.pickup[1],
                idx * 0.002
              )
            : null;

          const dropoff = taxi.dropoff
            ? convertToLatLng(
                taxi.dropoff[0],
                taxi.dropoff[1],
                idx * 0.002
              )
            : null;


          return (

            <div key={idx}>


              {/* Route */}
              <Polyline
                path={path}
                options={{
                  strokeColor: color,
                  strokeOpacity: 0.9,
                  strokeWeight: 4
                }}
              />


              {/* Taxi */}
              <Marker
                position={pos}
                icon={{
                  url: "https://maps.google.com/mapfiles/kml/shapes/cabs.png",
                  scaledSize: new window.google.maps.Size(40, 40)
                }}
              />


              {/* Pickup */}
              {pickup && (

                <Marker
                  position={pickup}
                  label="P"
                />

              )}


              {/* Dropoff */}
              {dropoff && (

                <Marker
                  position={dropoff}
                  label="D"
                />

              )}

            </div>
          );
        })}

      </GoogleMap>
    );
  };


  /* ================= UI ================= */

  return (

    <div className="container">


      {/* HEADER */}
      <div className="header">
        🚕 Smart Taxi Fleet Dashboard
      </div>


      {/* SIDEBAR */}
      <div className="sidebar">


        {/* Training */}
        <div className="control-box">

          <h3>🧠 Training</h3>

          <input
            type="number"
            value={episodes}
            min="100"
            onChange={(e) => setEpisodes(e.target.value)}
          />

          <button
            onClick={trainModel}
            disabled={training}
          >
            {training ? "Training..." : "Train"}
          </button>

        </div>


        {/* Simulation */}
        <div className="control-box">

          <h3>🎮 Simulation</h3>

          <button
            onClick={runSimulation}
            disabled={simulating}
          >
            {simulating ? "Running..." : "Run"}
          </button>


          <button
            onClick={play}
            disabled={playing || !result}
            className="play-btn"
          >
            ▶ Play
          </button>

        </div>

      </div>


      {/* MAIN */}
      <div className="main">


        {/* Fleet Stats */}
        {result?.taxis && (

          <div className="stats">

            {result.taxis.map((t, i) => (

              <div key={i} className="stat">

                🚕 Taxi {t.id}<br />

                ETA: {t.eta} min<br />

                Fare: ₹{t.fare}<br />

                Energy: {t.energy_left}

              </div>

            ))}

          </div>

        )}


        {/* MAP */}
        <div className="map-container">
          {renderMap()}
        </div>

      </div>


      {/* LOGS */}
      <div className="logs">

        <h3>🧠 Fleet Logs</h3>

        <div className="log-scroll">

          {result?.taxis?.map((taxi, t) => (

            taxi.logs.map((log, i) => (

              <div key={`${t}-${i}`} className="log-item">

                🚕{taxi.id} |
                Step {log.step} |
                ({log.position[0]},{log.position[1]}) |
                {log.action} |
                Q {log.q_value} |
                E {log.energy}

              </div>

            ))

          ))}

        </div>

      </div>

    </div>
  );
}

export default App;
