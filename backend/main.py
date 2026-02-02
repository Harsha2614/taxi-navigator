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
# Simulate
# -----------------------------
@app.get("/simulate")
def simulate():

    env = SmartTaxiEnv()

    q_table = np.load("q_table.npy")

    state = env.reset()

    done = False

    total_reward = 0
    steps = 0

    path = []
    logs = []


    action_map = {
        0: "South",
        1: "North",
        2: "East",
        3: "West",
        4: "Pickup",
        5: "Dropoff"
    }


    pickup_loc = None
    dropoff_loc = None


    while not done and steps < 200:

        row, col, passenger, dest = env.decode(state)


        if pickup_loc is None and passenger < 4:
            pickup_loc = env.locs[passenger]

        if dropoff_loc is None and dest < 4:
            dropoff_loc = env.locs[dest]


        path.append([row, col])


        # 🎯 Small exploration
        if np.random.rand() < 0.05:
            action = env.env.action_space.sample()
        else:
            action = int(np.argmax(q_table[state]))


        next_state, reward, done, _ = env.step(action)


        q_val = float(q_table[state][action])


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


    return {
        "total_reward": round(total_reward, 2),
        "steps": steps,
        "energy_left": round(env.energy, 2),

        "path": path,
        "logs": logs,

        "traffic": env.traffic.tolist(),
        "weather": env.weather.tolist(),

        "pickup": pickup_loc,
        "dropoff": dropoff_loc
    }


# -----------------------------
@app.get("/")
def root():
    return {"status": "Smart Taxi Backend Running"}
