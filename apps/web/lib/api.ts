const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, ...init } = options;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Public (no auth)
  getPublicStats: () =>
    apiFetch<{ superstars: number; brands: number; completed_matches: number }>("/public/stats"),
  getPublicReviews: () =>
    apiFetch<PublicReview[]>("/ratings/public"),


  // Talents
  getTalents: (params: Record<string, string>, token: string) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch<Talent[]>(`/talents${qs ? `?${qs}` : ""}`, { token });
  },
  getTalent: (id: string, token: string) =>
    apiFetch<Talent>(`/talents/${id}`, { token }),

  // Brand profile
  getMyBrand: (token: string) => apiFetch<Brand>("/brands/me", { token }),
  createBrand: (data: Partial<Brand>, token: string) =>
    apiFetch<Brand>("/brands/me", { method: "POST", body: JSON.stringify(data), token }),
  updateBrand: (data: Partial<Brand>, token: string) =>
    apiFetch<Brand>("/brands/me", { method: "PATCH", body: JSON.stringify(data), token }),

  // Shortlists
  getShortlist: (token: string) => apiFetch<TalentCard[]>("/shortlists", { token }),
  addShortlist: (talentId: string, token: string) =>
    apiFetch<void>(`/shortlists/${talentId}`, { method: "POST", token }),
  removeShortlist: (talentId: string, token: string) =>
    apiFetch<void>(`/shortlists/${talentId}`, { method: "DELETE", token }),

  // Inquiries
  getInquiries: (token: string) => apiFetch<Inquiry[]>("/inquiries", { token }),
  createInquiry: (data: Partial<Inquiry>, token: string) =>
    apiFetch<Inquiry>("/inquiries", { method: "POST", body: JSON.stringify(data), token }),

  // Notifications
  getNotifications: (token: string) => apiFetch<Notification[]>("/notifications", { token }),
  getUnreadCount: (token: string) => apiFetch<{ count: number }>("/notifications/unread-count", { token }),
  markAllRead: (token: string) => apiFetch<void>("/notifications/read-all", { method: "POST", token }),
  markRead: (id: string, token: string) => apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH", token }),

  // Confirmations
  createCheckout: (inquiryId: string, token: string) =>
    apiFetch<{ checkout_url?: string; confirmed?: boolean; subscription_used?: boolean }>(
      `/confirmations/${inquiryId}/checkout`,
      { method: "POST", token }
    ),

  // Superstar (talent self-serve)
  checkRegistration: (token: string) =>
    apiFetch<{ has_brand: boolean; has_superstar: boolean; superstar_status: string | null; superstar_published: boolean | null }>(
      "/superstar/check", { token }
    ),
  getMySuperstarsProfile: (token: string) =>
    apiFetch<Talent>("/superstar/me", { token }),
  registerSuperstar: (data: Partial<SuperstarRegister>, token: string) =>
    apiFetch<Talent>("/superstar/register", { method: "POST", body: JSON.stringify(data), token }),
  updateMySuperstarsProfile: (data: Partial<SuperstarRegister>, token: string) =>
    apiFetch<Talent>("/superstar/me", { method: "PATCH", body: JSON.stringify(data), token }),
  getMyBookings: (token: string) =>
    apiFetch<SuperstarBooking[]>("/superstar/bookings", { token }),

  // Ratings
  submitRating: (data: { inquiry_id: string; score: number; comment?: string }, token: string) =>
    apiFetch<{ ok: boolean }>("/ratings", { method: "POST", body: JSON.stringify(data), token }),
  checkRating: (inquiry_id: string, token: string) =>
    apiFetch<{ has_rated: boolean; score?: number; comment?: string }>(`/ratings/check/${inquiry_id}`, { token }),
};

// Types
export interface Talent {
  id: string;
  ig_username: string;
  name: string;
  age?: number;
  gender?: string;
  languages: string[];
  content_types: string[];
  vibe_tags: string[];
  ig_handle?: string;
  tiktok_handle?: string;
  ig_followers: number;
  tiktok_followers: number;
  email?: string;
  bio?: string;
  experience_summary?: string;
  rate_card_text?: string;
  photo_urls: string[];
  intro_video_url?: string;
  face_condition?: string;
  hair_condition?: string;
  body_condition?: string;
  tc_signed: boolean;
  is_published: boolean;
  user_id?: string;
  profile_status?: string;
  remuneration_preference?: string;
  min_rate_sgd?: number;
  rating_avg?: number;
  rating_count?: number;
  created_at: string;
  updated_at?: string;
  fit_score?: number;
}

export type TalentCard = Pick<
  Talent,
  "id" | "name" | "ig_handle" | "photo_urls" | "content_types" | "vibe_tags" | "ig_followers" | "languages" | "gender" | "age" | "fit_score"
>;

export interface Brand {
  id: string;
  user_id: string;
  company_name: string;
  industry?: string;
  brand_values: string[];
  aesthetic_tags: string[];
  target_audience: Record<string, string>;
  campaign_type?: string;
  plan_tier: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface SuperstarRegister {
  name: string;
  age?: number;
  gender?: string;
  languages: string[];
  content_types: string[];
  vibe_tags: string[];
  ig_handle?: string;
  ig_followers: number;
  tiktok_handle?: string;
  tiktok_followers: number;
  bio?: string;
  experience_summary?: string;
  rate_card_text?: string;
  photo_urls: string[];
  intro_video_url?: string;
  email?: string;
  remuneration_preference: string;
  min_rate_sgd?: number;
}

export interface SuperstarBooking {
  id: string;
  brand_id: string;
  talent_id: string;
  campaign_name: string;
  campaign_type?: string;
  brief_text?: string;
  budget_range?: string;
  preferred_dates?: string;
  status: string;
  created_at: string;
  brand_name: string;
}

export interface PublicReview {
  score: number;
  comment: string;
  ratee_type: "brand" | "superstar";
  ratee_name: string;
  created_at: string;
}

export interface Inquiry {
  id: string;
  brand_id: string;
  talent_id: string;
  campaign_name: string;
  campaign_type?: string;
  brief_text?: string;
  budget_range?: string;
  preferred_dates?: string;
  status: string;
  created_at: string;
}
