from pydantic import BaseModel
from typing import Optional, Any
from uuid import UUID
from datetime import datetime


class BrandProfile(BaseModel):
    company_name: str
    industry: Optional[str] = None
    brand_values: list[str] = []
    aesthetic_tags: list[str] = []
    target_audience: dict[str, Any] = {}
    campaign_type: Optional[str] = None


class BrandCreate(BrandProfile):
    pass


class BrandUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    brand_values: Optional[list[str]] = None
    aesthetic_tags: Optional[list[str]] = None
    target_audience: Optional[dict[str, Any]] = None
    campaign_type: Optional[str] = None


class Brand(BrandProfile):
    id: UUID
    user_id: str
    plan_tier: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
