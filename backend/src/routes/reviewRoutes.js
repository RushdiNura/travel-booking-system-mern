import { Router } from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { listReviewsRules, createReviewRules, updateReviewRules } from '../validators/reviewValidators.js';

const router = Router();

router.get('/', listReviewsRules, validate, reviewController.listReviews);
router.post('/', protect, createReviewRules, validate, reviewController.createReview);
router.patch('/:id', protect, updateReviewRules, validate, reviewController.updateReview);
router.delete('/:id', protect, reviewController.deleteReview);

export default router;
