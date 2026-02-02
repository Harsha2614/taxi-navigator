from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import numpy as np

from trainer import train_agent
from env import SmartTaxiEnv


app = FastAPI()


# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------
# Train
# -----------------------------
@app.post("/train")
def train(episodes: int = 10000):

    train_agent(episodes)

    return {
        "status": "Training Complete",
        "episodes": episodes
    }


# -----------------------------
# Multi Taxi Simulation
# -----------------------------
@app.get("/simulate")
def simulate():

    NUM_TAXIS = 5

    q_table = np.load("q_table.npy")

    taxis = []


    # Shared demand heatmap
    demand = np.random.randint(0, 10, (5, 5))


    # Action names
    action_map = {
        0: "South",
        1: "North",
        2: "East",
        3: "West",
        4: "Pickup",
        5: "Dropoff"
    }


    # ============================
    # Run each taxi
    # ============================
    for tid in range(NUM_TAXIS):

        env = SmartTaxiEnv()

        state = env.reset()

        done = False
        steps = 0
        total_reward = 0

        path = []
        logs = []

        pickup_loc = None
        dropoff_loc = None


        # ----------------------------
        # Simulation Loop
        # ----------------------------
        while not done and steps < 200:

            row, col, passenger, dest = env.decode(state)


            # Save pickup & dropoff
            if pickup_loc is None and passenger < 4:
                pickup_loc = env.locs[passenger]

            if dropoff_loc is None and dest < 4:
                dropoff_loc = env.locs[dest]


            # Save path
            path.append([row, col])


            # Choose best action
            action = int(np.argmax(q_table[state]))


            # Step
            next_state, reward, done, _ = env.step(action)

            q_val = float(q_table[state][action])


            # Logs
            logs.append({
                "step": steps,
                "position": [row, col],
                "action": action_map[action],
                "q_value": round(q_val, 2),
                "reward": round(reward, 2),
                "energy": round(env.energy, 2)
            })


            total_reward += reward

            state = next_state
            steps += 1


        # ----------------------------
        # ETA
        # ----------------------------

        avg_speed = 30  # km/h
        distance = len(path) * 0.5

        eta_min = (distance / avg_speed) * 60


        # ----------------------------
        # Fare
        # ----------------------------

        base_fare = 50
        per_km = 12

        traffic_surge = np.mean(env.traffic) * 20
        weather_surge = np.mean(env.weather) * 15

        fare = (
            base_fare +
            (distance * per_km) +
            traffic_surge +
            weather_surge
        )


        # ----------------------------
        # Save Taxi Result
        # ----------------------------

        taxis.append({

            "id": tid + 1,

            "total_reward": round(total_reward, 2),
            "steps": steps,
            "energy_left": round(env.energy, 2),

            "path": path,
            "logs": logs,

            "pickup": pickup_loc,
            "dropoff": dropoff_loc,

            "eta": round(eta_min, 2),
            "fare": round(fare, 2),

            "traffic": env.traffic.tolist(),
            "weather": env.weather.tolist()

        })


    # ============================
    # Response
    # ============================

    return {

        "status": "success",

        "taxis": taxis,

        "demand": demand.tolist()

    }


# -----------------------------
@app.get("/")
def root():
    return {"status": "Smart Taxi Backend Running"}
