import { Hono } from 'hono'
import authController from './auth.controller'
import { authMiddleware } from '../../middlewares/auth.middleware'

const authRouter = new Hono()

authRouter.post('/login', authController.login)
authRouter.post('/refresh', authController.refresh)
authRouter.post('/logout', authMiddleware, authController.logout)

export default authRouter
