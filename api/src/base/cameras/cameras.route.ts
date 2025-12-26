import { Hono } from 'hono'
import camerasController from './cameras.controller'
import { requireSuperadmin } from '../../middlewares/role.middleware'

const camerasRouter = new Hono()

camerasRouter.get('/', requireSuperadmin, camerasController.getWithPagination)
camerasRouter.get('/:id', requireSuperadmin, camerasController.getById)
camerasRouter.post('/', requireSuperadmin, camerasController.create)
camerasRouter.put('/:id', requireSuperadmin, camerasController.update)
camerasRouter.delete('/:id', requireSuperadmin, camerasController.delete)

export default camerasRouter
