require('dotenv').config();

const config = {
    database: {
        host: process.env.DB_HOST || 'test-db-mysql.ns-1zqit96y.svc',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '2k699fw4',
        port: process.env.DB_PORT || 3306
    },
    objectStorage: {
        accessKey: '1zqit96y',
        secretKey: 'c4t9cdxqzcx64wr8',
        internal: 'object-storage.objectstorage-system.svc.cluster.local',
        external: 'objectstorageapi.hzh.sealos.run'
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '24h'
    }
};

// 如果是测试环境，使用测试配置
if (process.env.NODE_ENV === 'test') {
    Object.assign(config.database, {
        host: process.env.TEST_DB_HOST || 'test-db-mysql.ns-1zqit96y.svc',
        port: parseInt(process.env.TEST_DB_PORT || '3306'),
        user: process.env.TEST_DB_USER || 'root',
        password: process.env.TEST_DB_PASSWORD || '2k699fw4',
        multipleStatements: true      // 允许多条SQL语句
    });
}

module.exports = config; 