// MCP Godot 功能测试脚本
import { McpGodot } from './build/godot/mcpGodot.js';
import { Logger, LogLevel } from './build/utils/logger.js';

// 创建日志记录器和 MCP Godot 连接
const logger = new Logger('Test', LogLevel.INFO);
const mcpGodot = new McpGodot(logger);

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 测试通知功能
async function testNotification() {
  try {
    logger.info('发送通知...');
    const notifyResult = await mcpGodot.sendRequest('notify', {
      message: '测试通知功能',
      level: 'info'
    });
    logger.info('通知结果:', notifyResult);
    return true;
  } catch (error) {
    logger.error('通知测试失败:', error);
    return false;
  }
}

// 测试场景操作
async function testSceneOperations() {
  try {
    // 创建一个新的 3D 场景
    logger.info('创建 3D 场景...');
    const createResult = await mcpGodot.sendRequest('create_scene', {
      template: '3d'
    });
    logger.info('创建场景结果:', createResult);
    
    // 等待一段时间，以便场景加载完成
    await delay(3000);
    
    return true;
  } catch (error) {
    logger.error('场景操作测试失败:', error);
    return false;
  }
}

// 测试节点操作
async function testNodeOperations() {
  try {
    // 添加一个立方体节点
    logger.info('添加一个 CSGBox3D 节点...');
    const addResult = await mcpGodot.sendRequest('add_node', {
      node_type: 'CSGBox3D',
      node_name: 'Cube'
    });
    logger.info('添加节点结果:', addResult);
    
    // 等待一段时间，以便节点添加完成
    await delay(2000);
    
    // 获取节点路径
    const nodePath = addResult.data.node_path;
    
    // 选择节点
    logger.info('选择节点...');
    const selectResult = await mcpGodot.sendRequest('select_node', {
      node_path: nodePath
    });
    logger.info('选择节点结果:', selectResult);
    
    // 等待一段时间
    await delay(2000);
    
    // 复制节点
    logger.info('复制节点...');
    const duplicateResult = await mcpGodot.sendRequest('duplicate_node', {
      node_path: nodePath
    });
    logger.info('复制节点结果:', duplicateResult);
    
    // 等待一段时间
    await delay(2000);
    
    return true;
  } catch (error) {
    logger.error('节点操作测试失败:', error);
    return false;
  }
}

// 主测试函数
async function runTests() {
  try {
    // 连接到 Godot
    await mcpGodot.start();
    logger.info('已连接到 Godot');
    
    // 等待一段时间，确保连接稳定
    await delay(2000);
    
    // 运行通知测试
    const notificationResult = await testNotification();
    if (!notificationResult) {
      logger.warn('通知测试失败，跳过后续测试');
      return;
    }
    
    // 等待一段时间
    await delay(2000);
    
    // 运行场景操作测试
    const sceneResult = await testSceneOperations();
    if (!sceneResult) {
      logger.warn('场景操作测试失败，跳过后续测试');
      return;
    }
    
    // 等待一段时间
    await delay(2000);
    
    // 运行节点操作测试
    const nodeResult = await testNodeOperations();
    if (!nodeResult) {
      logger.warn('节点操作测试失败');
      return;
    }
    
    // 发送成功通知
    await mcpGodot.sendRequest('notify', {
      message: '测试完成！所有功能测试成功。',
      level: 'info'
    });
    
  } catch (error) {
    logger.error('测试失败:', error);
  } finally {
    // 等待一段时间，确保所有操作完成
    await delay(2000);
    
    // 关闭连接
    await mcpGodot.stop();
    logger.info('测试完成，已断开连接');
  }
}

// 运行测试
runTests();
