import numpy as np
import os


class QLearningAgent:

    def __init__(
        self,
        state_size,
        action_size,
        alpha=0.1,
        gamma=0.99,
        epsilon=1.0,
        epsilon_decay=0.995,
        epsilon_min=0.05
    ):

        self.state_size = state_size
        self.action_size = action_size

        self.alpha = alpha
        self.gamma = gamma

        self.epsilon = epsilon
        self.epsilon_decay = epsilon_decay
        self.epsilon_min = epsilon_min

        self.q_table = np.zeros((state_size, action_size))

    def choose_action(self, state):

        if np.random.rand() < self.epsilon:
            return np.random.randint(self.action_size)

        return np.argmax(self.q_table[state])

    def learn(self, state, action, reward, next_state):

        best_next = np.max(self.q_table[next_state])

        self.q_table[state][action] += self.alpha * (
            reward + self.gamma * best_next
            - self.q_table[state][action]
        )

    def decay(self):
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)

    def save(self, path="models/qtable.npy"):

        os.makedirs("models", exist_ok=True)
        np.save(path, self.q_table)

    def load(self, path="models/qtable.npy"):

        if os.path.exists(path):
            self.q_table = np.load(path)
