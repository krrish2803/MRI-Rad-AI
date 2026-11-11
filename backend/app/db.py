from datetime import UTC, datetime, timedelta
from functools import lru_cache

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.collection import Collection

from app.config import get_settings


@lru_cache(maxsize=1)
def get_client() -> MongoClient:
    settings = get_settings()
    return MongoClient(
        settings.mongodb_uri,
        serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
        connectTimeoutMS=settings.mongodb_server_selection_timeout_ms,
        appname="MRI-RadAI",
    )


def get_db():
    return get_client()[get_settings().mongodb_database]


def uploads() -> Collection:
    return get_db()["uploads"]


def analyses() -> Collection:
    return get_db()["analyses"]


def feedback() -> Collection:
    return get_db()["feedback"]


def zone_segmentations() -> Collection:
    return get_db()["zone_segmentations"]


def initialize_database() -> None:
    db = get_db()
    db.command("ping")
    db.uploads.create_index(
        [("sha256", ASCENDING), ("sequence_type", ASCENDING)], unique=True
    )
    db.uploads.create_index([("created_at", DESCENDING)])
    db.analyses.create_index([("analysis_id", ASCENDING)], unique=True)
    db.analyses.create_index([("created_at", DESCENDING)])
    db.feedback.create_index([("analysis_id", ASCENDING), ("created_at", DESCENDING)])
    db.zone_segmentations.create_index([("segmentation_id", ASCENDING)], unique=True)
    db.zone_segmentations.create_index([("created_at", DESCENDING)])
    cutoff = datetime.now(UTC) - timedelta(minutes=15)
    db.analyses.update_many(
        {"status": "processing", "started_at": {"$lt": cutoff}},
        {
            "$set": {
                "status": "failed",
                "error_message": "Analysis interrupted by server restart.",
                "completed_at": datetime.now(UTC),
            }
        },
    )


def close_database() -> None:
    if get_client.cache_info().currsize:
        get_client().close()
