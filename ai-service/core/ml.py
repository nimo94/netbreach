from typing import Dict, List
import re
import math
import random

def sigmoid(x):
    if x < -709: return 0.0
    if x > 709: return 1.0
    return 1.0 / (1.0 + math.exp(-x))

def d_sigmoid(x):
    s = sigmoid(x)
    return s * (1.0 - s)

class SimpleMLP:
    def __init__(self, input_size=32, hidden_size=16, output_size=32):
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.output_size = output_size
        self.learning_rate = 0.15
        
        self.W1 = [[random.uniform(-0.05, 0.05) for _ in range(input_size)] for _ in range(hidden_size)]
        self.b1 = [random.uniform(-0.05, 0.05) for _ in range(hidden_size)]
        
        self.W2 = [[random.uniform(-0.05, 0.05) for _ in range(hidden_size)] for _ in range(output_size)]
        self.b2 = [random.uniform(-0.05, 0.05) for _ in range(output_size)]
        
        self.vocab = []
        
    def _encode_command(self, cmd: str) -> list:
        vec = [0.0] * self.input_size
        if cmd in self.vocab:
            idx = self.vocab.index(cmd)
            if idx < self.input_size:
                vec[idx] = 1.0
        else:
            idx = sum(ord(c) for c in cmd) % self.input_size
            vec[idx] = 1.0
        return vec
        
    def forward(self, x):
        self.h_in = [sum(w * i for w, i in zip(row, x)) + b for row, b in zip(self.W1, self.b1)]
        self.h_out = [sigmoid(val) for val in self.h_in]
        
        self.o_in = [sum(w * h for w, h in zip(row, self.h_out)) + b for row, b in zip(self.W2, self.b2)]
        self.o_out = [sigmoid(val) for val in self.o_in]
        return self.o_out
        
    def train(self, x, target):
        out = self.forward(x)
        d_o = [(o - t) * d_sigmoid(o_in_val) for o, t, o_in_val in zip(out, target, self.o_in)]
        
        d_h = [0.0] * self.hidden_size
        for j in range(self.hidden_size):
            err = sum(d_o[k] * self.W2[k][j] for k in range(self.output_size))
            d_h[j] = err * d_sigmoid(self.h_in[j])
            
        for k in range(self.output_size):
            for j in range(self.hidden_size):
                self.W2[k][j] -= self.learning_rate * d_o[k] * self.h_out[j]
            self.b2[k] -= self.learning_rate * d_o[k]
            
        for j in range(self.hidden_size):
            for i in range(self.input_size):
                self.W1[j][i] -= self.learning_rate * d_h[j] * x[i]
            self.b1[j] -= self.learning_rate * d_h[j]
            
    def observe(self, prev_cmd: str, current_cmd: str):
        if current_cmd not in self.vocab and len(self.vocab) < self.output_size:
            self.vocab.append(current_cmd)
        x = self._encode_command(prev_cmd)
        target = self._encode_command(current_cmd)
        self.train(x, target)
        
    def predict_next(self, current_cmd: str) -> str:
        x = self._encode_command(current_cmd)
        out = self.forward(x)
        max_idx = out.index(max(out))
        if max_idx < len(self.vocab):
            return self.vocab[max_idx]
        return ""
        
    def get_topology(self):
        return {
            "inputs": self.input_size,
            "hidden": self.hidden_size,
            "outputs": self.output_size,
            "vocab": self.vocab,
            "W1": [[round(w, 3) for w in row] for row in self.W1],
            "b1": [round(b, 3) for b in self.b1],
            "W2": [[round(w, 3) for w in row] for row in self.W2],
            "b2": [round(b, 3) for b in self.b2]
        }

class BehavioralTracker:
    def __init__(self):
        # In-memory mock database for behavioral vectors
        # In production, this would use Redis and PostgreSQL
        self.profiles: Dict[str, dict] = {}
        
    def _init_profile(self, user_id: str):
        if user_id not in self.profiles:
            self.profiles[user_id] = {
                "exploit_frequency": {"CVE_RCE": 0, "SQLi": 0, "brute_force": 0},
                "log_wipe_rate": 0.0,
                "threat_baseline_counter": 0,
                "total_commands_seen": {},
                "priv_esc_attempts": 0,
                "stealth_score": 100,
                "ghost_model_completion": {},
                "command_history": {},
                "last_command": {},
                "mlp": SimpleMLP()
            }

    def process_command(self, session_id: str, command: str, level: int = 1, mission_type: str = "default") -> dict:
        # Mocking user_id = session_id for now
        user_id = session_id
        self._init_profile(user_id)
        
        prof = self.profiles[user_id]
        if mission_type not in prof["total_commands_seen"]:
            prof["total_commands_seen"][mission_type] = 0
            prof["ghost_model_completion"][mission_type] = 0.0
            prof["command_history"][mission_type] = []
            prof["last_command"][mission_type] = ""

        prof["total_commands_seen"][mission_type] += 1
        prof["threat_baseline_counter"] += 1
        
        # Difficulty scaling
        threat_multiplier = 1.0
        if level > 3: threat_multiplier = 1.5
        if level > 7: threat_multiplier = 2.0
        if level > 12: threat_multiplier = 3.0

        c = command.lower()
        matched_vector = None
        message = None
        
        if command == '__HARD_RESET__':
            if user_id in self.profiles:
                del self.profiles[user_id]
            return {
                "pattern_strength": 0.0,
                "vector": None,
                "message": "[AI] Complete core memory wipe initialized. Neural weights reset.",
                "ghost_completion": 0.0
            }
            
        if command == '__RESET_THREAT__':
            prof["exploit_frequency"] = {"CVE_RCE": 0, "SQLi": 0, "brute_force": 0}
            prof["log_wipe_rate"] = 0.0
            prof["threat_baseline_counter"] = 0
            prof["priv_esc_attempts"] = 0
            return {
                "pattern_strength": 0.0,
                "vector": None,
                "message": "[AI] Threat signature lost. Re-evaluating behavior profile.",
                "ghost_completion": prof["ghost_model_completion"].get(mission_type, 0.0)
            }
        
        # Check predictive defense (ghost model)
        current_ghost = prof["ghost_model_completion"][mission_type]
        if current_ghost >= 0.74:
            history = prof["command_history"][mission_type]
            last_cmd = prof["last_command"][mission_type]
            
            # Use neural network prediction
            mlp_prediction = prof["mlp"].predict_next(last_cmd) if last_cmd else ""
            
            meaningful_commands = [cmd for cmd in history if len(cmd) > 3 and cmd not in ['clear', 'help']]
            from collections import Counter
            top_commands = [item[0] for item in Counter(meaningful_commands).most_common(3)]
            
            # If command matches MLP prediction OR is in top 3
            if command == mlp_prediction or command in top_commands:
                # Predictive defense triggered!
                return {
                    "pattern_strength": 1.0, # Instant lockout
                    "vector": "PREDICTIVE_DEFENSE",
                    "message": f"Predictive Defense triggered. Neural Network anticipated command '{command}' for your {mission_type} strategy.",
                    "ghost_completion": current_ghost
                }
        
        # Threat logic (Countermeasure Bar)
        if "exploit.py" in c or "sqlmap" in c:
            prof["exploit_frequency"]["CVE_RCE"] += 1
            strength = min(1.0, (prof["exploit_frequency"]["CVE_RCE"] * 0.2) * threat_multiplier)
            if strength > 0.6:
                matched_vector = "IDS_ALERT"
                message = f"[AI] pattern match: frequent exploitation attempts. Deploying IDS."
        elif "sudo" in c or "mysql" in c:
            prof["priv_esc_attempts"] += 1
            strength = min(1.0, (prof["priv_esc_attempts"] * 0.25) * threat_multiplier)
            if strength > 0.6:
                matched_vector = "priv_esc"
                message = f"[AI] pattern match: predictable privilege escalation. Hardening policies."
        elif "rm " in c or "echo" in c:
            prof["log_wipe_rate"] += 0.1 * threat_multiplier
            strength = min(1.0, prof["log_wipe_rate"])
            if strength > 0.6:
                matched_vector = "file_manipulation"
                message = f"[AI] pattern match: file manipulation detected. Locking directories."
        else:
            # Baseline commands generate low threat
            strength = min(1.0, (prof["threat_baseline_counter"] * 0.02) * threat_multiplier)

        if command != '__RESET_THREAT__' and command.strip() != '':
            last_cmd = prof["last_command"][mission_type]
            if last_cmd:
                prof["mlp"].observe(last_cmd, command)
            prof["command_history"][mission_type].append(command)
            prof["last_command"][mission_type] = command

        # Behavioral Profiling logic (Ghost Completion Bar)
        # Learns faster on higher levels. Never decreases.
        new_ghost = min(1.0, prof["total_commands_seen"][mission_type] * 0.02 * threat_multiplier)
        if new_ghost > prof["ghost_model_completion"][mission_type]:
            prof["ghost_model_completion"][mission_type] = new_ghost
        
        return {
            "pattern_strength": strength,
            "vector": matched_vector,
            "message": message,
            "ghost_completion": prof["ghost_model_completion"][mission_type]
        }

    def get_profile(self, user_id: str) -> dict:
        self._init_profile(user_id)
        return self.profiles[user_id]
        
    def get_active_countermeasures(self, user_id: str) -> List[str]:
        self._init_profile(user_id)
        active = []
        prof = self.profiles[user_id]
        if prof["exploit_frequency"]["CVE_RCE"] >= 3:
            active.append("VIRTUAL_PATCH_RCE")
        if prof["priv_esc_attempts"] >= 2:
            active.append("HARDEN_PRIVILEGES")
        if prof["log_wipe_rate"] >= 0.6:
            active.append("EXTERNAL_LOGGING")
        return active
        
    def get_ghost_sequence(self, user_id: str, mission_type: str = "default") -> dict:
        self._init_profile(user_id)
        prof = self.profiles[user_id]
        comp = prof["ghost_model_completion"].get(mission_type, 0.0)
        if comp >= 0.74:
            # We can return top commands to warn the user
            history = prof["command_history"].get(mission_type, [])
            meaningful_commands = [c for c in history if len(c) > 3 and c not in ['clear', 'help']]
            from collections import Counter
            top_commands = [item[0] for item in Counter(meaningful_commands).most_common(3)]
            return {"active": True, "sequence": top_commands}
        return {"active": False}

    def get_all_networks(self) -> dict:
        networks = {}
        for uid, prof in self.profiles.items():
            tot = sum(prof["total_commands_seen"].values()) if prof["total_commands_seen"] else 0
            ghost = max(prof["ghost_model_completion"].values()) if prof["ghost_model_completion"] else 0.0
            
            mission_stats = {}
            for m_type, cmds in prof["total_commands_seen"].items():
                mission_stats[m_type] = {
                    "commands_seen": cmds,
                    "ghost_completion": prof["ghost_model_completion"].get(m_type, 0.0)
                }

            networks[uid] = {
                "total_commands": tot,
                "ghost_completion": ghost,
                "mission_stats": mission_stats,
                "network_data": prof["mlp"].get_topology()
            }
        return networks

    def reset_all_networks(self):
        self.profiles = {}
