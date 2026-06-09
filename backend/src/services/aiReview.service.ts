import { prisma } from '../config/database';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const runAiReview = async (profileId: string, profile: any): Promise<void> => {
  try {
    const prompt = `
You are a moderation assistant for Omar, an Islamic marriage platform.
Review this groom profile and return a JSON object with:
- score: number 0-100 (quality and completeness)
- approved: boolean
- notes: string (in Arabic, brief reason if rejected or flagged)
- flags: string[] (list of issues found)

Profile data:
- Self introduction: "${profile.selfIntroduction}"
- Additional notes: "${profile.additionalNotes || ''}"
- Age: ${profile.age}
- Education: ${profile.education}
- Prayer commitment: ${profile.prayerCommitment}
- Marital status: ${profile.maritalStatus}

Rules for rejection:
1. Contains phone numbers, emails, social media handles, or contact info in text fields
2. Contains inappropriate or un-Islamic language
3. Self introduction is less than 20 characters
4. Contains false religious claims or extremist language

Respond ONLY with valid JSON. No preamble.
    `.trim();

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.1,
    });

    const raw = response.choices[0]?.message?.content || '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const result = JSON.parse(clean);

    const approved = result.approved === true && (result.score || 0) >= 60;

    await prisma.profile.update({
      where: { id: profileId },
      data: {
        status: approved ? 'APPROVED' : 'REJECTED',
        aiReviewScore: result.score || null,
        aiReviewNotes: result.notes || null,
        aiReviewedAt: new Date(),
        publishedAt: approved ? new Date() : null,
      },
    });

    const p = await prisma.profile.findUnique({ where: { id: profileId }, select: { userId: true } });
    if (p) {
      await prisma.notification.create({
        data: {
          userId: p.userId,
          type: 'PROFILE_REVIEWED',
          titleAr: approved ? 'تم قبول ملفك الشخصي' : 'تم رفض ملفك الشخصي',
          titleEn: approved ? 'Profile approved' : 'Profile rejected',
          bodyAr: approved
            ? 'ملفك الشخصي الآن منشور ويمكن للآخرين رؤيته'
            : (result.notes || 'يرجى مراجعة ملفك وإعادة التقديم'),
          bodyEn: approved
            ? 'Your profile is now live and visible to others'
            : (result.notes || 'Please review your profile and resubmit'),
          data: { profileId, score: result.score, flags: result.flags },
        },
      });
    }
  } catch (err) {
    console.error('AI review error:', err);
    await prisma.profile.update({
      where: { id: profileId },
      data: {
        status: 'PENDING_AI_REVIEW',
        aiReviewNotes: 'AI review failed — awaiting manual admin review',
      },
    });
  }
};
