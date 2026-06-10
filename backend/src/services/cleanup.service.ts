import { prisma } from '../config/database';
import { deleteFile } from '../config/upload';

export const cleanupExpiredStories = async () => {
  try {
    const expired = await prisma.story.findMany({
      where: { expiresAt: { lt: new Date() } },
      select: { id: true, mediaUrl: true },
    });
    if (expired.length === 0) return;
    const result = await prisma.story.deleteMany({
      where: { id: { in: expired.map(s => s.id) } },
    });
    expired.forEach(s => deleteFile(s.mediaUrl));
    console.log(`Cleanup: deleted ${result.count} expired stories and their media files`);
  } catch (error) {
    console.error('Cleanup expired stories error:', error);
  }
};

export const cleanupOldPostViews = async () => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);

    let deleted = 0;
    while (true) {
      const batch = await prisma.postView.findMany({
        where: { viewedAt: { lt: cutoff } },
        select: { id: true },
        take: 1000,
      });
      if (batch.length === 0) break;
      const result = await prisma.postView.deleteMany({
        where: { id: { in: batch.map(b => b.id) } },
      });
      deleted += result.count;
      if (batch.length < 1000) break;
    }
    console.log(`Cleanup: deleted ${deleted} old post views`);
  } catch (error) {
    console.error('Cleanup old post views error:', error);
  }
};

export const syncPostViewCounts = async () => {
  try {
    const result = await prisma.$queryRaw<Array<{ postId: string; count: bigint }>>`
      SELECT "postId", COUNT(*)::bigint as count
      FROM "PostView"
      GROUP BY "postId"
    `;
    for (const row of result) {
      await prisma.post.update({
        where: { id: row.postId },
        data: { viewCount: Number(row.count) },
      }).catch(() => {});
    }
    if (result.length > 0) {
      console.log(`Cleanup: synced view counts for ${result.length} posts`);
    }
  } catch (error) {
    console.error('Sync post view counts error:', error);
  }
};

export const startCleanupJobs = () => {
  setInterval(cleanupExpiredStories, 60 * 60 * 1000);
  setInterval(cleanupOldPostViews, 24 * 60 * 60 * 1000);
  setInterval(syncPostViewCounts, 5 * 60 * 1000);
  cleanupExpiredStories();
  syncPostViewCounts();
};