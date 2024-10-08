// lib/yaml2sub.ts

interface UserData {
  [key: string]: string
}

interface ProxyConfig {
  name: string
  type: string
  server: string
  port: number
  alpn: string[]
  uuid: string
  servername: string
  tls: boolean
  client_fingerprint: string
  flow: string
  udp: boolean
  skip_cert_verify: boolean
  network: string
  reality_opts: {
    public_key: string
    short_id: string
  }
}

interface Headers {
  upload: number
  download: number
  total: number
  expire: number | null
}

interface Result {
  proxies: ProxyConfig[]
  headers: Headers
  rawProxies?: string[]
}

const fetchWithTimeout = async (url: string, timeout: number) => {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  
  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(id)
    return response
  } catch (error) {
    clearTimeout(id)
    throw error
  }
}

const yaml2sub = async (userData: UserData, clientType: string): Promise<Result> => {
  const startTime = Date.now()
  const proxies: ProxyConfig[] = []
  const rawProxies: string[] = []
  let uploadSum = 0
  let downloadSum = 0
  let totalSum = 0
  let expireMin = Infinity

  const fetchPromises = Object.entries(userData).map(async ([nodename, url]) => {
    try {
      console.log(`[${new Date().toISOString()}] Starting fetch for ${nodename}...`)
      const fetchStartTime = Date.now()
      
      let response = await fetchWithTimeout(url, 3500) // Set timeout to 3.5 seconds

      // Check if the status code is greater than or equal to 400
      if (response.status >= 400) {
        console.log(`Initial fetch failed for ${nodename} with status ${response.status}. Retrying...`)
        // Replace 'whlo' with 'hd' in the domain
        const newUrl = url.replace(/\/\/(.*?)whlo/, '//$1hd')
        response = await fetchWithTimeout(newUrl, 3500) // Retry with the updated URL
  
        // If the retry also fails, log the failure and exit
        if (response.status >= 400) {
          console.log(`Retry fetch failed for ${nodename} with status ${response.status}. Skipping...`)
          return // Exit early if retry fails
        }
      }

      const content = await response.text()
      console.log(`[${new Date().toISOString()}] Fetch for ${nodename} completed in ${Date.now() - fetchStartTime} ms`)

      const proxyConfig = vless2proxy(content, nodename)
      if (proxyConfig) {
        proxies.push(proxyConfig)
      }

      // Extract and process Subscription-Userinfo header
      const userinfo = response.headers.get('subscription-userinfo')
      if (userinfo) {
        const parts = userinfo.split(';')
        parts.forEach((part: string) => {
          const [key, value] = part.split('=')
          const numValue = parseInt(value, 10)
          switch (key.trim()) {
            case 'upload':
              uploadSum += numValue
              break
            case 'download':
              downloadSum += numValue
              break
            case 'total':
              totalSum += numValue
              break
            case 'expire':
              expireMin = Math.min(expireMin, numValue)
              break
          }
        })
      }

      // Handle raw proxy line replacement if clientType is 'v'
      if (clientType === 'v') {
        const lines = content.split('\n')
        const vlessLine = lines.find(line => line.startsWith('vless://'))
        if (vlessLine) {
          const updatedLine = vlessLine.replace(/#.*$/, `#${nodename}`)
          rawProxies.push(updatedLine)
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.log(`Failed to fetch data for ${nodename}: ${error.message}`)
      } else {
        console.log(`Failed to fetch data for ${nodename}: Unknown error`)
      }
    }
  })

  // Wait for all fetch operations to complete
  await Promise.all(fetchPromises)

  const headers: Headers = {
    upload: uploadSum,
    download: downloadSum,
    total: totalSum,
    expire: expireMin === Infinity ? null : expireMin
  }

  console.log(`[${new Date().toISOString()}] yaml2sub processing completed in ${Date.now() - startTime} ms`)
  return { proxies, headers, rawProxies }
}

const vless2proxy = (content: string, nodename: string): ProxyConfig | null => {
  const lines = content.split('\n')
  const vlessLine = lines.find(line => line.startsWith('vless://'))

  if (!vlessLine) return null

  const params = new URL(vlessLine.trim())
  const uuid = params.username
  const host = params.hostname
  const port = params.port
  const queryParams = Object.fromEntries(new URLSearchParams(params.search))

  const yamlConfig: ProxyConfig = {
    name: nodename,
    type: 'vless',
    server: host,
    port: parseInt(port, 10),
    alpn: [queryParams['alpn']],
    uuid: uuid,
    servername: queryParams['sni'],
    tls: true,
    client_fingerprint: 'chrome',
    flow: queryParams['flow'],
    udp: true,
    skip_cert_verify: false,
    network: queryParams['type'],
    reality_opts: {
      public_key: queryParams['pbk'],
      short_id: queryParams['sid']
    }
  }

  return yamlConfig
}

export default yaml2sub