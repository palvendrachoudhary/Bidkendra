from fastapi import FastAPI, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from app.api import ocr, verification, recommendation
import time

app = FastAPI(
    title="GeM Bid Compliance Verification AI Engine",
    description="AI Engine for document verification, cross-checking, and compliance scoring",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(ocr.router, prefix="/api/ai/ocr", tags=["OCR"])
app.include_router(verification.router, prefix="/api/ai/verify", tags=["Verification"])
app.include_router(recommendation.router, prefix="/api/ai", tags=["AI Recommendation"])

@app.on_event("startup")
async def startup_event():
    """Startup event to load AI models and initialize services."""
    print("Loading AI Models and Services...")
    # Initialize models and services here to load them into memory
    print("AI Engine initialized successfully.")

@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint to verify the service is running."""
    return {"status": "healthy", "service": "GeM AI Engine", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
