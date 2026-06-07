from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class CampaignCreate(BaseModel):
    inquiry_id: Optional[UUID] = None
    brand_id: UUID
    talent_id: UUID
    campaign_name: str
    campaign_type: Optional[str] = None
    brief_text: Optional[str] = None
    deliverables: Optional[str] = None
    shoot_date: Optional[str] = None
    remuneration_type: Optional[str] = "product"
    amount_sgd: Optional[int] = None


class CampaignDeliver(BaseModel):
    deliverable_urls: list[str] = []
    deliverable_note: Optional[str] = None


class CampaignStatusUpdate(BaseModel):
    status: str


class Campaign(BaseModel):
    id: UUID
    inquiry_id: Optional[UUID] = None
    brand_id: UUID
    talent_id: UUID
    campaign_name: str
    campaign_type: Optional[str] = None
    brief_text: Optional[str] = None
    deliverables: Optional[str] = None
    shoot_date: Optional[str] = None
    remuneration_type: Optional[str] = None
    amount_sgd: Optional[int] = None
    status: str
    talent_delivered_at: Optional[datetime] = None
    deliverable_urls: list[str] = []
    deliverable_note: Optional[str] = None
    brand_confirmed_at: Optional[datetime] = None
    auto_release_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
