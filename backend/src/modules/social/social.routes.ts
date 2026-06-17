import { Router } from 'express';
import { authenticate, optionalAuth } from '../../middleware/auth';
import { uploadMedia, uploadStory } from '../../config/upload';
import { socialLimiter } from '../../middleware/rateLimiter';
import {
  createPost, updatePost, getFeed, getPost, deletePost, toggleLike,
  addComment, deleteComment, toggleFollow, getFollowers, getFollowing,
  getUserPosts, getReputation, getExploreFeed, updatePostPrivacy,
  uploadPostMedia, sharePost, getComments, addReply, getReplies,
  toggleCommentLike, toggleSave, getSavedPosts, reportPost, toggleBlock,
  getBlockedUsers, getUserProfile, updateSocialBio, searchUsers,
  getSuggestedUsers, getHashtagFeed, getTrendingHashtags, togglePinPost,
  uploadStoryMedia, createStory, getStoriesFeed, markStoryViewed, deleteStory,
} from './social.controller';

const router = Router();

// Public read-only endpoints (optional auth — works with or without token)
router.get('/posts/:id', optionalAuth, getPost);
router.get('/hashtag/:tag', optionalAuth, getHashtagFeed);
router.get('/feed', optionalAuth, getFeed);
router.get('/explore', optionalAuth, getExploreFeed);
router.get('/users/search', optionalAuth, searchUsers);
router.get('/users/suggested', optionalAuth, getSuggestedUsers);
router.get('/users/:userId/profile', optionalAuth, getUserProfile);
router.get('/hashtags/trending', getTrendingHashtags);
router.get('/user/:userId/posts', optionalAuth, getUserPosts);
router.get('/user/:userId/reputation', optionalAuth, getReputation);
router.get('/reputation', optionalAuth, getReputation);
router.get('/posts/:id/comments', optionalAuth, getComments);
router.get('/posts/:id/comments/:commentId/replies', optionalAuth, getReplies);
router.get('/followers/:userId', optionalAuth, getFollowers);
router.get('/following/:userId', optionalAuth, getFollowing);

router.use(authenticate);

router.post('/posts/media', uploadMedia.single('media'), uploadPostMedia);
router.post('/posts', socialLimiter, createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.patch('/posts/:id/privacy', updatePostPrivacy);
router.post('/posts/:id/like', socialLimiter, toggleLike);
router.post('/posts/:id/share', socialLimiter, sharePost);
router.post('/posts/:id/save', toggleSave);
router.post('/posts/:id/report', reportPost);
router.post('/posts/:id/pin', togglePinPost);

router.post('/posts/:id/comments', socialLimiter, addComment);
router.delete('/posts/:id/comments/:commentId', deleteComment);
router.post('/posts/:id/comments/:commentId/replies', socialLimiter, addReply);
router.post('/comments/:commentId/like', toggleCommentLike);

router.get('/saved', getSavedPosts);

router.put('/me/bio', updateSocialBio);

router.post('/follow/:userId', socialLimiter, toggleFollow);
router.get('/followers', getFollowers);
router.get('/following', getFollowing);

router.post('/block/:userId', toggleBlock);
router.get('/blocked', getBlockedUsers);

router.post('/stories/media', uploadStory.single('media'), uploadStoryMedia);
router.post('/stories', createStory);
router.get('/stories/feed', optionalAuth, getStoriesFeed);
router.post('/stories/:storyId/view', markStoryViewed);
router.delete('/stories/:storyId', deleteStory);

export default router;
