import os
import json
import logging

logger = logging.getLogger(__name__)

# --- Mock Firestore and Storage implementation for local preview ---
class MockDocument:
    def __init__(self, doc_id, data=None, exists=True):
        self.id = doc_id
        self._data = data or {}
        self.exists = exists

    def to_dict(self):
        return self._data

class MockDocumentRef:
    def __init__(self, collection, doc_id):
        self.collection = collection
        self.id = doc_id

    def get(self):
        data = self.collection.store.get(self.id)
        if data is None:
            return MockDocument(self.id, exists=False)
        return MockDocument(self.id, data=data, exists=True)

    def set(self, data, merge=False):
        if merge and self.id in self.collection.store:
            self.collection.store[self.id].update(data)
        else:
            self.collection.store[self.id] = data
        if hasattr(self.collection, "client") and self.collection.client:
            self.collection.client._save()

    def update(self, data):
        if self.id in self.collection.store:
            self.collection.store[self.id].update(data)
            if hasattr(self.collection, "client") and self.collection.client:
                self.collection.client._save()

class MockQuery:
    def __init__(self, collection):
        self.collection = collection
        self.filters = []
        self._limit = None
        self._order_by_field = None
        self._order_by_direction = "ASCENDING"

    def where(self, field, op, value):
        self.filters.append((field, op, value))
        return self

    def limit(self, val):
        self._limit = val
        return self

    def order_by(self, field, direction="ASCENDING"):
        self._order_by_field = field
        self._order_by_direction = direction
        return self

    def stream(self):
        results = []
        for doc_id, data in self.collection.store.items():
            match = True
            for field, op, val in self.filters:
                item_val = data.get(field)
                if op == "==":
                    if item_val != val:
                        match = False
                        break
                elif op == "in":
                    if item_val not in val:
                        match = False
                        break
                elif op == ">=":
                    if item_val is None or item_val < val:
                        match = False
                        break
                elif op == "<=":
                    if item_val is None or item_val > val:
                        match = False
                        break
                elif op == ">":
                    if item_val is None or item_val <= val:
                        match = False
                        break
                elif op == "<":
                    if item_val is None or item_val >= val:
                        match = False
                        break
            if match:
                results.append(MockDocument(doc_id, data=data))

        # Sort if order_by is set
        if self._order_by_field:
            reverse = (self._order_by_direction == "DESCENDING")
            results.sort(key=lambda doc: doc.to_dict().get(self._order_by_field, 0), reverse=reverse)

        if self._limit:
            results = results[:self._limit]
        return results

class MockCollectionRef:
    def __init__(self, name, store, client=None):
        self.name = name
        self.store = store
        self.client = client

    def document(self, doc_id):
        return MockDocumentRef(self, doc_id)

    def where(self, field, op, value):
        return MockQuery(self).where(field, op, value)

    def limit(self, val):
        return MockQuery(self).limit(val)

    def order_by(self, field, direction="ASCENDING"):
        return MockQuery(self).order_by(field, direction)

    def stream(self):
        return MockQuery(self).stream()

    def list_documents(self):
        return [self.document(doc_id) for doc_id in self.store.keys()]

class MockFirestoreClient:
    def __init__(self):
        self.stores = {
            "users": {
                "user_1": {
                    "uid": "user_1",
                    "email": "aarav@civiceye.ai",
                    "displayName": "Aarav Mehta",
                    "report_count": 8,
                    "verification_count": 4,
                    "trust_score": 0.95,
                    "created_at": "2026-06-01T12:00:00Z"
                },
                "user_2": {
                    "uid": "user_2",
                    "email": "priya@civiceye.ai",
                    "displayName": "Priya Sharma",
                    "report_count": 5,
                    "verification_count": 3,
                    "trust_score": 0.88,
                    "created_at": "2026-06-05T10:30:00Z"
                },
                "user_3": {
                    "uid": "user_3",
                    "email": "amit@civiceye.ai",
                    "displayName": "Amit Patel",
                    "report_count": 3,
                    "verification_count": 2,
                    "trust_score": 0.80,
                    "created_at": "2026-06-10T08:15:00Z"
                },
                "user_4": {
                    "uid": "user_4",
                    "email": "rohan@civiceye.ai",
                    "displayName": "Rohan Das",
                    "report_count": 2,
                    "verification_count": 1,
                    "trust_score": 0.70,
                    "created_at": "2026-06-12T14:20:00Z"
                },
                "user_5": {
                    "uid": "user_5",
                    "email": "sneha@civiceye.ai",
                    "displayName": "Sneha Reddy",
                    "report_count": 1,
                    "verification_count": 1,
                    "trust_score": 0.60,
                    "created_at": "2026-06-15T11:00:00Z"
                }
            },
            "badges": {
                "badge_1": {
                    "id": "badge_1",
                    "user_id": "user_1",
                    "badge_type": "Community Hero",
                    "awarded_at": "2026-06-05T12:00:00Z"
                },
                "badge_2": {
                    "id": "badge_2",
                    "user_id": "user_2",
                    "badge_type": "Civic Contributor",
                    "awarded_at": "2026-06-08T10:30:00Z"
                },
                "badge_3": {
                    "id": "badge_3",
                    "user_id": "user_3",
                    "badge_type": "Civic Contributor",
                    "awarded_at": "2026-06-12T08:15:00Z"
                },
                "badge_4": {
                    "id": "badge_4",
                    "user_id": "user_4",
                    "badge_type": "Community Reporter",
                    "awarded_at": "2026-06-13T14:20:00Z"
                },
                "badge_5": {
                    "id": "badge_5",
                    "user_id": "user_5",
                    "badge_type": "Community Reporter",
                    "awarded_at": "2026-06-16T11:00:00Z"
                }
            },
            "issues": {
                "issue_1": {
                    "id": "issue_1",
                    "photo_url": "https://images.unsplash.com/photo-1597200381847-30ec200eeb9a?auto=format&fit=crop&q=80&w=800",
                    "issue_type": "Severe Pothole near Metro Station",
                    "severity": "high",
                    "risk_notes": "Deep pothole blocking left lane. High risk of accidents for two-wheelers at night.",
                    "department": "BBMP Roads & Infrastructure",
                    "category": "Road Damage",
                    "status": "assigned",
                    "lat": 12.9716,
                    "lng": 77.5946,
                    "address": "MG Road, near Metro Station, Bengaluru",
                    "priority_score": 85.0,
                    "verification_count": 8,
                    "reporter_id": "user_1",
                    "description": "Large pothole that needs immediate patching.",
                    "created_at": "2026-06-20T10:00:00Z",
                    "updated_at": "2026-06-21T12:00:00Z",
                    "status_history": [
                        {
                            "status": "reported",
                            "timestamp": "2026-06-20T10:00:00Z",
                            "actor": "user_1",
                            "note": "Issue reported by citizen"
                        },
                        {
                            "status": "assigned",
                            "timestamp": "2026-06-21T12:00:00Z",
                            "actor": "authority_1",
                            "note": "Assigned to Ward Engineer"
                        }
                    ]
                },
                "issue_2": {
                    "id": "issue_2",
                    "photo_url": "https://images.unsplash.com/photo-1542060748-10c28b629f6f?auto=format&fit=crop&q=80&w=800",
                    "issue_type": "Water Leakage on 12th Main",
                    "severity": "medium",
                    "risk_notes": "Clean drinking water wasting for 3 days. Road surface starting to erode.",
                    "department": "Bangalore Water Supply Board",
                    "category": "Water Leakage",
                    "status": "reported",
                    "lat": 12.9784,
                    "lng": 77.6408,
                    "address": "12th Main Rd, Indiranagar, Bengaluru",
                    "priority_score": 63.0,
                    "verification_count": 5,
                    "reporter_id": "user_2",
                    "description": "Water pipe leak on the footpath.",
                    "created_at": "2026-06-21T08:30:00Z",
                    "updated_at": "2026-06-21T08:30:00Z",
                    "status_history": [
                        {
                            "status": "reported",
                            "timestamp": "2026-06-21T08:30:00Z",
                            "actor": "user_2",
                            "note": "Issue reported by citizen"
                        }
                    ]
                },
                "issue_3": {
                    "id": "issue_3",
                    "photo_url": "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800",
                    "issue_type": "Overflowing Garbage Dumpster",
                    "severity": "high",
                    "risk_notes": "Garbage spilling onto road, causing bad odor and health hazard for nearby residents.",
                    "department": "BBMP Sanitation Board",
                    "category": "Waste Management",
                    "status": "in_progress",
                    "lat": 12.9352,
                    "lng": 77.6245,
                    "address": "Koramangala 3rd Block, Bengaluru",
                    "priority_score": 92.0,
                    "verification_count": 12,
                    "reporter_id": "user_3",
                    "description": "Commercial waste dumped on the street corner.",
                    "created_at": "2026-06-19T14:15:00Z",
                    "updated_at": "2026-06-20T16:00:00Z",
                    "status_history": [
                        {
                            "status": "reported",
                            "timestamp": "2026-06-19T14:15:00Z",
                            "actor": "user_3",
                            "note": "Issue reported by citizen"
                        },
                        {
                            "status": "in_progress",
                            "timestamp": "2026-06-20T16:00:00Z",
                            "actor": "authority_1",
                            "note": "Sanitation crew dispatched to clear waste"
                        }
                    ]
                },
                "issue_4": {
                    "id": "issue_4",
                    "photo_url": "https://images.unsplash.com/photo-1509024644558-2f56ce76c490?auto=format&fit=crop&q=80&w=800",
                    "issue_type": "Flickering Streetlight on Outer Ring Road",
                    "severity": "low",
                    "risk_notes": "Flickering streetlight creates dark patches on the footpath, compromising pedestrian safety.",
                    "department": "Electricity Department",
                    "category": "Streetlight Failure",
                    "status": "resolved",
                    "lat": 12.9698,
                    "lng": 77.7500,
                    "address": "Outer Ring Rd, Whitefield, Bengaluru",
                    "priority_score": 34.0,
                    "verification_count": 3,
                    "reporter_id": "user_4",
                    "description": "Streetlight bulb needs replacement.",
                    "created_at": "2026-06-18T20:00:00Z",
                    "updated_at": "2026-06-19T22:30:00Z",
                    "status_history": [
                        {
                            "status": "reported",
                            "timestamp": "2026-06-18T20:00:00Z",
                            "actor": "user_4",
                            "note": "Issue reported by citizen"
                        },
                        {
                            "status": "resolved",
                            "timestamp": "2026-06-19T22:30:00Z",
                            "actor": "authority_1",
                            "note": "LED bulb replaced successfully"
                        }
                    ]
                },
                "issue_5": {
                    "id": "issue_5",
                    "photo_url": "https://images.unsplash.com/photo-1473163928189-364b2c4e1135?auto=format&fit=crop&q=80&w=800",
                    "issue_type": "Drainage Blockage near Park",
                    "severity": "high",
                    "risk_notes": "Blocked storm drain causing waterlogging up to 1 foot after rains.",
                    "department": "Storm Water Drains BBMP",
                    "category": "Drainage Issues",
                    "status": "assigned",
                    "lat": 12.9116,
                    "lng": 77.6389,
                    "address": "HSR Layout Sector 2, Bengaluru",
                    "priority_score": 79.0,
                    "verification_count": 6,
                    "reporter_id": "user_5",
                    "description": "Drain completely choked with plastic waste.",
                    "created_at": "2026-06-20T11:00:00Z",
                    "updated_at": "2026-06-21T09:00:00Z",
                    "status_history": [
                        {
                            "status": "reported",
                            "timestamp": "2026-06-20T11:00:00Z",
                            "actor": "user_5",
                            "note": "Issue reported by citizen"
                        },
                        {
                            "status": "assigned",
                            "timestamp": "2026-06-21T09:00:00Z",
                            "actor": "authority_1",
                            "note": "Silt removal crew assigned to clear the block"
                        }
                    ]
                }
            }
        }
        self._load()

    def _load(self):
        try:
            persist_path = os.path.expanduser("~/.gemini/antigravity/civiceye_mock_db.json")
            if os.path.exists(persist_path):
                with open(persist_path, "r") as f:
                    loaded = json.load(f)
                    for k, v in loaded.items():
                        if k in self.stores:
                            self.stores[k].update(v)
                        else:
                            self.stores[k] = v
                logger.info(f"Loaded persisted mock DB from {persist_path}")
        except Exception as e:
            logger.warning(f"Failed to load persisted mock DB: {e}")

    def _save(self):
        try:
            persist_path = os.path.expanduser("~/.gemini/antigravity/civiceye_mock_db.json")
            os.makedirs(os.path.dirname(persist_path), exist_ok=True)
            with open(persist_path, "w") as f:
                json.dump(self.stores, f, indent=2)
        except Exception as e:
            logger.warning(f"Failed to persist mock DB: {e}")

    def collection(self, name):
        if name not in self.stores:
            self.stores[name] = {}
        return MockCollectionRef(name, self.stores[name], self)

class MockBlob:
    def __init__(self, name):
        self.name = name
    def upload_from_string(self, *args, **kwargs):
        pass
    def generate_signed_url(self, *args, **kwargs):
        return f"https://mock-storage.googleapis.com/file/{self.name}"

class MockBucket:
    def blob(self, name):
        return MockBlob(name)

# --- Firebase Admin Initialization with Fallback ---
_app = None
_db = None
_bucket = None

def get_firebase_app():
    global _app, _db, _bucket
    if _app is not None:
        return _app

    service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "")
    try:
        import firebase_admin
        from firebase_admin import credentials, firestore, storage

        if os.path.isfile(service_account_path):
            cred = credentials.Certificate(service_account_path)
        elif service_account_path.startswith("{"):
            sa_dict = json.loads(service_account_path)
            cred = credentials.Certificate(sa_dict)
        else:
            cred = credentials.ApplicationDefault()

        _app = firebase_admin.initialize_app(
            cred,
            {"storageBucket": os.getenv("FIREBASE_STORAGE_BUCKET", "roadrakshak-ai.firebasestorage.app")},
        )
        _db = firestore.client()
        _bucket = storage.bucket()
        logger.info("Firebase Admin initialized successfully.")
    except Exception as e:
        logger.warning(f"Firebase Admin initialization failed: {e}. Falling back to in-memory Mock Firestore/Storage.")
        # Setup mock client
        _app = "MOCK_APP"
        _db = MockFirestoreClient()
        _bucket = MockBucket()

    return _app

def get_db():
    get_firebase_app()
    return _db

def get_bucket():
    get_firebase_app()
    return _bucket
