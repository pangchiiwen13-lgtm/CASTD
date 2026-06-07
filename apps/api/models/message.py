from pydantic import BaseModel
from uuid import UUID
from datetime import datetime


class MessageCreate(BaseModel):
    body: str


class Message(BaseModel):
    id: UUID
    campaign_id: UUID
    sender_user_id: str
    sender_type: str
    body: str
    created_at: datetime

    class Config:
        from_attributes = True
