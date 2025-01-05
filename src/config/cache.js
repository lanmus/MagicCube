const NodeCache = require('node-cache');
const logger = require('../utils/logger');

// 创建缓存实例，默认过期时间为1小时
const cache = new NodeCache({
  stdTTL: 3600,
  checkperiod: 120,
  useClones: false
});

// 缓存键前缀
const CACHE_PREFIX = 'magic_cube:';

// 设置缓存
const set = (key, value, ttl = 3600) => {
  try {
    const prefixedKey = CACHE_PREFIX + key;
    return cache.set(prefixedKey, value, ttl);
  } catch (error) {
    logger.error('Error setting cache:', error);
    return false;
  }
};

// 获取缓存
const get = (key) => {
  try {
    const prefixedKey = CACHE_PREFIX + key;
    return cache.get(prefixedKey);
  } catch (error) {
    logger.error('Error getting cache:', error);
    return null;
  }
};

// 删除缓存
const del = (key) => {
  try {
    const prefixedKey = CACHE_PREFIX + key;
    return cache.del(prefixedKey);
  } catch (error) {
    logger.error('Error deleting cache:', error);
    return false;
  }
};

// 清空所有缓存
const flush = () => {
  try {
    return cache.flushAll();
  } catch (error) {
    logger.error('Error flushing cache:', error);
    return false;
  }
};

// 获取缓存统计信息
const getStats = () => {
  try {
    return cache.getStats();
  } catch (error) {
    logger.error('Error getting cache stats:', error);
    return null;
  }
};

module.exports = {
  set,
  get,
  del,
  flush,
  getStats
}; 