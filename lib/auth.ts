// lib/auth.ts

import { Context, Next } from 'hono'
import { sql } from '@vercel/postgres'

export const authenticate = async (c: Context, next: Next) => {
  const uuid = c.req.param('uuid')

  try {
    // Query the database to check if the UUID exists in the 'nodes' table
    const { rows } = await sql`SELECT 1 FROM nodes WHERE uuid = ${uuid} LIMIT 1`

    if (rows.length === 0) {
      // UUID not found, return 403 Forbidden
      return c.json({ ok: false, error: 'Forbidden' }, 403)
    }

    // UUID found, proceed to the next middleware or handler
    await next()
  } catch (error) {
    // Handle database errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error(`Error checking UUID: ${errorMessage}`)
    return c.json({ ok: false, error: errorMessage }, 500)
  }
}