import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { sendMessage } from '@/lib/telegram';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

export async function POST(request: NextRequest) {
    try {
        const update = await request.json();

        // Check if it's a message
        if (!update.message || !update.message.text) {
            return NextResponse.json({ ok: true });
        }

        const message = update.message;
        const chatId = message.chat.id;
        const text = message.text;
        const telegramId = message.from.id;
        const firstName = message.from.first_name;
        const lastName = message.from.last_name;
        const username = message.from.username;

        // Handle /start command
        if (text.startsWith('/start')) {
            const args = text.split(' ');

            // Check for invite token (format: /start invite_<token>)
            if (args.length > 1 && args[1].startsWith('invite_')) {
                const token = args[1].replace('invite_', '');
                await handleInvite(chatId, telegramId, firstName, lastName, username, token);
            } else {
                await sendMessage(chatId, 'Welcome to Mini POS! Please use an invite link to join a business.', BOT_TOKEN);
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Telegram webhook error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function handleInvite(
    chatId: number,
    telegramId: number,
    firstName: string,
    lastName: string | undefined,
    username: string | undefined,
    token: string
) {
    try {
        // Find the invite
        const invite = await prisma.staffInvite.findUnique({
            where: { token },
            include: { business: true },
        });

        if (!invite) {
            await sendMessage(chatId, 'Invalid invitation link.', BOT_TOKEN);
            return;
        }

        if (invite.usedAt) {
            await sendMessage(chatId, 'This invitation link has already been used.', BOT_TOKEN);
            return;
        }

        if (new Date() > invite.expiresAt) {
            await sendMessage(chatId, 'This invitation link has expired.', BOT_TOKEN);
            return;
        }

        // Find or create user
        let user = await prisma.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
        });

        if (!user) {
            user = await prisma.user.create({
                data: {
                    telegramId: BigInt(telegramId),
                    firstName,
                    lastName,
                    username,
                },
            });
        } else {
            // Update user info
            user = await prisma.user.update({
                where: { id: user.id },
                data: { firstName, lastName, username },
            });
        }

        // Check if already a member
        const existingMember = await prisma.businessMember.findUnique({
            where: {
                userId_businessId: {
                    userId: user.id,
                    businessId: invite.businessId,
                },
            },
        });

        // Check if user is the owner
        if (invite.business.ownerId === user.id) {
            await sendMessage(chatId, `You are the owner of ${invite.business.name} and cannot join as staff.`, BOT_TOKEN);
            return;
        }

        if (existingMember) {
            await sendMessage(chatId, `You are already a member of ${invite.business.name}.`, BOT_TOKEN);
            return;
        }

        // Create membership
        await prisma.businessMember.create({
            data: {
                userId: user.id,
                businessId: invite.businessId,
                role: invite.role,
                // Set default permissions based on role
                canAddProducts: true,
                canEditProducts: invite.role === 'MANAGER',
                canDeleteProducts: false,
                canViewReports: invite.role === 'MANAGER',
                canManageStaff: false,
            },
        });

        // Mark invite as used
        await prisma.staffInvite.update({
            where: { id: invite.id },
            data: {
                usedAt: new Date(),
                usedById: user.id,
            },
        });

        await sendMessage(
            chatId,
            `✅ Successfully joined <b>${invite.business.name}</b> as <b>${invite.role}</b>!\n\nYou can now access the dashboard.`,
            BOT_TOKEN
        );
    } catch (error) {
        console.error('Handle invite error:', error);
        await sendMessage(chatId, 'An error occurred while processing your invitation.', BOT_TOKEN);
    }
}
