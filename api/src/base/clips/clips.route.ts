import { Hono } from 'hono'
import clipsController from './clips.controller'
import { requireOperator } from '../../middlewares/role.middleware'

const clipsRouter = new Hono()

clipsRouter.get('/', requireOperator, clipsController.getWithPagination)
clipsRouter.get('/:id', requireOperator, clipsController.getById)
clipsRouter.get('/:id/url', requireOperator, clipsController.getSignedUrl)

export default clipsRouter
