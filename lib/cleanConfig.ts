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
  // Helper function to update namelist
  const updateNamelist = (config: FullConfig) => {
    const namelist = new Set<string>(config.proxies.map(proxy => proxy.name));
    config['proxy-groups'].forEach(group => namelist.add(group.name));
    return namelist;
  };

  // Initialize namelist with top-level proxies and proxy-group names
  let namelist = updateNamelist(fullConfig);

  // Loop to remove invalid proxies and empty proxy-groups
  let previousNamelistSize: number;
  do {
    previousNamelistSize = namelist.size;

    // Remove nodes not in namelist from proxy-groups
    fullConfig['proxy-groups'].forEach((group: ProxyGroup) => {
      if (group.proxies) {
        group.proxies = group.proxies.filter(proxy => {
          return namelist.has(proxy) || proxy.toLowerCase().includes('direct');
        });
      }
    });

    // Remove empty proxy-groups
    fullConfig['proxy-groups'] = fullConfig['proxy-groups'].filter(group => group.proxies.length > 0);

    // Update namelist with new proxy-group names
    namelist = updateNamelist(fullConfig);

  } while (namelist.size !== previousNamelistSize);

  // Filter out rules not containing the remaining proxy-group names
  if (fullConfig.rules) {
    const proxyGroupNames = fullConfig['proxy-groups'].map(group => group.name);
    fullConfig.rules = fullConfig.rules.map(rule => {
      if (rule.includes('RULE-SET')) {
        if (rule.includes('🇺🇸 美国') && !proxyGroupNames.includes('🇺🇸 美国')) {
          return rule.replace('🇺🇸 美国', '🤖️ GPT');
        }
      }
      return rule;
    }).filter(rule => {
      return !rule.includes('RULE-SET') || proxyGroupNames.some(name => rule.includes(name));
    });
  }

  return fullConfig;
}