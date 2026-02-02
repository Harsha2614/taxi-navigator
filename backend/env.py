import gymnasium as gym
import numpy as np


class SmartTaxiEnv:

    def __init__(self):

        self.env = gym.make("Taxi-v3")
        self.locs = [(0, 0), (0, 4), (4, 0), (4, 3)]

        self.reset_grids()


    # ----------------------------
    def reset_grids(self):

        self.traffic = np.zeros((5, 5))
        self.weather = np.zeros((5, 5))

        np.random.seed()

        for _ in range(6):
            r, c = np.random.randint(0, 5, 2)
            self.traffic[r][c] = np.random.uniform(0.5, 1.0)

        for _ in range(5):
            r, c = np.random.randint(0, 5, 2)
            self.weather[r][c] = np.random.uniform(0.3, 1.0)


    # ----------------------------
    def reset(self):

        state, _ = self.env.reset()

        self.energy = 100
        self.steps = 0

        self.pickup_time = None
        self.drop_time = None

        self.reset_grids()

        return state


    # ----------------------------
    def step(self, action):

        prev_state = self.env.unwrapped.s

        next_state, reward, terminated, truncated, info = self.env.step(action)

        done = terminated or truncated

        row, col, passenger, dest = self.decode(next_state)

        total_reward = reward


        # 🚨 Wall hit penalty
        if next_state == prev_state:
            total_reward -= 5


        # Traffic
        t = self.traffic[row][col]
        if t > 0:
            total_reward -= t * 2


        # Weather
        w = self.weather[row][col]
        if w > 0:
            total_reward -= w * 1.5


        # Energy
        cost = 1 + t + w
        self.energy -= cost


        if self.energy <= 0:
            total_reward -= 20
            done = True


        # Pickup time
        if passenger == 4 and self.pickup_time is None:
            self.pickup_time = self.steps


        # Dropoff bonus
        if passenger == 4 and action == 5:

            self.drop_time = self.steps

            wait = self.pickup_time or 0
            ride = self.drop_time - wait

            bonus = 20 - (wait * 0.2 + ride * 0.1)

            total_reward += bonus


        self.steps += 1

        return next_state, total_reward, done, info


    # ----------------------------
    def decode(self, state):

        out = []

        out.append(state % 4)
        state //= 4

        out.append(state % 5)
        state //= 5

        out.append(state % 5)
        state //= 5

        out.append(state)

        return tuple(reversed(out))
