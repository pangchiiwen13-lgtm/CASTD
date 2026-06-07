from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    campaign_type: Optional[str] = None
    brief_text: Optional[str] = None
    deliverables: Optional[str] = None
    shoot_date: Optional[str] = None
    budget_range: Optional[str] = None


class Project(BaseModel):
    id: UUID
    brand_id: UUID
    name: str
    campaign_type: Optional[str]
    brief_text: Optional[str]
    deliverables: Optional[str]
    shoot_date: Optional[str]
    budget_range: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
