from fastapi import APIRouter, Depends, HTTPException
from uuid import UUID
from database import get_pool
from models.message import Message, MessageCreate
from auth import get_current_user

router = APIRouter(prefix="/messages", tags=["messages"])


async def _assert_campaign_access(campaign_id: UUID, user: dict, conn) -> dict:
    """Verify user has access to this campaign (as brand or superstar)."""
    campaign = await conn.fetchrow(
        """
        SELECT c.*, b.user_id AS brand_user_id, t.user_id AS talent_user_id
        FROM campaigns c
        JOIN brands b ON b.id = c.brand_id
        JOIN talents t ON t.id = c.talent_id
        WHERE c.id = $1 AND c.status != 'cancelled'
        """,
        str(campaign_id),
    )
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    uid = user["id"]
    if uid != campaign["brand_user_id"] and uid != campaign["talent_user_id"]:
        raise HTTPException(status_code=403, detail="Access denied")
    return dict(campaign)


@router.get("/{campaign_id}", response_model=list[Message])
async def get_messages(campaign_id: UUID, user: dict = Depends(get_current_user)):
    pool = await get_pool()
    async with pool.acquire() as conn:
        await _assert_campaign_access(campaign_id, user, conn)
        rows = await conn.fetch(
            "SELECT * FROM messages WHERE campaign_id = $1 ORDER BY created_at ASC",
            str(campaign_id),
        )
    return [Message(**dict(r)) for r in rows]


@router.post("/{campaign_id}", response_model=Message)
async def send_message(campaign_id: UUID, data: MessageCreate, user: dict = Depends(get_current_user)):
    if not data.body.strip():
        raise HTTPException(status_code=400, detail="Message body cannot be empty")

    pool = await get_pool()
    async with pool.acquire() as conn:
        campaign = await _assert_campaign_access(campaign_id, user, conn)
        # Determine sender type
        sender_type = "brand" if user["id"] == campaign["brand_user_id"] else "superstar"
        row = await conn.fetchrow(
            """
            INSERT INTO messages (campaign_id, sender_user_id, sender_type, body)
            VALUES ($1, $2, $3, $4)
            RETURNING *
            """,
            str(campaign_id), user["id"], sender_type, data.body.strip(),
        )
    return Message(**dict(row))
