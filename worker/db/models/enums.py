import enum


class PackingStatus(str, enum.Enum):
    PENDING = "PENDING"
    READY_FOR_BATCH = "READY_FOR_BATCH"
    CLIP_GENERATED = "CLIP_GENERATED"
    ERROR = "ERROR"


class MiniClipStatus(str, enum.Enum):
    PENDING = "PENDING"
    UPLOADED = "UPLOADED"
    FAILED = "FAILED"


class BatchJobStatus(str, enum.Enum):
    RUNNING = "RUNNING"
    SUCCESS = "SUCCESS"
    PARTIAL_SUCCESS = "PARTIAL_SUCCESS"
    FAILED = "FAILED"


class BatchItemStatus(str, enum.Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    SUCCESS = "SUCCESS"
    FAILED = "FAILED"
