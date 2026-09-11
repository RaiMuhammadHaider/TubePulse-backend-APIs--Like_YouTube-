import {Router} from 'express';
// import { verifyToken } from '../middlewares/verifyToken.js';
import { verifyJwt } from '../middlewares/auth.middleware.js';
import {   getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription} from '../controllers/subscription.controller.js';

const router = Router();
router.use(verifyJwt); 


router.route('/c/:id').get(getSubscribedChannels).post(toggleSubscription);
router.route('/c/:id/subscribers').get(getUserChannelSubscribers);
export default router;
