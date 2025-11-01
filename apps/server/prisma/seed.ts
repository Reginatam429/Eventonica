import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const toJson = (arr: string[]): Prisma.InputJsonValue => arr;

async function main() {
    // ---- Users ----
    const admin = await prisma.user.upsert({
        where: { email: 'admin@eventonica.com' },
        update: {},
        create: {
        name: 'Admin User',
        email: 'admin@eventonica.com',
        passwordHash: 'hashed_admin_pw',
        roles: toJson(['admin', 'organizer']),
        },
    });

    const organizer = await prisma.user.upsert({
        where: { email: 'organizer@example.com' },
        update: {},
        create: {
        name: 'Organizer One',
        email: 'organizer@example.com',
        passwordHash: 'hashed_organizer_pw',
        roles: toJson(['organizer']),
        },
    });

    const attendee = await prisma.user.upsert({
        where: { email: 'regina@example.com' },
        update: {},
        create: {
        name: 'Regina Attendee',
        email: 'regina@example.com',
        passwordHash: 'hashed_attendee_pw',
        roles: toJson(['attendee']),
        },
    });

    const vendor = await prisma.user.upsert({
        where: { email: 'vendor@example.com' },
        update: {},
        create: {
        name: 'Vendor Co',
        email: 'vendor@example.com',
        passwordHash: 'hashed_vendor_pw',
        roles: toJson(['vendor', 'attendee']),
        },
    });

    // ---- Vendor Profile ----
    await prisma.vendorProfile.upsert({
        where: { userId: vendor.id },
        update: {
        displayName: 'Vendor Co',
        categories: toJson(['Catering', 'AV']),
        description: 'Professional event vendor',
        website: 'https://vendorco.example',
        contactEmail: 'contact@vendorco.example',
        },
        create: {
        userId: vendor.id,
        displayName: 'Vendor Co',
        categories: toJson(['Catering', 'AV']),
        description: 'Professional event vendor',
        website: 'https://vendorco.example',
        contactEmail: 'contact@vendorco.example',
        },
    });

    // ---- Organizer-owned Event ----
    const event = await prisma.event.upsert({
        where: { id: 'seed-event-1' },
        update: {},
        create: {
        id: 'seed-event-1',
        organizerId: organizer.id,
        title: 'Organizer Launch Meetup',
        description: 'Networking + lightning talks.',
        type: 'Meetup',
        venue: 'Community Hall',
        address: '456 Side St, Seattle, WA',
        startAt: new Date('2026-02-01T02:00:00Z'),
        endAt: new Date('2026-02-01T05:00:00Z'),
        capacity: 150,
        published: true,
        status: 'published',
        },
    });

    // ---- Ticket Type ----
    await prisma.ticketType.upsert({
        where: { id: 'seed-tt-general' },
        update: {},
        create: {
        id: 'seed-tt-general',
        eventId: event.id,
        name: 'General Admission',
        priceCents: 10000,
        quantity: 120,
        salesStart: new Date('2025-12-01T00:00:00Z'),
        salesEnd: new Date('2026-01-31T23:59:59Z'),
        },
    });

    // ---- Event Assignments ----
    // Compound unique from schema: @@unique([eventId, userId, role])
    await prisma.eventAssignment.upsert({
        where: {
        eventId_userId_role: { eventId: event.id, userId: vendor.id, role: 'vendor' },
        },
        update: {},
        create: { eventId: event.id, userId: vendor.id, role: 'vendor' },
    });

    await prisma.eventAssignment.upsert({
        where: {
        eventId_userId_role: { eventId: event.id, userId: vendor.id, role: 'vendor_gate' },
        },
        update: {},
        create: { eventId: event.id, userId: vendor.id, role: 'vendor_gate' },
    });

    console.log('✅ Seed complete:', {
        admin: admin.email,
        organizer: organizer.email,
        attendee: attendee.email,
        vendor: vendor.email,
        event: event.title,
    });
}

main()
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
