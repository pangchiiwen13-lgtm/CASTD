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
    # Talent criteria - who the brand is looking for
    target_content_types: Optional[list[str]] = None
    target_languages: Optional[list[str]] = None
    target_gender: Optional[str] = None
    target_age_min: Optional[int] = None
    target_age_max: Optional[int] = None
    target_vibe_tags: Optional[list[str]] = None
    target_min_followers: Optional[int] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    campaign_type: Optional[str] = None
    brief_text: Optional[str] = None
    deliverables: Optional[str] = None
    shoot_date: Optional[str] = None
    budget_range: Optional[str] = None
    is_open: Optional[bool] = None
    status: Optional[str] = None
    # Talent criteria
    target_content_types: Optional[list[str]] = None
    target_languages: Optional[list[str]] = None
    target_gender: Optional[str] = None
    target_age_min: Optional[int] = None
    target_age_max: Optional[int] = None
    target_vibe_tags: Optional[list[str]] = None
    target_min_followers: Optional[int] = None


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
    is_open: bool = False
    target_content_types: Optional[list[str]] = None
    target_languages: Optional[list[str]] = None
    target_gender: Optional[str] = None
    target_age_min: Optional[int] = None
    target_age_max: Optional[int] = None
    target_vibe_tags: Optional[list[str]] = None
    target_min_followers: Optional[int] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
