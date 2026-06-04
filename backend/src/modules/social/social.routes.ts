import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { uploadMedia } from '../../config/upload';
import {
  createPost, updatePost, getFeed, getPost, deletePost, toggleLike,
  addComment, deleteComment, toggleFollow, getFollowers, getFollowing,
  getUserPosts, getReputation, getExploreFeed, updatePostPrivacy,
  uploadPostMedia,
} from './social.controller';

const router = Router();

router.use(authenticate);

router.post('/posts/media', uploadMedia.single('media'), uploadPostMedia);
router.post('/posts', createPost);
router.put('/posts/:id', updatePost);
router.get('/feed', getFeed);
router.get('/explore', getExploreFeed);
router.get('/posts/:id', getPost);
router.delete('/posts/:id', deletePost);
router.post('/posts/:id/like', toggleLike);
router.post('/posts/:id/comments', addComment);
router.delete('/posts/:id/comments/:commentId', deleteComment);
router.post('/follow/:userId', toggleFollow);
router.get('/followers', getFollowers);
router.get('/followers/:userId', getFollowers);
router.get('/following', getFollowing);
router.get('/following/:userId', getFollowing);
router.get('/user/:userId/posts', getUserPosts);
router.get('/user/:userId/reputation', getReputation);
router.get('/reputation', getReputation);
router.patch('/posts/:id/privacy', updatePostPrivacy);

export default router;
