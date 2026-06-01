import { openai } from '../config/openai';

interface AIReviewResult {
  approved: boolean;
  score: number;
  reason: string;
  flags: string[];
  suggestions: string;
}

export const reviewProfile = async (profileData: any): Promise<AIReviewResult> => {
  try {
    const prompt = `
You are a content moderator for an Islamic marriage platform called Hafsa.
Review this profile submission and return a JSON response.

Profile data:
${JSON.stringify(profileData, null, 2)}

Check for:
1. Inappropriate or non-Islamic content in text fields
2. Offensive language
3. Fake/spam indicators (too short, nonsensical, copied text)
4. Content that violates Islamic values
5. Photo appropriateness (if photos provided via Cloudinary moderation score)

Return ONLY valid JSON:
{
  "approved": boolean,
  "score": number (0-100, 100=perfect),
  "reason": "brief reason if rejected",
  "flags": ["list", "of", "issues"],
  "suggestions": "improvement suggestions if score < 70"
}
`;

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a strict but fair Islamic content moderator. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 1000,
    });

    const text = response.choices[0]?.message?.content || '';
    const result = JSON.parse(text.replace(/```json|```/g, '').trim()) as AIReviewResult;

    return result;
  } catch (error) {
    console.error('AI review error:', error);
    // Fallback: auto-approve with moderate score
    return {
      approved: true,
      score: 70,
      reason: 'AI review unavailable, auto-approved',
      flags: [],
      suggestions: 'Please review your profile for completeness',
    };
  }
};

export const processReviewResult = (result: AIReviewResult): { status: string; needsHumanReview: boolean } => {
  if (result.score >= 70) {
    return { status: 'APPROVED', needsHumanReview: false };
  }
  if (result.score < 40) {
    return { status: 'REJECTED', needsHumanReview: false };
  }
  return { status: 'PENDING_AI_REVIEW', needsHumanReview: true };
};
