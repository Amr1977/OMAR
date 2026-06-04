import { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { AuthRequest } from '../../middleware/auth';
import { notifyPostLike, notifyPostComment, notifyNewFollower } from '../../services/notification.service';

export const uploadPostMedia = async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'NO_FILE', message: 'No file uploaded' });
    const base64 = file.buffer.toString('base64');
    const dataUrl = `data:${file.mimetype};base64,${base64}`;
    res.json({ url: dataUrl });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to upload media' });
  }
};

const getUserDisplayName = async (userId: string) => {
  const profile = await prisma.profile.findUnique({ where: { userId }, select: { displayName: true } });
  return profile?.displayName || 'مستخدم';
};

const id = (req: AuthRequest) => req.params.id as string;

const canView = async (post: { id: string; userId: string; privacy: string }, viewerId: string): Promise<boolean> => {
  if (viewerId === post.userId) return true;
  switch (post.privacy) {
    case 'PUBLIC': return true;
    case 'PRIVATE': return false;
    case 'CONNECTIONS': {
      const follow = await prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: post.userId } },
      });
      return !!follow;
    }
    case 'SELECTED': {
      const allowed = await prisma.postPrivacyUser.findUnique({
        where: { postId_userId: { postId: post.id, userId: viewerId } },
      });
      return !!allowed;
    }
    default: return false;
  }
};

const postInclude = (userId: string) => ({
  user: { select: { id: true, role: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
  _count: { select: { likes: true, comments: true } },
  likes: { where: { userId }, take: 1 },
} as const);

const postIncludeFull = (userId: string) => ({
  ...postInclude(userId),
  allowedUsers: { include: { user: { select: { id: true, profile: { select: { displayName: true } } } } } },
} as const);

export const createPost = async (req: AuthRequest, res: Response) => {
  try {
    const { content, mediaUrls, privacy, allowedUserIds } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ error: 'EMPTY_CONTENT', message: 'Post content is required' });
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

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
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

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: {
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
        user: { select: { id: true, role: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: req.userId }, take: 1 },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, role: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } },
          },
        },
      },
    });
    if (!post) return res.status(404).json({ error: 'NOT_FOUND', message: 'Post not found' });
    if (!(await canView(post, req.userId!))) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You cannot view this post' });
    }
    res.json(post);
  } catch (error) {
    console.error('Get post error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get post' });
  }
};

export const updatePost = async (req: AuthRequest, res: Response) => {
  try {
    const postId = id(req);
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post || post.userId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your post' });
    }
    const { content, mediaUrls, privacy, allowedUserIds } = req.body;
    if (content !== undefined && !content?.trim()) {
      return res.status(400).json({ error: 'EMPTY_CONTENT', message: 'Post content cannot be empty' });
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
    res.json(updated);
  } catch (error) {
    console.error('Update post error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to update post' });
  }
};

export const deletePost = async (req: AuthRequest, res: Response) => {
  try {
    const post = await prisma.post.findUnique({ where: { id: id(req) } });
    if (!post || post.userId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your post' });
    }
    await prisma.post.delete({ where: { id: id(req) } });
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
      include: { user: { select: { id: true, role: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } } },
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
    const comment = await prisma.postComment.findUnique({ where: { id: commentId } });
    if (!comment || comment.userId !== req.userId) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Not your comment' });
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
    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: { follower: { select: { id: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(followers.map(f => ({ ...f.follower, followedAt: f.createdAt })));
  } catch (error) {
    console.error('Get followers error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get followers' });
  }
};

export const getFollowing = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.params.userId as string) || req.userId!;
    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: { following: { select: { id: true, profile: { select: { displayName: true, photos: { where: { isPrimary: true }, take: 1 } } } } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(following.map(f => ({ ...f.following, followedAt: f.createdAt })));
  } catch (error) {
    console.error('Get following error:', error);
    res.status(500).json({ error: 'INTERNAL', message: 'Failed to get following' });
  }
};

export const getUserPosts = async (req: AuthRequest, res: Response) => {
  try {
    const userId = (req.params.userId as string) || req.userId!;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const viewerId = req.userId!;
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
