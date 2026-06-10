import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { notifyPostLike, notifyPostComment, notifyNewFollower, createNotification } from '../../services/notification.service';
import { deleteFile } from '../../config/upload';

export const uploadPostMedia = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'NO_FILE', message: 'No file uploaded' });
    const url = `/uploads/social/${file.filename}`;
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    return res.json({ url, mediaType, filename: file.filename, size: file.size });
  } catch (error) {
    console.error('Upload media error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to upload media' });
  }
};

const getUserDisplayName = async (userId: string) => {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { displayName: true } });
  return profile?.displayName || 'مستخدم';
};

const id = (req: AuthRequest) => req.params.id as string;

const canView = async (post: { id: string; userId: string; privacy: string }, viewerId?: string): Promise<boolean> => {
  if (viewerId && viewerId === post.userId) return true;
  switch (post.privacy) {
    case 'PUBLIC': return true;
    case 'PRIVATE': return false;
    case 'CONNECTIONS': {
      if (!viewerId) return false;
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: post.userId } },
      });
      return !!follow;
    }
    case 'SELECTED': {
      if (!viewerId) return false;
      const allowed = await prisma.postPrivacyUser.findUnique({
        where: { postId_userId: { postId: post.id, userId: viewerId } },
      });
      return !!allowed;
    }
    default: return false;
  }
};

const postInclude = (userId: string) => ({
  user: { select: { id: true, roles: true, subscriptionPlan: true, isOnline: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
  _count: { select: { likes: true, comments: true, saves: true } },
  ...(userId ? { likes: { where: { userId }, take: 1 }, saves: { where: { userId }, take: 1 } } : {}),
  sharedPost: {
    include: {
      user: { select: { id: true, roles: true, subscriptionPlan: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
      _count: { select: { likes: true, comments: true } },
    },
  },
  hashtags: { include: { hashtag: { select: { tag: true } } } },
} as const);

const postIncludeFull = (userId: string) => ({
  ...postInclude(userId),
  allowedUsers: { include: { user: { select: { id: true, profile: { select: { displayName: true } } } } } },
} as const);

const parseAndSaveHashtags = async (postId: string, content: string): Promise<void> => {
  const tagMatches = content.match(/#[\u0600-\u06FFa-zA-Z0-9_]+/g) || [];
  const tags = [...new Set(tagMatches.map(t => t.slice(1).toLowerCase()))];
  if (tags.length === 0) return;
  for (const tag of tags) {
    const hashtag = await prisma.hashtag.upsert({
      where: { tag },
      update: { postCount: { increment: 1 } },
      create: { tag, postCount: 1 },
    });
    await prisma.postHashtag.upsert({
      where: { postId_hashtagId: { postId, hashtagId: hashtag.id } },
      update: {},
      create: { postId, hashtagId: hashtag.id },
    });
  }
};

const parseMentions = async (postId: string, content: string, authorId: string): Promise<void> => {
  const mentionMatches = content.match(/@[\u0600-\u06FFa-zA-Z0-9_]+/g) || [];
  const names = [...new Set(mentionMatches.map(m => m.slice(1)))].slice(0, 10);
  if (names.length === 0) return;
  const profiles = await prisma.profile.findMany({
    where: {
      displayName: { in: names, mode: 'insensitive' },
      userId: { not: authorId },
    },
    select: { userId: true, displayName: true },
  });
  if (profiles.length === 0) return;
  const authorName = await getUserDisplayName(authorId);
  await Promise.allSettled(profiles.map(async (profile) => {
    await prisma.postMention.upsert({
      where: { postId_userId: { postId, userId: profile.userId } },
      update: {},
      create: { postId, userId: profile.userId },
    });
    createNotification({
      userId: profile.userId,
      type: 'post_mention',
      titleAr: 'تم ذكرك في منشور',
      titleEn: 'You were mentioned in a post',
      bodyAr: `ذكرك ${authorName} في منشور`,
      bodyEn: `${authorName} mentioned you in a post`,
      data: { postId, authorId },
    });
  }));
};

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, mediaUrls, privacy, allowedUserIds } = req.body;
    if (!content?.trim() && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({ error: 'EMPTY_CONTENT', message: 'Post content or media is required' });
    }
    const postPrivacy: string = privacy || 'PUBLIC';
    const post = await prisma.post.create({
      data: {
        userId: req.userId!,
        content,
        mediaUrls: mediaUrls || [],
        privacy: postPrivacy as any,
        ...(postPrivacy === 'SELECTED' && allowedUserIds?.length
          ? { allowedUsers: { create: allowedUserIds.map((uid: string) => ({ userId: uid })) } }
          : {}),
      },
      include: postIncludeFull(req.userId!),
    });
    Promise.all([
      parseAndSaveHashtags(post.id, content || ''),
      parseMentions(post.id, content || '', req.userId!),
    ]).catch(err => console.error('Post processing error:', err));
    res.status(201).json(post);
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to create post' });
  }
};

const privacyFilter = (userId: string, followingIds: string[]): Prisma.PostWhereInput[] => [
  { privacy: 'PUBLIC' as any },
  { userId },
  { privacy: 'CONNECTIONS' as any, userId: { in: followingIds } },
  { privacy: 'SELECTED' as any, allowedUsers: { some: { userId } } },
];

export const getFeed = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const follows = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const followingIds = follows.map(f => f.followingId);

    const blockedIds = await prisma.block.findMany({
      where: { OR: [{ blockerId: req.userId }, { blockedId: req.userId }] },
      select: { blockerId: true, blockedId: true },
    }).then(blocks => blocks.flatMap(b => [b.blockerId, b.blockedId]).filter(id => id !== req.userId));

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          userId: { notIn: blockedIds },
          OR: [
            { userId: { in: followingIds }, privacy: 'PUBLIC' as any },
            { userId: { in: followingIds }, privacy: 'CONNECTIONS' as any },
            { userId: req.userId },
            { privacy: 'SELECTED' as any, allowedUsers: { some: { userId: req.userId! } } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: postInclude(req.userId!),
      }),
      prisma.post.count({
        where: {
          userId: { notIn: blockedIds },
          OR: [
            { userId: { in: followingIds }, privacy: 'PUBLIC' as any },
            { userId: { in: followingIds }, privacy: 'CONNECTIONS' as any },
            { userId: req.userId },
            { privacy: 'SELECTED' as any, allowedUsers: { some: { userId: req.userId! } } },
          ],
        },
      }),
    ]);
    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get feed error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get feed' });
  }
};

export const getExploreFeed = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    const blockedIds = await prisma.block.findMany({
      where: { OR: [{ blockerId: req.userId }, { blockedId: req.userId }] },
      select: { blockerId: true, blockedId: true },
    }).then(blocks => blocks.flatMap(b => [b.blockerId, b.blockedId]).filter(id => id !== req.userId));

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
          userId: { notIn: blockedIds },
          OR: [
            { privacy: 'PUBLIC' as any },
            { userId: req.userId },
            { privacy: 'SELECTED' as any, allowedUsers: { some: { userId: req.userId! } } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: postInclude(req.userId!),
      }),
      prisma.post.count({
        where: {
          userId: { notIn: blockedIds },
          OR: [
            { privacy: 'PUBLIC' as any },
            { userId: req.userId },
            { privacy: 'SELECTED' as any, allowedUsers: { some: { userId: req.userId! } } },
          ],
        },
      }),
    ]);
    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get explore error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get explore feed' });
  }
};

export const getPost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: id(req) },
      include: {
        user: { select: { id: true, roles: true, subscriptionPlan: true, isOnline: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
        _count: { select: { likes: true, comments: true, saves: true } },
        ...(req.userId ? {
          likes: { where: { userId: req.userId }, take: 1 },
          saves: { where: { userId: req.userId }, take: 1 },
        } : {}),
        hashtags: { include: { hashtag: { select: { tag: true } } } },
      },
    });
    if (!post) return res.status(404).json({ error: 'NOT_FOUND', message: 'Post not found' });
    if (!(await canView(post, req.userId))) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You cannot view this post' });
    }

    if (req.userId && req.userId !== post.userId) {
      prisma.postView.upsert({
        where: { postId_userId: { postId: post.id, userId: req.userId } },
        update: { viewedAt: new Date() },
        create: { postId: post.id, userId: req.userId },
      }).then(async () => {
        const viewCount = await prisma.postView.count({ where: { postId: post.id } });
        prisma.post.update({ where: { id: post.id }, data: { viewCount } }).catch(() => {});
      }).catch(() => {});
    }

    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get post' });
  }
};

export const getComments = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const skip = (page - 1) * limit;

    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true, privacy: true } });
    if (!post || !(await canView(post, req.userId))) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }

    const [comments, total] = await Promise.all([
      prisma.postComment.findMany({
        where: { postId, parentId: null },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, roles: true, subscriptionPlan: true, isOnline: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
          _count: { select: { replies: true, likes: true } },
          ...(req.userId ? { likes: { where: { userId: req.userId }, take: 1 } } : {}),
          replies: {
            take: 3,
            orderBy: { createdAt: 'asc' },
            include: {
              user: { select: { id: true, roles: true, subscriptionPlan: true, isOnline: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
              _count: { select: { likes: true } },
              ...(req.userId ? { likes: { where: { userId: req.userId }, take: 1 } } : {}),
            },
          },
        },
      }),
      prisma.postComment.count({ where: { postId, parentId: null } }),
    ]);

    return res.json({ comments, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get comments error:', error);
    return res.status(500).json({ error: 'INTERNAL', message: 'Failed to get comments' });
  }
};

export const sharePost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const { content } = req.body;

    const original = await prisma.post.findUnique({ where: { id: postId } });
    if (!original) return res.status(404).json({ error: 'NOT_FOUND', message: 'Post not found' });
    if (!(await canView(original, req.userId))) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You cannot share this post' });
    }

    const shared = await prisma.post.create({
      data: {
        userId: req.userId!,
        content: content?.trim() || '',
        mediaUrls: [],
        privacy: 'PUBLIC' as any,
        sharedPostId: postId,
      },
      include: postIncludeFull(req.userId!),
    });
    res.status(201).json(shared);
  } catch (error) {
    console.error('Share post error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to share post' });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { userId: true, mediaUrls: true, privacy: true } });
    if (!post || post.userId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your post' });
    }
    const { content, mediaUrls, privacy, allowedUserIds } = req.body;
    if (content !== undefined && !content?.trim() && (!mediaUrls || mediaUrls.length === 0)) {
      return res.status(400).json({ error: 'EMPTY_CONTENT', message: 'Post content or media is required' });
    }
    if (privacy === 'SELECTED') {
      await prisma.postPrivacyUser.deleteMany({ where: { postId } });
    }
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        ...(content !== undefined ? { content } : {}),
        ...(mediaUrls !== undefined ? { mediaUrls } : {}),
        ...(privacy !== undefined ? { privacy: privacy as any } : {}),
        ...(privacy === 'SELECTED' && allowedUserIds?.length
          ? { allowedUsers: { create: allowedUserIds.map((uid: string) => ({ userId: uid })) } }
          : {}),
      },
      include: postIncludeFull(req.userId!),
    });
    if (mediaUrls !== undefined) {
      const removedUrls = post.mediaUrls.filter((u: string) => !(mediaUrls as string[]).includes(u));
      removedUrls.forEach((url: string) => deleteFile(url));
    }
    res.json(updated);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to update post' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.post.findUnique({
      where: { id: id(req) },
      select: { id: true, userId: true, mediaUrls: true, hashtags: { include: { hashtag: true } } },
    });
    if (!post || post.userId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your post' });
    }
    await prisma.post.delete({ where: { id: id(req) } });
    post.mediaUrls.forEach(url => deleteFile(url));
    if (post.hashtags?.length > 0) {
      await prisma.$transaction(
        post.hashtags.map(ph =>
          prisma.hashtag.update({
            where: { id: ph.hashtagId },
            data: { postCount: { decrement: 1 } },
          })
        )
      );
    }
    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete post' });
  }
};

export const toggleLike = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true, privacy: true } });
    if (!post || !(await canView(post, req.userId!))) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot like this post' });
    }
    const existing = await prisma.postLike.findUnique({ where: { postId_userId: { postId, userId: req.userId! } } });
    if (existing) {
      await prisma.postLike.delete({ where: { id: existing.id } });
      res.json({ liked: false });
    } else {
      await prisma.postLike.create({ data: { postId, userId: req.userId! } });
      if (post.userId !== req.userId) {
        const name = await getUserDisplayName(req.userId!);
        notifyPostLike(post.userId, name, postId);
      }
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to toggle like' });
  }
};

export const addComment = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true, privacy: true } });
    if (!post || !(await canView(post, req.userId!))) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Cannot comment on this post' });
    }
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: 'EMPTY_COMMENT', message: 'Comment content is required' });
    }
    const comment = await prisma.postComment.create({
      data: { postId, userId: req.userId!, content },
      include: { user: { select: { id: true, roles: true, subscriptionPlan: true, isOnline: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } } },
    });
    if (post.userId !== req.userId) {
      const name = await getUserDisplayName(req.userId!);
      notifyPostComment(post.userId, name, postId);
    }
    res.status(201).json(comment);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to add comment' });
  }
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  try {
    const commentId = req.params.commentId as string;
    const postId = req.params.id as string;
    const comment = await prisma.postComment.findUnique({
      where: { id: commentId },
      include: { post: { select: { userId: true } } },
    });
    if (!comment) return res.status(404).json({ error: 'NOT_FOUND' });
    const isCommentAuthor = comment.userId === req.userId;
    const isPostOwner = comment.post?.userId === req.userId;
    if (!isCommentAuthor && !isPostOwner) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your comment or post' });
    }
    await prisma.postComment.delete({ where: { id: commentId } });
    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to delete comment' });
  }
};

export const toggleFollow = async (req: AuthRequest, res: Response) => {
  try {
    const followingId = id(req);
    if (followingId === req.userId) {
      return res.status(400).json({ error: 'SELF_FOLLOW', message: 'Cannot follow yourself' });
    }
    const existing = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: req.userId!, followingId } } });
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      res.json({ following: false });
    } else {
      await prisma.follow.create({ data: { followerId: req.userId!, followingId } });
      const name = await getUserDisplayName(req.userId!);
      notifyNewFollower(followingId, name);
      res.json({ following: true });
    }
  } catch (error) {
    console.error('Toggle follow error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to toggle follow' });
  }
};

export const getFollowers = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.params.userId as string) || req.userId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const [followers, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        include: { follower: { select: { id: true, roles: true, subscriptionPlan: true, isOnline: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);
    res.json({ followers: followers.map(f => ({ ...f.follower, followedAt: f.createdAt })), total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get followers' });
  }
};

export const getFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.params.userId as string) || req.userId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, parseInt(req.query.limit as string) || 20);
    const [following, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        include: { following: { select: { id: true, roles: true, subscriptionPlan: true, isOnline: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.follow.count({ where: { followerId: userId } }),
    ]);
    res.json({ following: following.map(f => ({ ...f.following, followedAt: f.createdAt })), total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get following' });
  }
};

export const getUserPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.params.userId as string) || req.userId!;
    const viewerId = req.userId!;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true },
    });
    if (!targetUser?.isActive) {
      return res.json({ posts: [], total: 0, page: 1, totalPages: 0 });
    }

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const isOwner = viewerId === userId;

    const followExists = isOwner ? false : await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
    });
    const visibility: any[] = [{ privacy: 'PUBLIC' as any }, { privacy: 'SELECTED' as any, allowedUsers: { some: { userId: viewerId } } }];
    if (followExists) visibility.push({ privacy: 'CONNECTIONS' as any });
    const where = isOwner ? { userId } : { userId, OR: visibility };
    const [posts, total] = await Promise.all([
      prisma.post.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit, include: postInclude(viewerId) }),
      prisma.post.count({ where }),
    ]);
    res.json({ posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get user posts error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get user posts' });
  }
};

export const getReputation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.params.userId as string) || req.userId!;
    const [likesAgg, postCount, followerCount] = await Promise.all([
      prisma.postLike.aggregate({ where: { post: { userId } }, _count: true }),
      prisma.post.count({ where: { userId } }),
      prisma.follow.count({ where: { followingId: userId } }),
    ]);
    const totalLikes = likesAgg._count ?? 0;
    res.json({ userId, totalLikes, postCount, followerCount, score: totalLikes + followerCount });
  } catch (error) {
    console.error('Get reputation error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get reputation' });
  }
};

export const updatePostPrivacy = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.userId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your post' });
    }
    const { privacy, allowedUserIds } = req.body;
    await prisma.postPrivacyUser.deleteMany({ where: { postId } });
    const updated = await prisma.post.update({
      where: { id: postId },
      data: {
        privacy: privacy || post.privacy,
        ...(privacy === 'SELECTED' && allowedUserIds?.length
          ? { allowedUsers: { create: allowedUserIds.map((uid: string) => ({ userId: uid })) } }
          : {}),
      },
      include: postIncludeFull(req.userId!),
    });
    res.json(updated);
  } catch (error) {
    console.error('Update post privacy error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to update post privacy' });
  }
};

export const addReply = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const commentId = req.params.commentId as string;
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: 'EMPTY', message: 'Reply content required' });
    const parent = await prisma.postComment.findUnique({ where: { id: commentId } });
    if (!parent || parent.postId !== postId) return res.status(404).json({ error: 'NOT_FOUND' });
    const reply = await prisma.postComment.create({
      data: { postId, userId: req.userId!, content: content.trim(), parentId: commentId },
      include: {
        user: { select: { id: true, roles: true, subscriptionPlan: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
        _count: { select: { likes: true } },
      },
    });
    if (parent.userId !== req.userId) {
      const name = await getUserDisplayName(req.userId!);
      createNotification({
        userId: parent.userId,
        type: 'comment_reply',
        titleAr: 'رد جديد على تعليقك',
        titleEn: 'New reply to your comment',
        bodyAr: `رد ${name} على تعليقك`,
        bodyEn: `${name} replied to your comment`,
        data: { postId, commentId, replyId: reply.id },
      });
    }
    return res.status(201).json(reply);
  } catch (error) {
    console.error('Add reply error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const getReplies = async (req: AuthRequest, res: Response) => {
  try {
    const commentId = req.params.commentId as string;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const [replies, total] = await Promise.all([
      prisma.postComment.findMany({
        where: { parentId: commentId },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: { select: { id: true, roles: true, subscriptionPlan: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
          _count: { select: { likes: true } },
          ...(req.userId ? { likes: { where: { userId: req.userId }, take: 1 } } : {}),
        },
      }),
      prisma.postComment.count({ where: { parentId: commentId } }),
    ]);
    return res.json({ replies, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get replies error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const toggleCommentLike = async (req: AuthRequest, res: Response) => {
  try {
    const commentId = req.params.commentId as string;
    const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
    if (!comment) return res.status(404).json({ error: 'NOT_FOUND' });
    const existing = await prisma.postCommentLike.findUnique({
      where: { commentId_userId: { commentId, userId: req.userId! } },
    });
    if (existing) {
      await prisma.postCommentLike.delete({ where: { id: existing.id } });
      return res.json({ liked: false });
    } else {
      await prisma.postCommentLike.create({ data: { commentId, userId: req.userId! } });
      return res.json({ liked: true });
    }
  } catch (error) {
    console.error('Toggle comment like error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const toggleSave = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true, userId: true, privacy: true } });
    if (!post || !(await canView(post, req.userId!))) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    const existing = await prisma.postSave.findUnique({
      where: { postId_userId: { postId, userId: req.userId! } },
    });
    if (existing) {
      await prisma.postSave.delete({ where: { id: existing.id } });
      return res.json({ saved: false });
    } else {
      await prisma.postSave.create({ data: { postId, userId: req.userId! } });
      return res.json({ saved: true });
    }
  } catch (error) {
    console.error('Toggle save error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const getSavedPosts = async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const [saves, total] = await Promise.all([
      prisma.postSave.findMany({
        where: { userId: req.userId },
        orderBy: { savedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { post: { include: postInclude(req.userId!) } },
      }),
      prisma.postSave.count({ where: { userId: req.userId } }),
    ]);
    return res.json({ posts: saves.map(s => s.post), total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get saved posts error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const reportPost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const { reason, details } = req.body;
    if (!reason) return res.status(400).json({ error: 'VALIDATION', message: 'Reason is required' });
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: 'NOT_FOUND' });
    if (post.userId === req.userId) return res.status(400).json({ error: 'SELF_REPORT', message: 'Cannot report your own post' });
    const existing = await prisma.postReport.findUnique({
      where: { postId_reporterId: { postId, reporterId: req.userId! } },
    });
    if (existing) return res.status(409).json({ error: 'DUPLICATE', messageAr: 'لقد أبلغت عن هذا المنشور بالفعل', messageEn: 'Already reported' });
    const report = await prisma.postReport.create({
      data: { postId, reporterId: req.userId!, reason, details },
    });
    return res.status(201).json(report);
  } catch (error) {
    console.error('Report post error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const toggleBlock = async (req: AuthRequest, res: Response) => {
  try {
    const blockedId = req.params.userId as string;
    if (blockedId === req.userId) return res.status(400).json({ error: 'INVALID', message: 'Cannot block yourself' });
    const existing = await prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: req.userId!, blockedId } },
    });
    if (existing) {
      await prisma.block.delete({ where: { id: existing.id } });
      return res.json({ blocked: false });
    } else {
      await prisma.$transaction([
        prisma.follow.deleteMany({
          where: {
            OR: [
              { followerId: req.userId!, followingId: blockedId },
              { followerId: blockedId, followingId: req.userId! },
            ],
          },
        }),
        prisma.block.create({ data: { blockerId: req.userId!, blockedId } }),
      ]);
      return res.json({ blocked: true });
    }
  } catch (error) {
    console.error('Toggle block error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const getBlockedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const blocks = await prisma.block.findMany({
      where: { blockerId: req.userId },
      include: {
        blocked: { select: { id: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(blocks.map(b => ({ ...b.blocked, blockedAt: b.createdAt })));
  } catch (error) {
    console.error('Get blocked users error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId as string;
    if (req.userId) {
      const block = await prisma.block.findFirst({
        where: {
          OR: [
            { blockerId: req.userId, blockedId: targetUserId },
            { blockerId: targetUserId, blockedId: req.userId },
          ],
        },
      });
      if (block) return res.status(403).json({ error: 'BLOCKED' });
    }
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        roles: true,
        subscriptionPlan: true,
        isVerified: true,
        isOnline: true,
        isActive: true,
        lastSeenAt: true,
        bio: true,
        tagline: true,
        websiteUrl: true,
        createdAt: true,
        profile: {
          select: {
            displayName: true,
            city: true,
            countryOfResidence: true,
            photos: { where: { isPrimary: true }, take: 1 },
          },
        },
        _count: { select: { posts: true, followers: true, following: true } },
      },
    });
    if (!user || !user.isActive) {
      return res.status(404).json({ error: 'NOT_FOUND' });
    }
    let isFollowing = false;
    let isBlocked = false;
    if (req.userId && req.userId !== targetUserId) {
      const [follow, block] = await Promise.all([
        prisma.follow.findUnique({ where: { followerId_followingId: { followerId: req.userId, followingId: targetUserId } } }),
        prisma.block.findUnique({ where: { blockerId_blockedId: { blockerId: req.userId, blockedId: targetUserId } } }),
      ]);
      isFollowing = !!follow;
      isBlocked = !!block;
    }
    return res.json({ ...user, isFollowing, isBlocked });
  } catch (error) {
    console.error('Get user profile error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const updateSocialBio = async (req: AuthRequest, res: Response) => {
  try {
    const { bio, tagline, websiteUrl } = req.body;
    const updated = await prisma.user.update({
      where: { id: req.userId! },
      data: {
        ...(bio !== undefined ? { bio } : {}),
        ...(tagline !== undefined ? { tagline } : {}),
        ...(websiteUrl !== undefined ? { websiteUrl } : {}),
      },
      select: { id: true, bio: true, tagline: true, websiteUrl: true },
    });
    return res.json(updated);
  } catch (error) {
    console.error('Update bio error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const searchUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { q } = req.query;
    if (!q || (q as string).trim().length < 2) {
      return res.status(400).json({ error: 'QUERY_TOO_SHORT' });
    }
    const blockedIds = await prisma.block.findMany({
      where: { OR: [{ blockerId: req.userId }, { blockedId: req.userId }] },
      select: { blockerId: true, blockedId: true },
    }).then(blocks => blocks.flatMap(b => [b.blockerId, b.blockedId]).filter(id => id !== req.userId));
    const profiles = await prisma.profile.findMany({
      where: {
        status: 'APPROVED',
        userId: { notIn: [...new Set(blockedIds)] },
        displayName: { contains: q as string, mode: 'insensitive' },
        user: { isActive: true },
      },
      take: 20,
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        user: { select: { id: true, roles: true, subscriptionPlan: true, isOnline: true, isVerified: true } },
      },
    });
    const followingSet = new Set(
      (await prisma.follow.findMany({
        where: { followerId: req.userId, followingId: { in: profiles.map(p => p.userId) } },
        select: { followingId: true },
      })).map(f => f.followingId)
    );
    return res.json(profiles.map(p => ({ ...p, isFollowing: followingSet.has(p.userId) })));
  } catch (error) {
    console.error('Search users error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const getSuggestedUsers = async (req: AuthRequest, res: Response) => {
  try {
    const alreadyFollowing = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const followingIds = alreadyFollowing.map(f => f.followingId);
    const blockedIds = await prisma.block.findMany({
      where: { OR: [{ blockerId: req.userId }, { blockedId: req.userId }] },
      select: { blockerId: true, blockedId: true },
    }).then(blocks => blocks.flatMap(b => [b.blockerId, b.blockedId]).filter(id => id !== req.userId));
    const excludeIds = [...new Set([req.userId!, ...followingIds, ...blockedIds])];
    const fofFollowings = await prisma.follow.findMany({
      where: { followerId: { in: followingIds }, followingId: { notIn: excludeIds }, following: { isActive: true } },
      select: { followingId: true },
      take: 50,
    });
    const fofCounts = new Map<string, number>();
    fofFollowings.forEach(f => {
      fofCounts.set(f.followingId, (fofCounts.get(f.followingId) || 0) + 1);
    });
    const topFof = [...fofCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([id]) => id);
    let userIds = topFof;
    if (userIds.length < 5) {
      const popular = await prisma.follow.groupBy({
        by: ['followingId'],
        where: { followingId: { notIn: excludeIds }, following: { isActive: true } },
        _count: { followingId: true },
        orderBy: { _count: { followingId: 'desc' } },
        take: 8,
      });
      const popularIds = popular.map(p => p.followingId).filter(id => !userIds.includes(id));
      userIds = [...userIds, ...popularIds].slice(0, 8);
    }
    const profiles = await prisma.profile.findMany({
      where: { userId: { in: userIds }, status: 'APPROVED', user: { isActive: true } },
      include: {
        photos: { where: { isPrimary: true }, take: 1 },
        user: { select: { id: true, roles: true, subscriptionPlan: true, isVerified: true, _count: { select: { followers: true } } } },
      },
      take: 8,
    });
    return res.json(profiles);
  } catch (error) {
    console.error('Get suggested users error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const getHashtagFeed = async (req: AuthRequest, res: Response) => {
  try {
    const tag = (req.params.tag as string).toLowerCase();
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 20;
    const hashtag = await prisma.hashtag.findUnique({ where: { tag } });
    if (!hashtag) return res.json({ posts: [], total: 0, page: 1, totalPages: 0 });
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { privacy: 'PUBLIC' as any, hashtags: { some: { hashtagId: hashtag.id } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: postInclude(req.userId || ''),
      }),
      prisma.post.count({
        where: { privacy: 'PUBLIC' as any, hashtags: { some: { hashtagId: hashtag.id } } },
      }),
    ]);
    return res.json({ hashtag, posts, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Get hashtag feed error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const getTrendingHashtags = async (_req: AuthRequest, res: Response) => {
  try {
    const hashtags = await prisma.hashtag.findMany({
      orderBy: { postCount: 'desc' },
      take: 15,
    });
    return res.json(hashtags);
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const togglePinPost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.userId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your post' });
    }
    if (!post.isPinned) {
      await prisma.post.updateMany({
        where: { userId: req.userId!, isPinned: true },
        data: { isPinned: false },
      });
    }
    const updated = await prisma.post.update({
      where: { id: postId },
      data: { isPinned: !post.isPinned },
    });
    return res.json({ isPinned: updated.isPinned });
  } catch (error) {
    console.error('Toggle pin error:', error);
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const uploadStoryMedia = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'NO_FILE' });
    const url = `/uploads/stories/${file.filename}`;
    const mediaType = file.mimetype.startsWith('video/') ? 'video' : 'image';
    return res.json({ url, mediaType });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const createStory = async (req: AuthRequest, res: Response) => {
  try {
    const { mediaUrl, mediaType, caption, privacy } = req.body;
    if (!mediaUrl) return res.status(400).json({ error: 'MEDIA_REQUIRED' });
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    const story = await prisma.story.create({
      data: {
        userId: req.userId!,
        mediaUrl,
        mediaType: mediaType || 'image',
        caption,
        privacy: privacy || 'FOLLOWERS',
        expiresAt,
      },
    });
    return res.status(201).json(story);
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const getStoriesFeed = async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const follows = await prisma.follow.findMany({
      where: { followerId: req.userId },
      select: { followingId: true },
    });
    const followingIds = follows.map(f => f.followingId);
    const stories = await prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        user: { isActive: true },
        OR: [
          { userId: req.userId },
          { privacy: 'PUBLIC' },
          { privacy: 'FOLLOWERS', userId: { in: followingIds } },
        ],
      },
      include: {
        user: { select: { id: true, roles: true, subscriptionPlan: true, isOnline: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
        _count: { select: { views: true } },
        ...(req.userId ? { views: { where: { userId: req.userId }, take: 1 } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    const grouped = new Map<string, any>();
    stories.forEach(story => {
      const uid = story.userId;
      if (!grouped.has(uid)) {
        grouped.set(uid, { user: story.user, stories: [], hasUnviewed: false });
      }
      const entry = grouped.get(uid);
      entry.stories.push(story);
      if (!story.views || story.views.length === 0) entry.hasUnviewed = true;
    });
    return res.json([...grouped.values()].sort((a, b) => b.hasUnviewed - a.hasUnviewed));
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const markStoryViewed = async (req: AuthRequest, res: Response) => {
  try {
    const storyId = req.params.storyId as string;
    await prisma.storyView.upsert({
      where: { storyId_userId: { storyId, userId: req.userId! } },
      update: {},
      create: { storyId, userId: req.userId! },
    });
    return res.json({ viewed: true });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL' });
  }
};

export const deleteStory = async (req: AuthRequest, res: Response) => {
  try {
    const storyId = req.params.storyId as string;
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.userId !== req.userId) return res.status(403).json({ error: 'FORBIDDEN' });
    await prisma.story.delete({ where: { id: storyId } });
    deleteFile(story.mediaUrl);
    return res.json({ message: 'Story deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'INTERNAL' });
  }
};
