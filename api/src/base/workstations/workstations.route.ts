import { Hono } from 'hono'
import workstationsController from './workstations.controller'
import { requireSuperadmin } from '../../middlewares/role.middleware'

const workstationsRouter = new Hono()

workstationsRouter.get('/', requireSuperadmin, workstationsController.getWithPagination)
workstationsRouter.get('/:id', requireSuperadmin, workstationsController.getById)
workstationsRouter.post('/', requireSuperadmin, workstationsController.create)
workstationsRouter.put('/:id', requireSuperadmin, workstationsController.update)
workstationsRouter.delete('/:id', requireSuperadmin, workstationsController.delete)

export default workstationsRouter
