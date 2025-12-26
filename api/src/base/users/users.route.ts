import { Hono } from 'hono'
import usersController from './users.controller'
import { requireSuperadmin } from '../../middlewares/role.middleware'

const usersRouter = new Hono()

usersRouter.get('/', requireSuperadmin, usersController.getWithPagination)
usersRouter.get('/me', usersController.getMe)
usersRouter.get('/:id', requireSuperadmin, usersController.getById)
usersRouter.post('/', requireSuperadmin, usersController.create)
usersRouter.put('/:id', requireSuperadmin, usersController.update)
usersRouter.delete('/:id', requireSuperadmin, usersController.delete)

export default usersRouter
