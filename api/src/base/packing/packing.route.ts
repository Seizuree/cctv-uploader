import { Hono } from 'hono'
import packingController from './packing.controller'
import { requireSuperadmin, requireOperator } from '../../middlewares/role.middleware'

const packingRouter = new Hono()

packingRouter.get('/', packingController.getWithPagination)
packingRouter.get('/:id', packingController.getById)
packingRouter.post('/scan/start', requireOperator, packingController.scanStart)
packingRouter.post('/scan/end', requireOperator, packingController.scanEnd)
packingRouter.post('/:id/process', requireSuperadmin, packingController.processItem)

export default packingRouter
