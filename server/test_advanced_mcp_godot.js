// MCP Godot 高级功能测试脚本
import { McpGodot } from './build/godot/mcpGodot.js';
import { Logger, LogLevel } from './build/utils/logger.js';

// 创建日志记录器和 MCP Godot 连接
const logger = new Logger('AdvTest', LogLevel.DEBUG); // 使用 DEBUG 级别以获取更多日志信息
const mcpGodot = new McpGodot(logger);

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 测试通知功能
async function testNotification() {
  try {
    logger.info('发送通知...');
    const notifyResult = await mcpGodot.sendRequest('notify', {
      message: '高级功能测试开始',
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
    
    // 保存场景
    logger.info('保存场景...');
    const saveResult = await mcpGodot.sendRequest('save_scene', {
      path: 'res://test_scene.tscn'
    });
    logger.info('保存场景结果:', saveResult);
    
    // 等待一段时间
    await delay(2000);
    
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
      node_name: 'TestCube'
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
    
    return { nodePath, success: true };
  } catch (error) {
    logger.error('节点操作测试失败:', error);
    return { success: false };
  }
}

// 测试属性操作
async function testPropertyOperations(nodePath) {
  try {
    if (!nodePath) {
      throw new Error('节点路径为空，无法测试属性操作');
    }
    
    // 设置节点属性
    logger.info('设置节点属性...');
    const setPropertyResult = await mcpGodot.sendRequest('set_property', {
      node_path: nodePath,
      property: 'size',
      value: { x: 2, y: 2, z: 2 }
    });
    logger.info('设置属性结果:', setPropertyResult);
    
    // 等待一段时间
    await delay(2000);
    
    // 获取节点属性
    logger.info('获取节点属性...');
    const getPropertyResult = await mcpGodot.sendRequest('get_property', {
      node_path: nodePath,
      property: 'size'
    });
    logger.info('获取属性结果:', getPropertyResult);
    
    // 等待一段时间
    await delay(2000);
    
    return true;
  } catch (error) {
    logger.error('属性操作测试失败:', error);
    return false;
  }
}

// 测试脚本操作
async function testScriptOperations(nodePath) {
  try {
    if (!nodePath) {
      throw new Error('节点路径为空，无法测试脚本操作');
    }
    
    // 创建一个新的脚本
    logger.info('创建脚本...');
    const createScriptResult = await mcpGodot.sendRequest('create_script', {
      path: 'res://test_script.gd',
      content: `extends CSGBox3D

func _ready():
    print("测试脚本已加载")
    
func _process(delta):
    rotate_y(delta * 0.5)
`
    });
    logger.info('创建脚本结果:', createScriptResult);
    
    // 等待一段时间
    await delay(2000);
    
    // 附加脚本到节点
    logger.info('附加脚本到节点...');
    const attachScriptResult = await mcpGodot.sendRequest('attach_script', {
      node_path: nodePath,
      script_path: 'res://test_script.gd'
    });
    logger.info('附加脚本结果:', attachScriptResult);
    
    // 等待一段时间
    await delay(2000);
    
    return true;
  } catch (error) {
    logger.error('脚本操作测试失败:', error);
    return false;
  }
}

// 测试项目操作
async function testProjectOperations() {
  try {
    // 运行项目
    logger.info('运行项目...');
    const runResult = await mcpGodot.sendRequest('run_project', {});
    logger.info('运行项目结果:', runResult);
    
    // 等待一段时间，让项目运行一会儿
    await delay(5000);
    
    // 停止项目
    logger.info('停止项目...');
    const stopResult = await mcpGodot.sendRequest('stop_project', {});
    logger.info('停止项目结果:', stopResult);
    
    // 等待一段时间
    await delay(2000);
    
    return true;
  } catch (error) {
    logger.error('项目操作测试失败:', error);
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
    if (!nodeResult.success) {
      logger.warn('节点操作测试失败，跳过后续测试');
      return;
    }
    
    // 等待一段时间
    await delay(2000);
    
    // 运行属性操作测试
    const propertyResult = await testPropertyOperations(nodeResult.nodePath);
    if (!propertyResult) {
      logger.warn('属性操作测试失败，跳过后续测试');
      return;
    }
    
    // 等待一段时间
    await delay(2000);
    
    // 运行脚本操作测试
    const scriptResult = await testScriptOperations(nodeResult.nodePath);
    if (!scriptResult) {
      logger.warn('脚本操作测试失败，跳过后续测试');
      return;
    }
    
    // 等待一段时间
    await delay(2000);
    
    // 运行项目操作测试
    const projectResult = await testProjectOperations();
    if (!projectResult) {
      logger.warn('项目操作测试失败');
      return;
    }
    
    // 发送成功通知
    await mcpGodot.sendRequest('notify', {
      message: '高级功能测试完成！所有功能测试成功。',
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
