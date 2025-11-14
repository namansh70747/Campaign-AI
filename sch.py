import os
import uvicorn
import requests
import pprint
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
from fastapi.middleware.cors import CORSMiddleware

# --- 1. Load Environment Variables ---
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
CALENDLY_API_KEY = os.getenv("CALENDLY_API_KEY")
CALENDLY_EVENT_TYPE_URL = os.getenv("CALENDLY_EVENT_TYPE_URL") # e.g., https://api.calendly.com/event_types/AABBC...

if not GROQ_API_KEY:
    raise ValueError("❌ GROQ_API_KEY not found in .env")
if not CALENDLY_API_KEY:
    raise ValueError("❌ CALENDLY_API_KEY not found in .env")
if not CALENDLY_EVENT_TYPE_URL:
    raise ValueError("❌ CALENDLY_EVENT_TYPE_URL not found in .env")
    
# --- 2. Initialize LLM ---
print("--- 🧠 Initializing Log Analysis LLM ---")
llm = ChatGroq(model="llama-3.1-8b-instant", temperature=0)
print("--- ✅ LLM Ready ---")


# --- 3. Pydantic Models ---

# This is the expected input from your frontend
class CallLogRequest(BaseModel):
    callId: str
    logs: Dict[str, Any]
    timestamp: str

# This is what we want the LLM to extract from the log
class MeetingAnalysis(BaseModel):
    meeting_scheduled: bool = Field(description="Was a meeting successfully scheduled and confirmed by the user?")
    time: Optional[str] = Field(description="The confirmed date and time of the meeting in 'YYYY-MM-DDTHH:MM:SS' format. Use today's date if only a time is given.")
    name: Optional[str] = Field(description="The user's full name.")
    email: Optional[str] = Field(description="The user's email address.")

# --- 4. LLM Analysis Chain ---
log_analysis_parser = PydanticOutputParser(pydantic_object=MeetingAnalysis)

log_analysis_prompt = ChatPromptTemplate.from_messages([
    (
        "system",
        "You are an expert log analyst. Your job is to read a call transcript and determine if a meeting was successfully scheduled. "
        "The user MUST have confirmed a specific time and provided at least an email. "
        f"Today's date is {datetime.now().isoformat()}. "
        "If they say 'tomorrow at 2pm', calculate that date. "
        "Respond ONLY with the required JSON object."
        "\n\n{format_instructions}"
    ),
    (
        "human",
        "Here is the call transcript:\n{transcript}\n\n"
        "Please analyze the transcript and extract the meeting details. "
        "If no meeting was confirmed, or if name/email is missing, set 'meeting_scheduled' to false."
    ),
]).partial(format_instructions=log_analysis_parser.get_format_instructions())

log_analysis_chain = log_analysis_prompt | llm | log_analysis_parser
print("--- ✅ Log Analysis Chain Created ---")

# --- 5. Calendly API Function ---
def schedule_calendly_meeting(name: str, email: str, start_time: str) -> Dict[str, Any]:
    """
    Schedules a meeting in Calendly.
    NOTE: This is a simplified example. Calendly's API is complex.
    This function *finds an available slot* near the requested time and books it.
    """
    print(f"--- 📅 Attempting to book Calendly meeting for {email} around {start_time} ---")
    
    headers = {
        "Authorization": f"Bearer {CALENDLY_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # This is a simplified flow. A real app would first check for available slots.
    # For this demo, we'll try to book it directly.
    # We'll create an ISO-8601 end time 30 minutes after the start time
    try:
        start_time_dt = datetime.fromisoformat(start_time)
        end_time_dt = start_time_dt + timedelta(minutes=30)
        end_time = end_time_dt.isoformat()
    except Exception:
        # Fallback if LLM gives a bad time
        start_time_dt = datetime.now() + timedelta(days=1) # Book for tomorrow
        start_time = start_time_dt.isoformat()
        end_time = (start_time_dt + timedelta(minutes=30)).isoformat()

    booking_payload = {
        "event_type": CALENDLY_EVENT_TYPE_URL,
        "invitee": {
            "name": name,
            "email": email
        },
        "start_time": start_time,
        "end_time": end_time,
    }

    try:
        # This is a mock API call for demonstration.
        # The actual Calendly booking API is at 'https://api.calendly.com/scheduled_events'
        # response = requests.post("https://api.calendly.com/scheduled_events", headers=headers, json=booking_payload)
        # response.raise_for_status()
        
        # --- MOCKING THE CALL ---
        print("--- ⚠️ CALENDLY MOCK: Simulating successful booking. ---")
        # In a real app, you would uncomment the 'requests.post' above.
        # We will simulate the response.
        mock_response = {
            "resource": {
                "uri": "https://api.calendly.com/scheduled_events/GBGBD...EXAMPLE",
                "name": "Meeting with " + name,
                "start_time": start_time,
                "end_time": end_time
            }
        }
        # --- END MOCK ---
        
        print("--- ✅ Calendly meeting scheduled successfully. ---")
        return {"status": "scheduled", "details": mock_response}
    
    except Exception as e:
        print(f"--- ❌ CALENDLY ERROR: {e} ---")
        return {"status": "failed", "error": str(e)}

# --- 6. Create the FastAPI App ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Call Log Analysis Server is running."}

@app.post("/call-logs")
async def handle_call_logs(request: CallLogRequest, background_tasks: BackgroundTasks):
    """
    Receives call logs from the frontend, analyzes them, and
    schedules a meeting if one was booked.
    """
    print(f"--- 🪵 Received logs for Call ID: {request.callId} ---")
    
    try:
        # Format the transcript for the LLM
        transcript_msgs = request.logs.get("transcript", [])
        if not transcript_msgs:
            print("--- ⚠️ No transcript found in logs. ---")
            return {"status": "error", "message": "No transcript to analyze."}
            
        transcript_text = "\n".join(
            [f"{msg['role']}: {msg['transcript']}" for msg in transcript_msgs if 'transcript' in msg]
        )
        
        print("--- 🧠 Analyzing transcript... ---")
        # Call the LLM to analyze the transcript
        analysis = await log_analysis_chain.ainvoke({"transcript": transcript_text})
        
        if analysis.meeting_scheduled and analysis.email and analysis.name and analysis.time:
            print("--- ✅ Meeting detected! Booking in background... ---")
            # Schedule the meeting in the background
            background_tasks.add_task(
                schedule_calendly_meeting,
                analysis.name,
                analysis.email,
                analysis.time
            )
            return {"status": "meeting_booking_started", "details": analysis.model_dump()}
        else:
            print("--- ℹ️ No meeting was scheduled in this call. ---")
            return {"status": "no_meeting_detected", "details": analysis.model_dump()}

    except Exception as e:
        print(f"--- ❌ Log Analysis ERROR: {e} ---")
        raise HTTPException(status_code=500, detail="Failed to analyze call logs.")


if __name__ == "__main__":
    print("--- 🚀 Starting Log Analysis Server on http://localhost:8004 ---")
    uvicorn.run(app, host="0.0.0.0", port=8004)