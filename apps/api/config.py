from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    stack_secret_server_key: str = ""  # Neon Auth — legacy, not actively used
    stripe_secret_key: str
    stripe_webhook_secret: str
    stripe_price_id_monthly: str  # $15/month price ID from Stripe
    stripe_contact_fee_sgd: int = 9900  # SGD 99.00 in cents
    deepseek_api_key: str = ""
    resend_api_key: str = ""
    allowed_origins: str = "http://localhost:3000"
    admin_user_ids: str = ""  # comma-separated Stack Auth user IDs

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]

    @property
    def admin_ids(self) -> list[str]:
        return [i.strip() for i in self.admin_user_ids.split(",") if i.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
