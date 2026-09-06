from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.config import settings
from app.services.classifier import classifier_service
from app.api.routes.predict import router as predict_router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("sentinelai.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing SentinelAI AI Microservice...")
    loaded = classifier_service.load_artifacts()
    if loaded:
        logger.info(f"Classifier model loaded successfully (version: {settings.ATTACK_MODEL_VERSION}).")
    else:
        logger.warning("Classifier model could not be loaded at startup.")
    yield
    logger.info("Shutting down SentinelAI AI Microservice...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="SentinelAI Payload Threat Classification & Anomaly Detection Microservice",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Structured Validation Error Handler (422)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for err in exc.errors():
        loc = ".".join(str(l) for l in err.get("loc", []))
        msg = err.get("msg", "Invalid field")
        errors.append({"field": loc, "message": msg})

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Request validation failed",
            "details": errors,
        },
    )


# Structured Generic Exception Handler (500)
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "An unexpected error occurred during AI processing",
        },
    )


# Health check endpoint (compatible with Phase 0 & provides model health)
@app.get("/health", status_code=status.HTTP_200_OK, tags=["System Health"])
def health_check():
    return {
        "status": "ok",
        "modelLoaded": classifier_service.is_loaded(),
        "modelVersion": settings.ATTACK_MODEL_VERSION,
    }


# Include Routers (Available at root /predict and /api/predict for flexibility)
app.include_router(predict_router)
app.include_router(predict_router, prefix="/api")