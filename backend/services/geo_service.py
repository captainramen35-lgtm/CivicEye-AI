import math
from datetime import datetime
from typing import Optional


EARTH_RADIUS_M = 6371000  # metres


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Return distance in metres between two GPS points."""
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return EARTH_RADIUS_M * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def build_geo_query_bounds(lat: float, lng: float, radius_m: float = 150):
    """
    Return approximate bounding box for a radius around a point.
    Good enough for Firestore range queries (exact distance checked separately).
    """
    delta_lat = radius_m / EARTH_RADIUS_M * (180 / math.pi)
    delta_lng = radius_m / (EARTH_RADIUS_M * math.cos(math.radians(lat))) * (180 / math.pi)
    return {
        "min_lat": lat - delta_lat,
        "max_lat": lat + delta_lat,
        "min_lng": lng - delta_lng,
        "max_lng": lng + delta_lng,
    }
