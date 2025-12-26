import { Hono } from 'hono'
import clipsController from './clips.controller'

const clipsRouter = new Hono()

clipsRouter.get('/', clipsController.getWithPagination)
clipsRouter.get('/:id', clipsController.getById)
clipsRouter.get('/:id/url', clipsController.getSignedUrl)

export default clipsRouter
