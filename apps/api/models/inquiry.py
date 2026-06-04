from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class InquiryCreate(BaseModel):
    talent_id: UUID
    campaign_name: str
    campaign_type: Optional[str] = None
    brief_text: Optional[str] = None
    budget_range: Optional[str] = None
    preferred_dates: Optional[str] = None


class InquiryStatusUpdate(BaseModel):
    status: str  # open | reviewing | confirmed | closed


class Inquiry(BaseModel):
    id: UUID
    brand_id: UUID
    talent_id: UUID
    campaign_name: str
    campaign_type: Optional[str]
    brief_text: Optional[str]
    budget_range: Optional[str]
    preferred_dates: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
