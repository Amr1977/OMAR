import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';

export const getPlans = async (_req: Request, res: Response) => {
  try {
    return res.json({
      plans: [
        {
          id: 'free',
          nameAr: 'مجاني',
          nameEn: 'Free',
          price: 0,
          features: [
            'إنشاء ملف شخصي',
            'استقبال طلبات التواصل',
            '3 طلبات تواصل شهرياً',
            'رسائل نصية',
          ],
          featuresEn: [
            'Create a profile',
            'Receive contact requests',
            '3 contact requests/month',
            'Text messaging',
          ],
        },
        {
          id: 'premium',
          nameAr: 'مميز',
          nameEn: 'Premium',
          price: 29.99,
          currency: 'USD',
          interval: 'month',
          features: [
            'جميع ميزات المجاني',
            'طلبات تواصل غير محدودة',
            'اقتراحات الذكاء الاصطناعي',
            'تطابق متقدم',
            'شارة موثق',
            'دعم فني ذو أولوية',
          ],
          featuresEn: [
            'All free features',
            'Unlimited contact requests',
            'AI-powered suggestions',
            'Advanced matching',
            'Verified badge',
            'Priority support',
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Get plans error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get plans' });
  }
};

export const createCheckout = async (req: AuthRequest, res: Response) => {
  try {
    const { planId } = req.body;

    if (planId !== 'premium') {
      return res.status(400).json({
        error: 'INVALID_PLAN',
        messageAr: 'خطة غير صالحة',
        messageEn: 'Invalid plan',
      });
    }

    // Mock checkout session - in production use Stripe/Tap
    const session = {
      id: 'cs_' + Date.now(),
      url: `${process.env.FRONTEND_URL}/settings/subscription?session_id=cs_${Date.now()}`,
    };

    return res.json(session);
  } catch (error) {
    console.error('Create checkout error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to create checkout' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  try {
    const event = req.body;

    if (event.type === 'checkout.session.completed') {
      const userId = event.data?.object?.metadata?.userId;
      if (userId) {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + 1);

        await prisma.user.update({
          where: { id: userId },
          data: {
            subscriptionPlan: 'PREMIUM',
            subscriptionExpiry: expiry,
          },
        });
      }
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Webhook handling failed' });
  }
};
