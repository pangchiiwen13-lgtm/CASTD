from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime


class TalentBase(BaseModel):
    ig_username: str
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    languages: list[str] = []
    content_types: list[str] = []
    vibe_tags: list[str] = []
    ig_handle: Optional[str] = None
    tiktok_handle: Optional[str] = None
    ig_followers: int = 0
    tiktok_followers: int = 0
    email: Optional[str] = None
    bio: Optional[str] = None
    experience_summary: Optional[str] = None
    rate_card_text: Optional[str] = None
    photo_urls: list[str] = []
    intro_video_url: Optional[str] = None
    face_condition: Optional[str] = None
    hair_condition: Optional[str] = None
    body_condition: Optional[str] = None
    tc_signed: bool = False


class TalentCreate(TalentBase):
    pass


class TalentUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    languages: Optional[list[str]] = None
    content_types: Optional[list[str]] = None
    vibe_tags: Optional[list[str]] = None
    ig_handle: Optional[str] = None
    tiktok_handle: Optional[str] = None
    ig_followers: Optional[int] = None
    tiktok_followers: Optional[int] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    experience_summary: Optional[str] = None
    rate_card_text: Optional[str] = None
    photo_urls: Optional[list[str]] = None
    intro_video_url: Optional[str] = None
    face_condition: Optional[str] = None
    hair_condition: Optional[str] = None
    body_condition: Optional[str] = None
    tc_signed: Optional[bool] = None
    is_published: Optional[bool] = None


class Talent(TalentBase):
    id: UUID
    is_published: bool
    user_id: Optional[str] = None
    profile_status: Optional[str] = "pending"
    remuneration_preference: Optional[str] = "both"
    min_rate_sgd: Optional[int] = None
    rating_avg: Optional[float] = None
    rating_count: int = 0
    created_at: datetime
    updated_at: datetime
    fit_score: Optional[int] = None  # injected from brand_fit_scores if available

    class Config:
        from_attributes = True


# Models for Superstar self-serve portal
class SuperstarRegister(BaseModel):
    name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    languages: list[str] = []
    content_types: list[str] = []
    vibe_tags: list[str] = []
    ig_handle: Optional[str] = None
    ig_followers: int = 0
    tiktok_handle: Optional[str] = None
    tiktok_followers: int = 0
    bio: Optional[str] = None
    experience_summary: Optional[str] = None
    rate_card_text: Optional[str] = None
    photo_urls: list[str] = []
    intro_video_url: Optional[str] = None
    email: Optional[str] = None
    remuneration_preference: str = "both"
    min_rate_sgd: Optional[int] = None


class SuperstarUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    languages: Optional[list[str]] = None
    content_types: Optional[list[str]] = None
    vibe_tags: Optional[list[str]] = None
    ig_handle: Optional[str] = None
    ig_followers: Optional[int] = None
    tiktok_handle: Optional[str] = None
    tiktok_followers: Optional[int] = None
    bio: Optional[str] = None
    experience_summary: Optional[str] = None
    rate_card_text: Optional[str] = None
    photo_urls: Optional[list[str]] = None
    intro_video_url: Optional[str] = None
    email: Optional[str] = None
    remuneration_preference: Optional[str] = None
    min_rate_sgd: Optional[int] = None
