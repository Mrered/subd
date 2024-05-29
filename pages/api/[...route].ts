// pages/api/[...route].ts

import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { sql } from '@vercel/postgres'
import { authenticate } from '../../lib/auth'
import yaml2sub from '../../lib/yaml2sub'
import { getPrivateConfig, getGeneralConfig } from '../../lib/getConfig'
import { cleanConfig } from '../../lib/cleanConfig'
import yaml from 'js-yaml'

interface ProxyGroup {
  name: string
  type: string
  proxies: string[]
}

interface FullConfig {
  proxies: any[]
  'proxy-groups': ProxyGroup[]
  rules?: string[]
}

export const config = {
  runtime: 'edge'
}

const app = new Hono().basePath('/api')

// Existing route
app.get('/hello', (c) => {
  return c.json({
    ok: true,
    message: 'Hello from Hono!'
  })
})

// New route to handle GET /api/:uuid
app.get('/:uuid', authenticate, async (c) => {
  const uuid = c.req.param('uuid')
  const n = c.req.query('n')

  // Fetch user data from the database
  const { rows } = await sql`SELECT nodename, url FROM nodes WHERE uuid = ${uuid}`
  const allUserData = rows.reduce((acc, row) => {
    acc[row.nodename] = row.url
    return acc
  }, {} as { [key: string]: string })

  let userData: { [key: string]: string } = {}

  if (n) {
    // If node parameter is provided, filter the user data
    const nodeNames = n.split('+')
    nodeNames.forEach(nodename => {
      if (allUserData[nodename]) {
        userData[nodename] = allUserData[nodename]
      }
    })
  } else {
    // If no node parameter is provided, use all data
    userData = allUserData
  }

  // Process nodes and headers
  const { proxies, headers } = await yaml2sub(userData)

  // Select configuration template
  let fullConfig: FullConfig
  const privateUuid = process.env.PRIVATE_UUID
  if (uuid === privateUuid) {
    fullConfig = await getPrivateConfig() as FullConfig
  } else {
    fullConfig = await getGeneralConfig() as FullConfig
  }

  // Ensure fullConfig.proxies is an array
  if (!Array.isArray(fullConfig.proxies)) {
    fullConfig.proxies = []
  }

  // Insert proxies correctly
  fullConfig.proxies = [...fullConfig.proxies, ...proxies]

  // Clean the configuration
  fullConfig = cleanConfig(fullConfig)

  // Set headers, including Content-Disposition for file download
  c.res.headers.set('Subscription-Userinfo', `upload=${headers.upload};download=${headers.download};total=${headers.total};expire=${headers.expire}`)
  c.res.headers.set('Content-Type', 'text/plain')
  c.res.headers.set('Content-Disposition', 'attachment; filename=config.yaml')
  const yamlString: string = yaml.dump(fullConfig)
  return c.text(yamlString)
})

// New route to handle GET /api/lookup/:uuid for testing
app.get('/lookup/:uuid', authenticate, async (c) => {
  const uuid = c.req.param('uuid')

  // Logging for debugging
  console.log(`Received request for UUID: ${uuid}`)

  try {
    // Query the database to get all records with the specified UUID
    const { rows } = await sql`SELECT * FROM nodes WHERE uuid = ${uuid}`

    // Logging for debugging
    console.log(`UUID: ${uuid}`)
    console.log(`Result: ${JSON.stringify(rows)}`)

    // Return the query result as a JSON response
    return c.json({
      ok: true,
      data: rows
    })
  } catch (error) {
    // Ensure error is an instance of Error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error(`Error querying database: ${errorMessage}`)
    return c.json({ ok: false, error: errorMessage }, 500)
  }
})

export default handle(app)