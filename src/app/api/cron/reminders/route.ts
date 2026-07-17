import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  
  // Basic security check for Vercel Cron
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Find all active loans that are overdue (endDate < now)
    const overdueLoans = await prisma.loan.findMany({
      where: {
        status: 'ACTIVE',
        endDate: {
          lt: new Date()
        }
      },
      include: {
        customer: true,
        shop: true
      }
    });

    const notifications = [];

    for (const loan of overdueLoans) {
      if (loan.shop.whatsappAddon) {
        // Mocking the WhatsApp API call
        const message = `Dear ${loan.customer.firstName}, your gold loan ${loan.loanNumber} is overdue. Please clear the pending dues at the earliest.`;
        
        // Log the notification
        const log = await prisma.notificationLog.create({
          data: {
            shopId: loan.shopId,
            type: 'WHATSAPP',
            recipient: loan.customer.phone,
            message: message,
            status: 'SENT'
          }
        });
        notifications.push(log);
      }
    }

    return NextResponse.json({ success: true, processed: notifications.length });
  } catch (error) {
    console.error('Cron job failed', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
