import os
import sys
import asyncio
import uvicorn 
import time 
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
from langgraph.graph import StateGraph, END
from langchain_groq import ChatGroq 
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import PydanticOutputParser
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import pprint
from dotenv import load_dotenv

# --- Imports for Research Agent ---
from langchain_community.document_loaders import WebBaseLoader
from langchain_tavily import TavilySearch
from langchain_core.runnables import RunnableParallel, RunnablePassthrough, RunnableLambda
from langchain_core.output_parsers import StrOutputParser

# --- NEW Imports for Design/BRD Agent ---
import requests
from fpdf import FPDF # <-- NEW IMPORT

load_dotenv()

_grok_key = os.getenv("GROQ_API_KEY")
if _grok_key:
    print("--- 🔐 GROQ_API_KEY loaded from environment/.env ---")
else:
    print("--- ⚠️  GROQ_API_KEY not found. Set GROQ_API_KEY in your environment or .env file. ---")

_tavily_key = os.getenv("TAVILY_API_KEY")
if _tavily_key:
    print("--- 🔐 TAVILY_API_KEY loaded from environment/.env ---")
else:
    print("--- ⚠️  TAVILY_API_KEY not found. Set TAVILY_API_KEY in your environment or .env file. ---")

_unsplash_key = os.getenv("UNSPLASH_ACCESS_KEY")
if _unsplash_key:
    print("--- 🔐 UNSPLASH_ACCESS_KEY loaded from environment/.env ---")
else:
    print("--- ⚠️  UNSPLASH_ACCESS_KEY not found. Set UNSPLASH_ACCESS_KEY in your environment or .env file. ---")


llm = ChatGroq(model_name="llama-3.1-8b-instant", temperature=0)
print(f"--- 🤖 Groq LLM Initialized (llama-3.1-8b-instant) ---") 

class EmailStep(BaseModel):
    """A single email in the nurture sequence"""
    subject: str = Field(description="The subject line of the email")
    body_markdown: str = Field(description="The markdown content of the email")
    send_delay_days: int = Field(description="Days to wait before sending (0=immediate)")

class SocialPost(BaseModel):
    """A single social media post"""
    platform: str = Field(description="e.g., 'LinkedIn', 'X (Twitter)'")
    content: str = Field(description="The text content of the post")
    image_prompt: str = Field(description="A simple search keyword for a stock photo (e.g., 'tech', 'code', 'team')")

class BrandKit(BaseModel):
    """The visual identity for the campaign"""
    logo_prompt: str = Field(description="A DALL-E prompt for a minimalist logo")
    color_palette: List[str] = Field(description="List of 5 hex color codes")
    font_pair: str = Field(description="e.g., 'Inter and Roboto'")

class CampaignState(BaseModel):
    """
    The main state object passed between all agents.
    """
    
    # --- 1. Filled by Planner_Agent ---
    initial_prompt: str = Field(description="The user's first natural language prompt")
    goal: Optional[str] = None
    topic: Optional[str] = None
    target_audience: Optional[str] = None
    source_docs_url: Optional[str] = None
    campaign_date: Optional[datetime] = None

    # --- 2. Filled by Research_Agent ---
    audience_persona: Optional[Dict[str, str]] = None
    core_messaging: Optional[Dict[str, str]] = None

    # --- 3. Filled by Content_Agent ---
    webinar_details: Optional[Dict[str, str]] = None # {title, abstract}
    webinar_image_prompt: Optional[str] = None # The prompt for the landing page banner
    blog_post: Optional[str] = None
    email_sequence: List[EmailStep] = []
    social_posts: List[SocialPost] = []

    # --- 4. Filled by Design_Agent ---
    brand_kit: Optional[BrandKit] = None
    generated_assets: Dict[str, str] = {} # e.g., {"logo_url": "...", "webinar_banner_url": "..."}

    # --- 5. Filled by Web_Agent ---
    landing_page_code: Optional[str] = None
    landing_page_url: Optional[str] = None
    
    # --- 6. Filled by BRD_Agent ---
    brd_url: Optional[str] = None
    
    # --- 7. Filled by Strategy_Agent (MODIFIED) ---
    strategy_markdown: Optional[str] = None # <-- CHANGED
    
    # --- 8. Filled by Ops_Agent ---
    automation_status: Dict[str, str] = {}
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        arbitrary_types_allowed = True

# --- 3. AGENT LOGIC (LCEL Chains) ---

# --- 3.1: PLANNER AGENT SCHEMA & CHAIN ---
class PlannerOutput(BaseModel):
    goal: str = Field(description="The primary objective, e.g., 'Launch a webinar', 'Promote a whitepaper'.")
    topic: str = Field(description="The main subject or product feature, e.g., 'Agentic-Fix'.")
    target_audience: str = Field(description="The specific user persona, e.g., 'VPs of Engineering'.")
    source_docs_url: Optional[str] = Field(description="The URL (e.g., Notion) containing the source content, if provided.")
    campaign_date: Optional[datetime] = Field(description="The target date for the campaign, in YYYY-MM-DD format. Infer from context. If not mentioned, leave as null.")

planner_parser = PydanticOutputParser(pydantic_object=PlannerOutput)
planner_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are an expert parsing assistant. You are part of an automated workflow and your "
            "output will be programmatically parsed. Your *only* job is to parse a user's unstructured "
            "campaign brief into a structured JSON object. "
            "Today's date is " + str(datetime.now().date()) +
            "\n\n{format_instructions}\n\n"
            "IMPORTANT: Your response MUST be ONLY the JSON object, with no other text, "
            "markdown, or commentary before or after the JSON. The JSON must be the only "
            "thing in your response."
        ),
        (
            "human", 
            "Parse the following campaign brief:\n\n{brief}"
        ),
    ]
).partial(format_instructions=planner_parser.get_format_instructions())
planner_chain = planner_prompt | llm | planner_parser
print("--- 📋 Planner Agent LCEL Chain Compiled ---")


# --- 3.2: RESEARCH AGENT SCHEMA & CHAIN (Simplified) ---
class ResearchOutput(BaseModel):
    audience_persona: Dict[str, str] = Field(description="A 3-key dictionary describing the target audience, with keys 'pain_point', 'motivation', and 'preferred_channel'.")
    core_messaging: Dict[str, str] = Field(description="A 3-key dictionary for the marketing strategy, with keys 'value_proposition', 'tone_of_voice', and 'call_to_action'.")

research_parser = PydanticOutputParser(pydantic_object=ResearchOutput)
tavily_tool = TavilySearch(max_results=3) 
research_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a world-class marketing strategist. Your job is to synthesize "
            "product information and audience research into a clear marketing strategy. "
            "Respond ONLY with the required JSON object, with no other text."
            "\n\n{format_instructions}"
        ),
        (
            "human",
            "--- PRODUCT CONTEXT ---\n"
            "{scraped_content}\n\n" 
            "--- AUDIENCE RESEARCH ---\n"
            "Topic: {topic}, Audience: {target_audience}\n"
            "Research Results:\n{search_results}\n\n"
            "--- SYNTHESIS ---"
            "Based on all this info, generate the **audience_persona** and **core_messaging**."
        ),
    ]
).partial(format_instructions=research_parser.get_format_instructions())
research_search_only_chain = (
    RunnablePassthrough.assign(
        scraped_content=lambda x: "No document provided.", # Default content
        search_results=lambda x: tavily_tool.invoke(f"common pain points for {x['target_audience']} related to {x['topic']}")
    )
    | research_prompt
    | llm
    | research_parser
)
print("--- 🧠 Research Agent LCEL Chain Compiled (Search-Only) ---")


# --- 3.3: CONTENT AGENT SCHEMA & CHAIN (MODIFIED) ---
class WebinarDetails(BaseModel):
    """Details for the campaign's webinar"""
    title: str = Field(description="The catchy, professional title of the webinar")
    abstract: str = Field(description="A 2-3 sentence abstract for the webinar landing page.")
class ContentAgentOutput(BaseModel):
    """The creative content for the campaign"""
    webinar_details: WebinarDetails
    social_posts: List[SocialPost] = Field(description="A list of 2 social media posts for the campaign (1 Instagram, 1 X/Twitter).")
    webinar_image_prompt: str = Field(description="A stock photo search query for the main webinar banner.")
content_parser = PydanticOutputParser(pydantic_object=ContentAgentOutput)
content_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a world-class marketing copywriter... "
            "For the 'image_prompt', create a simple, effective search keyword for a stock photo... "
            "Respond ONLY with the required JSON object, with no other text."
            "\n\n{format_instructions}"
        ),
        (
            "human",
            "--- CAMPAIGN CONTEXT ---"
            "\nGoal: {goal}"
            "\nTopic: {topic}"
            "\nTarget Audience: {target_audience}"
            "\nAudience Persona: {persona}"
            "\nCore Messaging: {messaging}"
            "\n\n--- TASK ---"
            "\nGenerate the following content based on the context provided:"
            "\n1. Webinar Details: A catchy title and a 2-3 sentence abstract."
            "\n2. Social Posts: A list of *exactly 2* social media posts..."
            "\n3. Webinar Image Prompt: A simple stock photo search query for the main webinar banner..."
        ),
    ]
).partial(format_instructions=content_parser.get_format_instructions())
content_chain = content_prompt | llm | content_parser
print("--- ✍️  Content Agent LCEL Chain Compiled ---")


# --- 3.4: DESIGN AGENT (Using Unsplash) ---
UNSPLASH_API_URL = "https://api.unsplash.com/search/photos"
UNSPLASH_HEADERS = {"Authorization": f"Client-ID {_unsplash_key}"}
def get_unsplash_image(search_query: str) -> str:
    print(f"--- 🎨 Querying Unsplash for: '{search_query}' ---")
    params = {"query": search_query, "per_page": 1, "orientation": "landscape"}
    try:
        response = requests.get(UNSPLASH_API_URL, headers=UNSPLASH_HEADERS, params=params, timeout=10)
        response.raise_for_status() 
        data = response.json()
        if data["results"]:
            image_url = data["results"][0]["urls"]["regular"]
            print(f"--- 🎨 Found image URL: {image_url[:50]}... ---")
            return image_url
        else:
            print(f"--- ⚠️ Unsplash found no results for '{search_query}', using placeholder. ---")
            return f"https://placehold.co/800x400/CCCCCC/FFFFFF?text=No+Image+For+{search_query.replace(' ', '+')}"
    except Exception as e:
        print(f"--- ❌ ERROR: Unsplash API failed: {e} ---")
        return "https_://placehold.co/800x400/FF0000/FFFFFF?text=Error"


# --- 3.5: WEB AGENT (MODIFIED) ---
web_agent_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a world-class UI/UX designer and frontend developer... "
            "You have complete creative freedom... "
            "You MUST use inline CSS for all styling (inside a `<style>` tag in the `<head>`). "
            "Your response MUST be ONLY the complete HTML code..."
        ),
        (
            "human",
            "Please generate the HTML for a promotional landing page... "
            "\n\n--- CAMPAIGN STRATEGY ---"
            "\n- Topic: {topic}"
            "\n- Audience Persona: {audience_persona}"
            "\n- Core Messaging: {core_messaging}"
            "\n\n--- BRAND ASSETS ---"
            "\n- All Available Images: {generated_assets}"
            "\n\n--- REQUIREMENTS ---"
            "\n1. Create a beautiful, multi-section page including: a Hero (using the 'webinar_banner_url'), a 'Problem' section (based on pain_point), a 'Solution' section (introducing the topic), and a 'Who Is This For' section."
            "\n2. Use the *other* images (e.g., 'post_1_image_url') in the other sections or in a small gallery to make the page more visually appealing."
            "\n3. This is a promotional-only website. It must *not* have any buttons, 'Sign Up' forms, input fields, or 'mailto:' links."
        ),
    ]
)
web_agent_chain = web_agent_prompt | llm | StrOutputParser()
print("--- 🕸️  Web Agent LCEL Chain Compiled ---")


# --- 3.6: BRD AGENT (NEW) ---
brd_agent_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a Senior Product Manager. Your job is to generate a complete Business Requirements Document (BRD) "
            "for a new product based on the initial research. The document must be well-structured and formatted as a "
            "single Markdown string. Use clear headings, bullet points, and numbered lists. "
            "Your response MUST be ONLY the Markdown text, starting with '# Business Requirements Document'."
        ),
        (
            "human",
            "Please generate a complete BRD in Markdown format for the following product:"
            "\n\n--- INITIAL RESEARCH ---"
            "\n- Product Topic: {topic}"
            "\n- Campaign Goal: {goal}"
            "\n- Audience Persona: {audience_persona}"
            "\n- Core Messaging: {core_messaging}"
            "\n\n--- BRD TEMPLATE TO FILL ---"
            "\n# Business Requirements Document: {topic}"
            "\n\n## 1. Project Overview"
            "\n### 1.1. Introduction"
            "\n(Write a brief summary of the project.)"
            "\n### 1.2. Business Objectives"
            "\n(List 3-5 key business goals. Use the 'Campaign Goal' as a starting point.)"
            "\n"
            "\n## 2. Target Audience"
            "\n### 2.1. Primary Persona"
            "\n(Describe the target user based on the 'Audience Persona'.)"
            "\n### 2.2. Key Problems (Pain Points)"
            "\n(List the problems this product solves, based on 'pain_point'.)"
            "\n"
            "\n## 3. Proposed Solution"
            "\n### 3.1. Solution Overview"
            "\n(Describe how the product solves the audience's problems. Use the 'value_proposition'.)"
            "\n### 3.2. Key Features (Functional Requirements)"
            "\n(List 5-7 key features for this product.)"
            "\n"
            "\n## 4. User Stories"
            "\n(Write 3-5 user stories in the format: 'As a [persona], I want to [action] so that [benefit]'.)"
            "\n"
            "\n## 5. Success Metrics"
            "\n(List 3-5 KPIs to measure success, related to the 'Business Objectives'.)"
        ),
    ]
)
brd_agent_chain = brd_agent_prompt | llm | StrOutputParser()
print("--- 📄 BRD Agent LCEL Chain Compiled ---")


# --- 3.7: STRATEGY AGENT (NEW) ---
strategy_agent_prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a Chief Strategist. Your job is to generate a high-level strategic plan. "
            "The output must be a single Markdown string. Use clear headings and bullet points. "
            "Your response MUST be ONLY the Markdown text, starting with '# Strategic Approach'."
        ),
        (
            "human",
            "Please generate a strategic approach for the following goal. Break it down into 3-5 key phases or points. "
            "For each point, provide a brief description of *how* to approach it."
            "\n\n- **Project Topic:** {topic}"
            "\n- **Primary Goal:** {goal}"
        ),
    ]
)
strategy_agent_chain = strategy_agent_prompt | llm | StrOutputParser()
print("--- 📈 Strategy Agent LCEL Chain Compiled ---")


# --- 4. AGENT "WORKSTATIONS" (The Nodes) ---

# --- NEW PDF HELPER FUNCTION ---
def save_markdown_as_pdf(markdown_text: str, filename: str) -> str:
    """
    Converts a Markdown string to a PDF file using fpdf2.
    """
    try:
        pdf = FPDF()
        pdf.add_page()
        
        if os.path.exists("DejaVuSans.ttf"):
            pdf.add_font('DejaVu', '', 'DejaVuSans.ttf', uni=True)
            pdf.set_font('DejaVu', size=12)
        else:
            print("--- ⚠️ Font 'DejaVuSans.ttf' not found. Using 'Arial'. Special characters may not render. ---")
            print("--- ⚠️ Download it from https://github.com/dejavu-fonts/dejavu-fonts/blob/master/ttf/DejaVuSans.ttf?raw=true ---")
            pdf.set_font("Arial", size=12)
        
        pdf.multi_cell(0, 5, markdown_text, markdown=True)
        
        pdf.output(filename)
        print(f"--- 📄 PDF saved as: {filename} ---")
        return filename
    except Exception as e:
        print(f"--- ❌ ERROR saving PDF: {e} ---")
        return "error_saving_pdf.pdf"

def planner_agent_node(state: CampaignState) -> dict:
    print("--- 1. 📋 Calling Planner Agent (REAL) ---")
    brief = state.initial_prompt
    try:
        planner_output: PlannerOutput = planner_chain.invoke({"brief": brief})
        return planner_output.model_dump()
    except Exception as e:
        print(f"--- ❌ ERROR in Planner Agent: {e} ---")
        return {}

def research_agent_node(state: CampaignState) -> dict:
    print("--- 2. 🧠 Calling Research Agent (REAL) ---")
    inputs = {"topic": state.topic, "target_audience": state.target_audience}
    try:
        if state.source_docs_url:
            print(f"--- ⚠️ source_docs_url provided, but IGNORING IT to avoid token limits. ---")
        print("--- 🔎 Running search-only research chain... ---")
        research_output: ResearchOutput = research_search_only_chain.invoke(inputs)
        return research_output.model_dump()
    except Exception as e:
        print(f"--- ❌ ERROR in Research Agent: {e} ---")
        pprint.pprint(e) 
        return {} 

def content_agent_node(state: CampaignState) -> dict:
    print("--- 4. ✍️ Calling Content Agent (REAL) ---")
    try:
        inputs = {
            "goal": state.goal,
            "topic": state.topic,
            "target_audience": state.target_audience,
            "persona": state.audience_persona,
            "messaging": state.core_messaging,
        }
        content_output: ContentAgentOutput = content_chain.invoke(inputs)
        return content_output.model_dump()
    except Exception as e:
        print(f"--- ❌ ERROR in Content Agent: {e} ---")
        pprint.pprint(e)
        return {}

def design_agent_node(state: CampaignState) -> dict:
    print("--- 5. 🎨 Calling Design Agent (REAL) ---")
    
    mock_brand_kit = BrandKit(
        logo_prompt=f"A minimalist, tech-inspired logo for {state.topic}",
        color_palette=["#0A0A0A", "#FFFFFF", "#4F46E5", "#FBBF24", "#10B981"], # Dark, White, Blue, Yellow, Green
        font_pair="Inter" # Using a single modern font
    )
    
    generated_assets = {}
    
    print("--- 🎨 Generating Webinar Banner... ---")
    generated_assets["webinar_banner_url"] = get_unsplash_image(state.webinar_image_prompt)
    
    for i, post in enumerate(state.social_posts):
        print(f"--- 🎨 Generating image for social post {i+1} ({post.platform})... ---")
        image_url = get_unsplash_image(post.image_prompt)
        generated_assets[f"post_{i+1}_image_url"] = image_url

    print("--- ✅ Design Agent finished ---")
    
    return {
        "brand_kit": mock_brand_kit,
        "generated_assets": generated_assets
    }

def web_agent_node(state: CampaignState) -> dict:
    print("--- 6. 🕸️ Calling Web Agent (REAL) ---")
    
    try:
        inputs = {
            "topic": state.topic,
            "audience_persona": state.audience_persona,
            "core_messaging": state.core_messaging,
            "generated_assets": state.generated_assets
        }
        
        print("--- 🕸️ Generating HTML code based on research (full autonomy)... ---")
        html_code = web_agent_chain.invoke(inputs)
        
        return {
            "landing_page_code": html_code,
            "landing_page_url": "campaign_preview.html"
        }

    except Exception as e:
        print(f"--- ❌ ERROR in Web Agent: {e} ---")
        pprint.pprint(e)
        return {}

# --- NEW AGENT NODE (BRD) ---
def brd_agent_node(state: CampaignState) -> dict:
    print("--- 7. 📄 Calling BRD Agent (REAL) ---")
    try:
        inputs = {
            "topic": state.topic,
            "goal": state.goal,
            "audience_persona": state.audience_persona,
            "core_messaging": state.core_messaging,
        }
        print("--- 📄 Generating BRD Markdown... ---")
        brd_markdown = brd_agent_chain.invoke(inputs)
        
        # Create a directory for outputs if it doesn't exist
        output_dir = "campaign_outputs"
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        filename = f"{output_dir}/{state.topic.lower().replace(' ', '_')}_brd.pdf"
        pdf_path = save_markdown_as_pdf(brd_markdown, filename)
        
        return {"brd_url": pdf_path}

    except Exception as e:
        print(f"--- ❌ ERROR in BRD Agent: {e} ---")
        pprint.pprint(e)
        return {}

# --- MODIFIED STRATEGY AGENT ---
def strategy_agent_node(state: CampaignState) -> dict:
    print("--- 3. 📈 Calling Strategy Agent (REAL) ---")
    try:
        inputs = {
            "topic": state.topic,
            "goal": state.goal,
        }
        print("--- 📈 Generating Strategy Markdown... ---")
        strategy_markdown = strategy_agent_chain.invoke(inputs)
        
        # --- NO PDF CONVERSION ---
        
        return {"strategy_markdown": strategy_markdown} # <-- Save the raw text

    except Exception as e:
        print(f"--- ❌ ERROR in Strategy Agent: {e} ---")
        pprint.pprint(e)
        return {}


def ops_agent_node(state: CampaignState) -> dict:
    print("--- 6. ⚙️ Ops Agent (Telegram) Started ---")

    BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

    if not BOT_TOKEN or not CHAT_ID:
        print("--- ❌ ERROR: Telegram credentials missing in .env ---")
        return {"automation_status": {"error": "Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID"}}

    results = []

    # Loop through each social post generated by Content Agent
    for i, post in enumerate(state.social_posts):

        text = post.content.strip()
        image_key = f"post_{i+1}_image_url"
        image_url = state.generated_assets.get(image_key)

        try:
            # --- CASE 1: Send Image + Caption ---
            if image_url:
                print(f"📤 Sending image post {i+1} to Telegram...")
                resp = requests.post(
                    f"https://api.telegram.org/bot{BOT_TOKEN}/sendPhoto",
                    data={
                        "chat_id": CHAT_ID,
                        "photo": image_url,
                        "caption": text
                    },
                    timeout=10
                ).json()

            # --- CASE 2: Send Text Message Only ---
            else:
                print(f"📤 Sending text-only post {i+1} to Telegram...")
                resp = requests.post(
                    f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                    data={
                        "chat_id": CHAT_ID,
                        "text": text
                    },
                    timeout=10
                ).json()

            results.append({"post_number": i + 1, "response": resp})

        except Exception as e:
            print(f"--- ❌ ERROR sending post {i+1}: {e} ---")
            results.append({"post_number": i + 1, "error": str(e)})

    print("--- 6. ⚙️ Ops Agent Completed ---")

    return {
        "automation_status": {
            "telegram_post_results": results,
            "status": "completed"
        }
    }


# --- 5. LANGGRAPH "FACTORY FLOOR" (The Graph) ---

graph_builder = StateGraph(CampaignState)

# Add all nodes
graph_builder.add_node("planner_agent", planner_agent_node)
graph_builder.add_node("research_agent", research_agent_node)
graph_builder.add_node("content_agent", content_agent_node)
graph_builder.add_node("design_agent", design_agent_node)
graph_builder.add_node("web_agent", web_agent_node)
graph_builder.add_node("brd_agent", brd_agent_node) 
graph_builder.add_node("strategy_agent", strategy_agent_node) # <-- Name is the same
graph_builder.add_node("ops_agent", ops_agent_node)

# Add all edges (sequential flow)
graph_builder.set_entry_point("planner_agent")
graph_builder.add_edge("planner_agent", "research_agent")
graph_builder.add_edge("research_agent", "strategy_agent")  # Strategy runs right after research
graph_builder.add_edge("strategy_agent", "content_agent")
graph_builder.add_edge("content_agent", "design_agent")
graph_builder.add_edge("design_agent", "web_agent")
graph_builder.add_edge("web_agent", "brd_agent") 
graph_builder.add_edge("brd_agent", "ops_agent") 
graph_builder.add_edge("ops_agent", END)


# Compile the graph
print("--- 🏭 Compiling AI Campaign Foundry Graph (Sequential) ---")
sys.setrecursionlimit(200) 
foundry_app = graph_builder.compile()
print("--- ✅ Foundry Graph Compiled ---")


# --- 6. FASTAPI SERVER (The Streaming Endpoint) ---

from fastapi.responses import FileResponse

app = FastAPI()

class StreamRequest(BaseModel):
    initial_prompt: str

@app.websocket("/ws_stream_campaign")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("--- 🔌 WebSocket Connection Accepted ---")
    try:
        json_data = await websocket.receive_json()
        request_data = StreamRequest(**json_data)
        
        initial_input = {"initial_prompt": request_data.initial_prompt}
        
        current_state_dict = initial_input.copy()
        
        print(f"--- 🚀 Received input, starting stream... ---")
        
        async for s in foundry_app.astream(initial_input):
            node_that_ran = list(s.keys())[0]
            state_snapshot_diff = s[node_that_ran] # This is a dict
            
            if state_snapshot_diff:
                for key, value in state_snapshot_diff.items():
                    if isinstance(value, list) and key in current_state_dict:
                        current_state_dict[key].extend(value)
                    elif isinstance(value, dict) and key in current_state_dict:
                        current_state_dict[key].update(value)
                    else:
                        current_state_dict[key] = value
            
            state_json = CampaignState.model_validate(current_state_dict).model_dump_json(indent=2)
            
            await websocket.send_json({
                "event": "step",
                "node": node_that_ran,
                "data": state_json
            })
            
        await websocket.send_json({"event": "done"})
        print("--- ✨ Stream Complete ---")
        
        await websocket.close()

    except WebSocketDisconnect:
        print("--- 🔌 WebSocket Disconnected ---")
    
    except Exception as e:
        print(f"--- ❌ WebSocket Error: {e} ---")
        try:
            await websocket.send_json({"event": "error", "data": str(e)})
        except Exception:
            pass 
        
        try:
            await websocket.close()
        except Exception:
            pass 
    
    finally:
        pass


@app.get("/")
async def root():
    return {"message": "AI Campaign Foundry Server is running. Connect via WebSocket."}

@app.get("/download_brd/{filename}")
async def download_brd(filename: str):
    """Serve BRD PDF files for download"""
    file_path = os.path.join("campaign_outputs", filename)
    
    if not os.path.exists(file_path):
        return {"error": "File not found"}
    
    return FileResponse(
        path=file_path,
        media_type='application/pdf',
        filename=filename,
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )

if __name__ == "__main__":
    print("--- 🚀 Starting FastAPI server on http://localhost:8000 ---")
    uvicorn.run(app, host="localhost", port=8000)