import { Hono } from 'hono'
import rolesController from './roles.controller'

const rolesRouter = new Hono()

rolesRouter.get('/', rolesController.getWithPagination)
rolesRouter.get('/:id', rolesController.getById)

export default rolesRouter
