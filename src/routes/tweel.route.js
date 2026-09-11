import {Router} from 'express';
import { createTweet , updateTweet , deleteTweet , getUserTweet} from '../controllers/tweet.controller.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();
router.use(verifyToken);
router.route('/').post(createTweet);
router.route("/user/:userId").get(getUserTweet);
router.route('/:id').put(updateTweet).delete(deleteTweet);
export default router;
