import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import router
from app.config import get_settings
from app.db import close_database, initialize_database

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s"
)
logger = logging.getLogger("mriradai")


@asynccontextmanager
async def lifespan(app: FastAPI):
    if get_settings().app_env.lower() == "prod":
        raise RuntimeError(
            "Production mode is disabled until authentication, access control, and privacy controls are implemented."
        )
    try:
        initialize_database()
        if not get_settings().nvidia_api_key:
            logger.warning(
                "NVIDIA_API_KEY is not configured; image analysis requests will return 503"
            )
    except Exception:
        logger.exception("MongoDB startup check failed")
    yield
    close_database()


app = FastAPI(
    title="MRI-RadAI Research Prototype API", version="1.0.0", lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_error_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {"code": f"http_{exc.status_code}", "message": str(exc.detail)}
        },
    )


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request: Request, exc: RequestValidationError):
    details = [
        {"loc": error.get("loc"), "msg": error.get("msg"), "type": error.get("type")}
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=422,
        content=jsonable_encoder(
            {
                "error": {
                    "code": "validation_error",
                    "message": "Request validation failed.",
                    "details": details,
                }
            }
        ),
    )


@app.exception_handler(Exception)
async def generic_error_handler(request: Request, exc: Exception):
    logger.exception("Unhandled request error")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_error",
                "message": "The request could not be completed.",
            }
        },
    )


app.include_router(router)
