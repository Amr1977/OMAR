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

router.get('/posts/:id', optionalAuth, getPost);
router.get('/hashtag/:tag', optionalAuth, getHashtagFeed);

router.use(authenticate);
router.use(socialLimiter);

router.post('/posts/media', uploadMedia.single('media'), uploadPostMedia);
router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.delete('/posts/:id', deletePost);
router.get('/feed', getFeed);
router.get('/explore', getExploreFeed);
router.patch('/posts/:id/privacy', updatePostPrivacy);
router.post('/posts/:id/like', toggleLike);
router.post('/posts/:id/share', sharePost);
router.post('/posts/:id/save', toggleSave);
router.post('/posts/:id/report', reportPost);
router.post('/posts/:id/pin', togglePinPost);

router.get('/posts/:id/comments', getComments);
router.post('/posts/:id/comments', addComment);
router.delete('/posts/:id/comments/:commentId', deleteComment);
router.get('/posts/:id/comments/:commentId/replies', getReplies);
router.post('/posts/:id/comments/:commentId/replies', addReply);
router.post('/comments/:commentId/like', toggleCommentLike);

router.get('/saved', getSavedPosts);

router.get('/users/search', searchUsers);
router.get('/users/suggested', getSuggestedUsers);
router.get('/users/:userId/profile', optionalAuth, getUserProfile);
router.put('/me/bio', updateSocialBio);

router.post('/follow/:userId', toggleFollow);
router.get('/followers', getFollowers);
router.get('/followers/:userId', getFollowers);
router.get('/following', getFollowing);
router.get('/following/:userId', getFollowing);

router.post('/block/:userId', toggleBlock);
router.get('/blocked', getBlockedUsers);

router.get('/user/:userId/posts', getUserPosts);
router.get('/user/:userId/reputation', getReputation);
router.get('/reputation', getReputation);

router.get('/hashtags/trending', getTrendingHashtags);

router.post('/stories/media', uploadStory.single('media'), uploadStoryMedia);
router.post('/stories', createStory);
router.get('/stories/feed', getStoriesFeed);
router.post('/stories/:storyId/view', markStoryViewed);
router.delete('/stories/:storyId', deleteStory);

export default router;
