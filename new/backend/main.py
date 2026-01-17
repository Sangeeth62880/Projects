from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import test_routes, voice_routes, dashboard_routes

app = FastAPI(
    title="Dyscalculia Pre-Screening API",
    description="AI-powered dyscalculia screening with voice interaction and ML classification",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(test_routes.router, prefix="/api", tags=["Tests"])
app.include_router(voice_routes.router, prefix="/api", tags=["Voice"])
app.include_router(dashboard_routes.router, prefix="/api", tags=["Dashboard"])


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "dyscalculia-api"}


@app.get("/")
async def root():
    return {
        "message": "Dyscalculia Pre-Screening API",
        "docs": "/docs",
        "health": "/health"
    }
