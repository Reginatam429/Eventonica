CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    roles TEXT[] NOT NULL DEFAULT ARRAY['attendee'],
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Ensure emails are unique for ON CONFLICT (email) in seeding
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uindex ON public.users(email);

-- events
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    type TEXT NOT NULL,
    venue TEXT NOT NULL,
    address TEXT NOT NULL,
    start_at TIMESTAMP NOT NULL,
    end_at TIMESTAMP NOT NULL,
    capacity INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft',
    published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_events_updated_at BEFORE UPDATE ON events
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ticket types
CREATE TABLE IF NOT EXISTS ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_cents INT NOT NULL,
    quantity INT NOT NULL,
    sales_start TIMESTAMP NULL,
    sales_end TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE TRIGGER trg_ticket_types_updated_at BEFORE UPDATE ON ticket_types
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Schedule Items
CREATE TABLE IF NOT EXISTS public.schedule_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    starts_at   TIMESTAMPTZ NOT NULL,
    ends_at     TIMESTAMPTZ NOT NULL,
    title       TEXT NOT NULL,
    speaker     TEXT,
    location    TEXT,
    description TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (ends_at > starts_at)
);
DROP TRIGGER IF EXISTS trg_schedule_items_updated_at ON public.schedule_items;
CREATE TRIGGER trg_schedule_items_updated_at
BEFORE UPDATE ON public.schedule_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_schedule_items_event ON public.schedule_items(event_id, starts_at);


-- Event Assignments (vendor/staff)

CREATE TABLE IF NOT EXISTS public.event_assignments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
    role       TEXT NOT NULL CHECK (role IN ('vendor','staff')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (event_id, user_id, role)
);
CREATE INDEX IF NOT EXISTS idx_event_assignments_event ON public.event_assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_event_assignments_user  ON public.event_assignments(user_id);


-- Event Updates (announcements)
CREATE TABLE IF NOT EXISTS public.event_updates (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    message     TEXT NOT NULL,
    created_by  UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_event_updates_event ON public.event_updates(event_id, created_at DESC);


-- Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES public.users(id)   ON DELETE CASCADE,
    event_id   UUID REFERENCES public.events(id)           ON DELETE SET NULL,
    type       TEXT NOT NULL,                              -- e.g. 'update','assignment','order'
    payload    JSONB NOT NULL DEFAULT '{}'::jsonb,
    read_at    TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id) WHERE read_at IS NULL;


-- Orders / Order items
CREATE TABLE IF NOT EXISTS public.orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id)  ON DELETE CASCADE,
    event_id    UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    total_cents INT  NOT NULL,
    status      TEXT NOT NULL CHECK (status IN ('pending','confirmed','cancelled')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_orders_event ON public.orders(event_id);
CREATE INDEX IF NOT EXISTS idx_orders_user  ON public.orders(user_id);

CREATE TABLE IF NOT EXISTS public.order_items (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID NOT NULL REFERENCES public.orders(id)       ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
    qty            INT  NOT NULL CHECK (qty > 0),
    price_cents    INT  NOT NULL,
    UNIQUE (order_id, ticket_type_id)
);


-- Tickets / check-in
CREATE TABLE IF NOT EXISTS public.tickets (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id       UUID NOT NULL REFERENCES public.orders(id)       ON DELETE CASCADE,
    event_id       UUID NOT NULL REFERENCES public.events(id)       ON DELETE CASCADE,
    user_id        UUID REFERENCES public.users(id)                 ON DELETE SET NULL,
    ticket_type_id UUID NOT NULL REFERENCES public.ticket_types(id) ON DELETE RESTRICT,
    qr_code        TEXT NOT NULL UNIQUE,
    checked_in_at  TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tickets_event  ON public.tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_order  ON public.tickets(order_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user   ON public.tickets(user_id);
