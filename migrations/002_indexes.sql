-- Performance indexes for Northstar

-- Talents: filter queries
CREATE INDEX idx_talents_published ON talents(is_published);
CREATE INDEX idx_talents_gender ON talents(gender) WHERE is_published = TRUE;
CREATE INDEX idx_talents_languages ON talents USING GIN(languages);
CREATE INDEX idx_talents_content_types ON talents USING GIN(content_types);
CREATE INDEX idx_talents_vibe_tags ON talents USING GIN(vibe_tags);

-- Shortlists: per-brand lookups
CREATE INDEX idx_shortlists_brand ON shortlists(brand_id);
CREATE INDEX idx_shortlists_talent ON shortlists(talent_id);

-- Inquiries: per-brand and per-talent
CREATE INDEX idx_inquiries_brand ON inquiries(brand_id);
CREATE INDEX idx_inquiries_talent ON inquiries(talent_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);

-- Confirmations: payment lookups
CREATE INDEX idx_confirmations_brand ON contact_confirmations(brand_id);
CREATE INDEX idx_confirmations_session ON contact_confirmations(stripe_session_id);

-- Scores: per-brand full catalog scoring
CREATE INDEX idx_scores_brand ON brand_fit_scores(brand_id);
