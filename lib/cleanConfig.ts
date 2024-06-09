// lib/cleanConfig.ts

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

export const cleanConfig = (fullConfig: FullConfig) => {
  // Initialize namelist with top-level proxies and proxy-group names
  let namelist = new Set<string>(fullConfig.proxies.map(proxy => proxy.name))
  fullConfig['proxy-groups'].forEach(group => namelist.add(group.name))

  // Loop to remove invalid proxies and empty proxy-groups
  let previousNamelistSize
  do {
    previousNamelistSize = namelist.size

    // Remove nodes not in namelist from proxy-groups
    fullConfig['proxy-groups'].forEach((group: ProxyGroup) => {
      if (group.proxies) {
        group.proxies = group.proxies.filter(proxy => {
          return namelist.has(proxy) || proxy.toLowerCase().includes('direct')
        })
      }
    })

    // Remove empty proxy-groups
    fullConfig['proxy-groups'] = fullConfig['proxy-groups'].filter(group => group.proxies.length > 0)

    // Update namelist with new proxy-group names
    namelist = new Set<string>(fullConfig.proxies.map(proxy => proxy.name))
    fullConfig['proxy-groups'].forEach(group => namelist.add(group.name))

  } while (namelist.size !== previousNamelistSize)

  // Filter out rules not containing the remaining proxy-group names
  if (fullConfig.rules) {
    const proxyGroupNames = fullConfig['proxy-groups'].map(group => group.name)
    fullConfig.rules = fullConfig.rules.filter(rule => {
      return !rule.includes('RULE-SET') || proxyGroupNames.some(name => rule.includes(name))
    })
  }

  return fullConfig
}