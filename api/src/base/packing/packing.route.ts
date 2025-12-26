import { Hono } from 'hono'
import packingController from './packing.controller'
import { requireSuperadmin, requireOperator } from '../../middlewares/role.middleware'

const packingRouter = new Hono()

packingRouter.get('/', packingController.getWithPagination)
packingRouter.get('/:id', packingController.getById)
packingRouter.post('/scan', requireOperator, packingController.scan)
packingRouter.post('/:id/reprocess', requireSuperadmin, packingController.reprocess)

export default packingRouter
