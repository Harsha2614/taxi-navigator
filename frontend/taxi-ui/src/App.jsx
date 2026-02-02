import { useState, useEffect } from "react";
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


// Change this to your API key
const GOOGLE_KEY = "";


const center = {
  lat: 17.385,
  lng: 78.4867 // Hyderabad (default)
};


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

      alert("Training Completed");

    } catch (err) {

      alert("Training Failed");
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

      alert("Simulation Failed");
      console.error(err);

    }

    setSimulating(false);
  };


  /* ================= PLAY ================= */

  const play = () => {

    if (!result?.path) return;

    setPlaying(true);

    let i = 0;

    const timer = setInterval(() => {

      i++;

      setCurrentStep(i);

      if (i >= result.path.length - 1) {

        clearInterval(timer);
        setPlaying(false);
      }

    }, 600);
  };


  /* ================= CONVERT GRID → MAP ================= */

  const convertToLatLng = (row, col) => {

    const baseLat = 17.385;
    const baseLng = 78.4867;

    return {
      lat: baseLat + row * 0.01,
      lng: baseLng + col * 0.01
    };
  };


  /* ================= RENDER MAP ================= */

  const renderMap = () => {

    if (!isLoaded || !result) return null;

    const path = result.path.map(p =>
      convertToLatLng(p[0], p[1])
    );

    const taxiPos =
      path[Math.min(currentStep, path.length - 1)];


    const pickup = result.pickup
      ? convertToLatLng(result.pickup[0], result.pickup[1])
      : null;

    const dropoff = result.dropoff
      ? convertToLatLng(result.dropoff[0], result.dropoff[1])
      : null;


    return (

      <GoogleMap
        center={taxiPos}
        zoom={13}
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


        {/* Route */}
        <Polyline
          path={path}
          options={{
            strokeColor: "#22c55e",
            strokeOpacity: 0.9,
            strokeWeight: 4
          }}
        />


        {/* Taxi */}
        <Marker
          position={taxiPos}
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

      </GoogleMap>
    );
  };


  /* ================= UI ================= */

  return (

    <div className="container">


      {/* HEADER */}
      <div className="header">
        🚕 Smart Taxi AI Dashboard
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
            style={{ marginTop: "10px" }}
          >
            ▶ Play
          </button>

        </div>

      </div>


      {/* MAIN */}
      <div className="main">


        {/* Stats */}
        {result && (

          <div className="stats">

            <div className="stat">
              Reward<br />
              <b>{result.total_reward}</b>
            </div>

            <div className="stat">
              Steps<br />
              <b>{result.steps}</b>
            </div>

            <div className="stat">
              Energy<br />
              <b>{result.energy_left}</b>
            </div>

          </div>

        )}


        {/* MAP */}
        <div className="map-container">
          {renderMap()}
        </div>

      </div>


      {/* LOGS */}
      <div className="logs">

        <h3>🧠 AI Logs</h3>

        <div className="log-scroll">

          {result?.logs?.map((log, i) => (

            <div key={i} className="log-item">

              Step {log.step} |
              Pos ({log.position[0]},{log.position[1]}) |
              {log.action} |
              Q {log.q_value} |
              E {log.energy}

            </div>

          ))}

        </div>

      </div>

    </div>
  );
}

export default App;
