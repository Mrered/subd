// lib/getConfig.ts

import yaml from 'js-yaml'

const getPrivateConfig = async () => {
  const configUrl = process.env.PRIVATE_CONFIG
  if (!configUrl) {
    throw new Error('PRIVATE_CONFIG environment variable is not set')
  }

  try {
    const response = await fetch(configUrl)
    const configContent = await response.text()
    return yaml.load(configContent) as Record<string, any>
  } catch (error) {
    console.error('Error fetching private config:', error)
    throw new Error('Failed to fetch private config')
  }
}

const getGeneralConfig = async () => {
  const configUrl = process.env.GENERAL_CONFIG
  if (!configUrl) {
    throw new Error('GENERAL_CONFIG environment variable is not set')
  }

  try {
    const response = await fetch(configUrl)
    const configContent = await response.text()
    return yaml.load(configContent) as Record<string, any>
  } catch (error) {
    console.error('Error fetching general config:', error)
    throw new Error('Failed to fetch general config')
  }
}

export { getPrivateConfig, getGeneralConfig }