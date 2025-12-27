import { db } from './connection/db'
import { roles, users } from './connection/db/schemas'
import { eq } from 'drizzle-orm'
import { hashPassword } from './utils/hash'
import { logging } from './logger'
import { ROLE_NAMES } from './constants/roles'

async function seed() {
  logging.info('Seeding database...')

  try {
    // Check if roles already exist
    const existingRoles = await db.select().from(roles)

    if (existingRoles.length === 0) {
      // Seed roles
      logging.info('Seeding roles...')
      await db.insert(roles).values([
        {
          name: ROLE_NAMES.SUPERADMIN,
          description: 'Super Administrator with full access',
        },
        {
          name: ROLE_NAMES.OPERATOR,
          description: 'Operator for packing operations',
        },
      ])
      logging.info('Roles seeded successfully')
    } else {
      logging.info('Roles already exist, skipping...')
    }

    // Check if admin user exists
    const existingUsers = await db.select().from(users)

    if (existingUsers.length === 0) {
      // Get SUPERADMIN role
      const [superadminRole] = await db
        .select()
        .from(roles)
        .where(eq(roles.name, ROLE_NAMES.SUPERADMIN))
        .limit(1)

      if (superadminRole) {
        // Seed admin user
        logging.info('Seeding admin user...')
        const hashedPassword = await hashPassword('admin123')

        await db.insert(users).values({
          name: 'System Administrator',
          password: hashedPassword,
          email: 'admin@example.com',
          role_id: superadminRole.id,
        })
        logging.info('Admin user seeded successfully')
        logging.info('Default credentials: admin / admin123')
      }
    } else {
      logging.info('Users already exist, skipping...')
    }

    logging.info('Database seeding completed')
    process.exit(0)
  } catch (error) {
    logging.error(`Seeding failed: ${error}`)
    process.exit(1)
  }
}

seed()
