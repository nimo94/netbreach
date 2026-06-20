from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from core.ml import BehavioralTracker

load_dotenv()

app = FastAPI(title="NETBREACH AI Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

tracker = BehavioralTracker()

class CommandLog(BaseModel):
    session_id: str
    command: str
    level: int = 1
    mission_type: str = "default"

@app.get("/health")
def health_check():
    return {"status": "ok", "model": "loaded"}

@app.post("/session/log")
def process_log(log: CommandLog):
    # Process the incoming command and update the behavioral vector
    result = tracker.process_command(log.session_id, log.command, log.level, log.mission_type)
    return result

@app.get("/profile/{user_id}")
def get_profile(user_id: str):
    return tracker.get_profile(user_id)

@app.post("/countermeasures")
def get_countermeasures(user_id: str):
    return tracker.get_active_countermeasures(user_id)

@app.get("/ghost/{user_id}")
def get_ghost_profile(user_id: str, mission_type: str = "default"):
    # Returns ghost hacker sequence if model >= 74%
    return tracker.get_ghost_sequence(user_id, mission_type)

@app.get("/network")
def get_network_stats():
    return tracker.get_all_networks()

@app.post("/network/reset")
def reset_network_stats():
    tracker.reset_all_networks()
    return {"status": "cleared"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
