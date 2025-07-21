import mysql from 'mysql2/promise'

let connection = null

export async function getDbConnection() {
  if (!connection) {
    try {
      const config = useRuntimeConfig()
      console.log('Connecting to database with config:', {
        host: config.dbHost,
        user: config.dbUser,
        database: config.dbName
      })
      
      connection = await mysql.createConnection({
        host: config.dbHost,
        user: config.dbUser,
        password: config.dbPassword,
        database: config.dbName
      })
      
      console.log('Database connection established successfully')
    } catch (error) {
      console.error('Database connection failed:', error)
      throw error
    }
  }
  return connection
}

export async function executeQuery(query, params = []) {
  try {
    const db = await getDbConnection()
    const [results] = await db.execute(query, params)
    return results
  } catch (error) {
    console.error('Query execution failed:', error)
    console.error('Query:', query)
    console.error('Params:', params)
    throw error
  }
}