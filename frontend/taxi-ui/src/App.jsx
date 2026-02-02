import { useState } from "react";
import axios from "axios";
import "./App.css";

const API = "http://127.0.0.1:8000";
const GRID_SIZE = 5;

function App() {

  // States
  const [training, setTraining] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const [episodes, setEpisodes] = useState(3000);

  const [result, setResult] = useState(null);

  const [currentStep, setCurrentStep] = useState(0);
  const [playing, setPlaying] = useState(false);


  // ---------------------------
  // Train Model
  // ---------------------------
  const trainModel = async () => {

    setTraining(true);

    try {

      await axios.post(
        `${API}/train?episodes=${episodes}`
      );

      alert("✅ Training Completed!");

    } catch (err) {

      console.error(err);
      alert("❌ Training Failed");

    }

    setTraining(false);
  };


  // ---------------------------
  // Run Simulation
  // ---------------------------
  const runSimulation = async () => {

    setSimulating(true);
    setCurrentStep(0);
    setPlaying(false);

    try {

      const res = await axios.get(`${API}/simulate`);

      console.log("Simulation Data:", res.data);

      setResult(res.data);

    } catch (err) {

      console.error(err);
      alert("❌ Simulation Failed");

    }

    setSimulating(false);
  };


  // ---------------------------
  // Play Animation
  // ---------------------------
  const play = () => {

    if (!result?.path) return;

    setPlaying(true);

    let i = 0;

    const interval = setInterval(() => {

      i++;

      setCurrentStep(i);

      if (i >= result.path.length - 1) {

        clearInterval(interval);
        setPlaying(false);
      }

    }, 600);
  };


  // ---------------------------
  // Render Grid
  // ---------------------------
const renderGrid = () => {

  if (!result?.path) return null;

  const pos =
    result.path[Math.min(currentStep, result.path.length - 1)];

  const [r, c] = pos;

  const traffic = result.traffic || [];
  const weather = result.weather || [];

  const pickup = Array.isArray(result.pickup) ? result.pickup : null;
  const dropoff = Array.isArray(result.dropoff) ? result.dropoff : null;


  let grid = [];

  for (let i = 0; i < GRID_SIZE; i++) {

    let row = [];

    for (let j = 0; j < GRID_SIZE; j++) {

      const isTaxi = i === r && j === c;

      const isPickup =
        pickup && i === pickup[0] && j === pickup[1];

      const isDropoff =
        dropoff && i === dropoff[0] && j === dropoff[1];

      const hasTraffic =
        traffic[i] && traffic[i][j] > 0;

      const hasWeather =
        weather[i] && weather[i][j] > 0;


      let cellClass = "cell";

      if (hasTraffic) cellClass += " traffic";
      if (hasWeather) cellClass += " weather";
      if (isPickup) cellClass += " pickup";
      if (isDropoff) cellClass += " dropoff";
      if (isTaxi) cellClass += " taxi";


      let symbol = "";

      if (isPickup) symbol = "🟢";
      if (isDropoff) symbol = "🔵";
      if (isTaxi) symbol = "🚕";


      row.push(
        <div
          key={`${i}-${j}`}
          className={cellClass}
        >
          {symbol}
        </div>
      );
    }

    grid.push(
      <div key={i} className="row-grid">
        {row}
      </div>
    );
  }

  return grid;
};




  return (
    <div className="container">

      <h1>🚕 Smart Taxi AI Simulator</h1>


      {/* ================= Training ================= */}
      <div className="card">

        <h2>Training</h2>

        <div className="row">

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
            {training ? "Training..." : "Train Model"}
          </button>

        </div>

      </div>


      {/* ================= Simulation ================= */}
      <div className="card">

        <h2>Simulation</h2>

        <button
          onClick={runSimulation}
          disabled={simulating}
        >
          {simulating ? "Running..." : "Run Simulation"}
        </button>


        {result && (

          <>

            {/* Stats */}
            <div className="stats">

              <p>
                Reward:
                <b> {result?.total_reward ?? "N/A"}</b>
              </p>

              <p>
                Steps:
                <b> {result?.steps ?? "N/A"}</b>
              </p>

              <p>
                Energy:
                <b> {result?.energy_left ?? "N/A"}</b>
              </p>

            </div>


            {/* Play */}
            <button
              onClick={play}
              disabled={playing}
              className="play-btn"
            >
              {playing ? "Playing..." : "▶ Play"}
            </button>


            {/* Grid */}
            <div className="grid">
              {renderGrid()}
            </div>


            {/* ================= Logs ================= */}
            {result?.logs && (

              <div className="log-box">

                <h3>🧠 AI Decision Log</h3>

                <div className="log-scroll">

                  {result.logs.map((log, i) => (

                    <div key={i} className="log-item">

                      Step {log.step} |
                      Pos ({log.position[0]},{log.position[1]}) |
                      Action: {log.action} |
                      Q: {log.q_value} |
                      Energy: {log.energy}

                    </div>

                  ))}

                </div>

              </div>

            )}

          </>

        )}

      </div>

    </div>
  );
}

export default App;
