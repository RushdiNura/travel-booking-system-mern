import { Router } from 'express';
import * as packageController from '../controllers/packageController.js';
import { validate } from '../middleware/validate.js';
import { searchPackagesRules, packageIdParamRules } from '../validators/packageValidators.js';

const router = Router();

router.get('/', searchPackagesRules, validate, packageController.searchPackages);
router.get('/:id', packageIdParamRules, validate, packageController.getPackageById);

export default router;
