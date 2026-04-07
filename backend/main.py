"""
ParakhAI Backend - Exercise Form Analysis API

A FastAPI server that analyzes exercise videos for form and rep counting
using TensorFlow MoveNet pose detection.

Usage:
    python main.py

The server will start on http://0.0.0.0:9000

API Endpoints:
    GET  /                      - Server status
    GET  /health                - Health check
    POST /api/v1/analyze/video  - Analyze exercise video
    GET  /api/v1/exercises      - List available exercises
"""
import os
import sys

# Suppress TensorFlow warnings
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router as api_router
from app.core.config import settings


def create_app() -> FastAPI:
    """Create and configure the FastAPI application."""
    
    application = FastAPI(
        title="ParakhAI",
        description="Exercise Form Analysis API",
        version="1.0.0",
    )
    
    # CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include API routes
    application.include_router(api_router)
    
    # Root endpoint
    @application.get("/")
    async def root():
        return {
            "name": "ParakhAI",
            "version": "1.0.0",
            "status": "running",
            "docs": "/docs",
        }
    
    # Health check
    @application.get("/health")
    async def health():
        return {"status": "healthy"}
    
    return application


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║                      ParakhAI Backend                      ║
║                Exercise Form Analysis API                  ║
╠═══════════════════════════════════════════════════════════╣
║  Server:  http://{settings.HOST}:{settings.PORT}                          ║
║  Docs:    http://localhost:{settings.PORT}/docs                     ║
╚═══════════════════════════════════════════════════════════╝
""")
    
    uvicorn.run(
        app, 
        host=settings.HOST, 
        port=settings.PORT,
        log_level="info"
    )
