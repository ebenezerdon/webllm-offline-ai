/**
 * Database utility for persistent storage using Dexie.js
 */

// Initialize Dexie database
const db = new Dexie('webllm-chat')

// Define database schema with tables and indexes
db.version(20).stores({
  conversations: '++id, timestamp',
  preferences: 'key',
  models: 'id',
})

/**
 * Save conversation history to database
 * @param {Array} conversation - Array of message objects
 * @returns {Promise<number>} - ID of saved conversation
 */
export const saveConversation = async (conversation) => {
  try {
    const id = await db.conversations.add({
      messages: conversation,
      timestamp: new Date().toISOString(),
    })
    return id
  } catch (error) {
    console.error('Failed to save conversation:', error)
    return null
  }
}

/**
 * Clear all conversations from the database
 * @returns {Promise<boolean>} - Success status
 */
export const clearConversations = async () => {
  try {
    await db.conversations.clear()
    return true
  } catch (error) {
    console.error('Failed to clear conversations:', error)
    return false
  }
}

/**
 * Get all stored conversations
 * @returns {Promise<Array>} - Array of conversation objects
 */
export const getConversations = async () => {
  try {
    return await db.conversations.orderBy('timestamp').reverse().toArray()
  } catch (error) {
    console.error('Failed to get conversations:', error)
    return []
  }
}

/**
 * Get the most recent conversation
 * @returns {Promise<Array|null>} - Array of message objects or null if none found
 */
export const getLastConversation = async () => {
  try {
    const conversations = await db.conversations
      .orderBy('timestamp')
      .reverse()
      .limit(1)
      .toArray()

    if (conversations.length > 0) {
      return conversations[0].messages
    }
    return null
  } catch (error) {
    console.error('Failed to get last conversation:', error)
    return null
  }
}

/**
 * Save user preference
 * @param {string} key - Preference key
 * @param {any} value - Preference value
 * @returns {Promise<void>}
 */
export const savePreference = async (key, value) => {
  try {
    await db.preferences.put({ key, value })
  } catch (error) {
    console.error(`Failed to save preference ${key}:`, error)
  }
}

/**
 * Get user preference
 * @param {string} key - Preference key
 * @param {any} defaultValue - Default value if preference doesn't exist
 * @returns {Promise<any>} - Preference value
 */
export const getPreference = async (key, defaultValue = null) => {
  try {
    const pref = await db.preferences.get(key)
    return pref ? pref.value : defaultValue
  } catch (error) {
    console.error(`Failed to get preference ${key}:`, error)
    return defaultValue
  }
}

/**
 * Save last used model
 * @param {string} modelId - Model ID
 * @param {Object} modelInfo - Additional model information
 * @returns {Promise<void>}
 */
export const saveLastUsedModel = async (modelId, modelInfo = {}) => {
  try {
    await db.models.put({
      id: 'lastUsed',
      modelId,
      info: modelInfo,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Failed to save last used model:', error)
  }
}

/**
 * Get last used model
 * @returns {Promise<Object|null>} - Last used model info
 */
export const getLastUsedModel = async () => {
  try {
    return await db.models.get('lastUsed')
  } catch (error) {
    console.error('Failed to get last used model:', error)
    return null
  }
}

export default db
