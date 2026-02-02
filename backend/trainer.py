import gymnasium as gym
import numpy as np


def train_agent(episodes=10000):

    env = gym.make("Taxi-v3")

    state_size = env.observation_space.n
    action_size = env.action_space.n

    q_table = np.zeros((state_size, action_size))


    alpha = 0.1
    gamma = 0.99

    epsilon = 1.0
    epsilon_decay = 0.999
    epsilon_min = 0.1


    for ep in range(episodes):

        state, _ = env.reset()

        done = False

        while not done:

            if np.random.rand() < epsilon:
                action = env.action_space.sample()
            else:
                action = np.argmax(q_table[state])


            next_state, reward, terminated, truncated, _ = env.step(action)

            done = terminated or truncated


            # Wall penalty in training
            if next_state == state:
                reward -= 5


            q_table[state][action] += alpha * (
                reward + gamma * np.max(q_table[next_state])
                - q_table[state][action]
            )

            state = next_state


        epsilon = max(epsilon_min, epsilon * epsilon_decay)


    np.save("q_table.npy", q_table)

    return q_table
