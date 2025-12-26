import { Hono } from 'hono'
import { authMiddleware } from '../middlewares/auth.middleware'
import authRouter from '../base/auth/auth.route'
import usersRouter from '../base/users/users.route'
import rolesRouter from '../base/roles/roles.route'
import camerasRouter from '../base/cameras/cameras.route'
import workstationsRouter from '../base/workstations/workstations.route'
import packingRouter from '../base/packing/packing.route'
import clipsRouter from '../base/clips/clips.route'
import batchesRouter from '../base/batches/batches.route'

const router = new Hono()

// Public routes (no auth required)
router.route('/auth', authRouter)

// Protected routes (auth required)
router.use('*', authMiddleware)

router.route('/users', usersRouter)
router.route('/roles', rolesRouter)
router.route('/cameras', camerasRouter)
router.route('/workstations', workstationsRouter)
router.route('/packing-items', packingRouter)
router.route('/clips', clipsRouter)
router.route('/batch-jobs', batchesRouter)

export default router
