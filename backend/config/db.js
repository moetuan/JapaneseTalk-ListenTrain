const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;

const connectDB = async () => {
  try {
    // 从环境变量获取配置
    const dbConfig = {
      host: process.env.DB_HOST || 'mysql',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'japanesetrain_sdhaif25211gaagh',
      password: process.env.DB_PASSWORD || 'ajxprdfsAfWF6aPb',
      database: process.env.DB_NAME || 'japanesetrain_sdhaif25211gaagh'
    };
    
    // 打印连接信息（隐藏密码）
    console.log('数据库连接信息:');
    console.log('主机:', dbConfig.host);
    console.log('用户名:', dbConfig.user);
    console.log('数据库名:', dbConfig.database);
    console.log('端口:', dbConfig.port);
    
    // 1. 尝试连接到MySQL服务器（不指定数据库）
    console.log('尝试连接到MySQL服务器...');
    const testPool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      ssl: false,
      // MySQL 5.7 兼容配置
      authPlugins: {
        mysql_native_password: true
      },
      // 字符集设置
      charset: 'utf8mb4'
    });
    
    const testConnection = await testPool.getConnection();
    console.log('连接到MySQL服务器成功');
    
    // 2. 检查数据库是否存在
    console.log('检查目标数据库是否存在...');
    const [databases] = await testConnection.execute('SHOW DATABASES');
    console.log('所有数据库:', databases.map(db => db.Database));
    
    const dbExists = databases.some(db => db.Database === 'japanesetrain_sdhaif25211gaagh');
    
    if (dbExists) {
      console.log('目标数据库已存在');
    } else {
      console.log('目标数据库不存在');
    }
    
    // 3. 检查用户权限
    console.log('检查用户权限...');
    try {
      const [privileges] = await testConnection.execute('SHOW GRANTS');
      console.log('用户权限:');
      privileges.forEach(grant => {
        console.log(Object.values(grant)[0]);
      });
    } catch (grantError) {
      console.error('检查权限失败:', grantError);
    }
    
    // 4. 关闭测试连接
    testConnection.release();
    await testPool.end();
    
    // 5. 尝试连接到目标数据库
    console.log('尝试连接到目标数据库...');
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      database: dbConfig.database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 10000,
      ssl: false,
      // MySQL 5.7 兼容配置
      authPlugins: {
        mysql_native_password: true
      },
      // 字符集设置
      charset: 'utf8mb4',
      // 连接选项，确保客户端字符集正确
      typeCast: true,
      supportBigNumbers: true,
      bigNumberStrings: true
    });

    // 手动设置连接字符集
    let connection = await pool.getConnection();
    try {
      await connection.execute('SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci');
      await connection.execute('SET character_set_client = utf8mb4');
      await connection.execute('SET character_set_connection = utf8mb4');
      await connection.execute('SET character_set_results = utf8mb4');
    } finally {
      connection.release();
    }
    
    // 6. 测试连接
    console.log('测试目标数据库连接...');
    connection = await pool.getConnection();
    await connection.execute('SELECT 1');
    console.log('目标数据库连接测试成功');
    connection.release();
    
    // 7. 创建表结构
    console.log('创建表结构...');
    await createTables();
    console.log('表结构创建成功');
    
    console.log('数据库连接初始化完成');
  } catch (error) {
    console.error('数据库操作失败:', error);
    console.error('错误代码:', error.code);
    console.error('错误编号:', error.errno);
    console.error('SQL状态:', error.sqlState);
    console.error('SQL消息:', error.sqlMessage);
    
    // 检查错误类型
    if (error.code === 'ER_DBACCESS_DENIED_ERROR') {
      console.error('权限错误：用户没有访问数据库的权限');
      console.error('请检查数据库用户权限设置');
      console.error('请确保数据库已存在且用户有访问权限');
      console.error('注意：错误信息中的 \'username@%\' 是MySQL的标准用户格式，表示来自任何主机的用户');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('数据库不存在');
      console.error('请检查数据库名称是否正确');
      console.error('请确保数据库已创建');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('认证错误：用户名或密码错误');
      console.error('请检查用户名和密码是否正确');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('连接被拒绝');
      console.error('请检查数据库服务器是否运行，主机地址和端口是否正确');
    } else {
      console.error('其他错误：', error.message);
    }
    
    process.exit(1);
  }
};

const createTables = async () => {
  try {
    // 先删除旧的 users 表（如果存在）
    try {
      await pool.execute('DROP TABLE IF EXISTS users');
      console.log('已删除旧的 users 表');
    } catch (dropError) {
      console.error('删除旧表失败:', dropError);
    }
    
    // 创建用户表
    await pool.execute(`
      CREATE TABLE users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 创建文章表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS articles (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        tags VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 创建找回密码协助码表
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS password_reset_codes (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        code VARCHAR(255) NOT NULL UNIQUE,
        is_used BOOLEAN DEFAULT FALSE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // 创建管理员账号
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin', 10);
    await pool.execute(
      'INSERT INTO users (id, username, email, password, is_admin) VALUES (?, ?, ?, ?, ?)',
      [Date.now().toString(), 'admin', 'admin@example.com', hashedPassword, true]
    );
    console.log('管理员账号创建成功');
    
    console.log('表结构创建成功');
  } catch (error) {
    console.error('创建表结构失败:', error);
  }
};

const getPool = () => pool;

module.exports = { connectDB, getPool };