import { Hono } from 'hono'
import batchesController from './batches.controller'
import { requireSuperadmin } from '../../middlewares/role.middleware'

const batchesRouter = new Hono()

batchesRouter.get('/', requireSuperadmin, batchesController.getWithPagination)
batchesRouter.get('/:id', requireSuperadmin, batchesController.getById)
batchesRouter.post('/trigger', requireSuperadmin, batchesController.trigger)

export default batchesRouter
