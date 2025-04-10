const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const port = 3000;

// 启用 CORS 和 JSON 解析
app.use(cors());
app.use(express.json());

// 提供静态文件
app.use(express.static(path.join(__dirname, 'public')));

// 存储 WebSocket 连接
let godotWs = null;
const pendingRequests = new Map();

// 连接到 MCP Godot WebSocket 服务器
function connectToGodot() {
  if (godotWs) {
    try {
      godotWs.terminate();
    } catch (e) {
      console.error('Error terminating existing WebSocket:', e);
    }
  }

  godotWs = new WebSocket('ws://localhost:8090/mcp_godot');

  godotWs.on('open', () => {
    console.log('Connected to MCP Godot WebSocket server');
  });

  godotWs.on('message', (data) => {
    try {
      const response = JSON.parse(data.toString());
      const requestId = response.id;
      
      if (pendingRequests.has(requestId)) {
        const { res, startTime } = pendingRequests.get(requestId);
        const endTime = Date.now();
        console.log(`Request ${requestId} completed in ${endTime - startTime}ms`);
        
        res.json(response);
        pendingRequests.delete(requestId);
      } else {
        console.log('Received response for unknown request:', response);
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  });

  godotWs.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  godotWs.on('close', () => {
    console.log('WebSocket connection closed, will retry in 5 seconds');
    setTimeout(connectToGodot, 5000);
  });
}

// 初始连接
connectToGodot();

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', connected: godotWs && godotWs.readyState === WebSocket.OPEN });
});

// 获取可用命令列表
app.get('/commands', (req, res) => {
  res.json({
    commands: [
      { name: 'create_scene', description: '创建新场景', params: ['template'] },
      { name: 'open_scene', description: '打开场景', params: ['path'] },
      { name: 'save_scene', description: '保存场景', params: ['path'] },
      { name: 'close_scene', description: '关闭当前场景', params: [] },
      { name: 'add_node', description: '添加节点', params: ['node_type', 'node_name'] },
      { name: 'remove_node', description: '移除节点', params: ['node_path'] },
      { name: 'select_node', description: '选择节点', params: ['node_path'] },
      { name: 'duplicate_node', description: '复制节点', params: ['node_path'] },
      { name: 'set_property', description: '设置属性', params: ['node_path', 'property', 'value'] },
      { name: 'get_property', description: '获取属性', params: ['node_path', 'property'] },
      { name: 'create_script', description: '创建脚本', params: ['path', 'content'] },
      { name: 'attach_script', description: '附加脚本', params: ['node_path', 'script_path'] },
      { name: 'edit_script', description: '编辑脚本', params: ['script_path', 'content'] },
      { name: 'notify', description: '显示通知', params: ['message', 'level'] }
    ]
  });
});

// 执行 MCP 命令的端点
app.post('/execute', (req, res) => {
  if (!godotWs || godotWs.readyState !== WebSocket.OPEN) {
    return res.status(503).json({ error: 'WebSocket connection not available' });
  }

  const { method, params } = req.body;
  if (!method) {
    return res.status(400).json({ error: 'Method is required' });
  }

  const requestId = uuidv4();
  const request = { id: requestId, method, params: params || {} };
  
  try {
    pendingRequests.set(requestId, { res, startTime: Date.now() });
    godotWs.send(JSON.stringify(request));
    console.log(`Sent request ${requestId}:`, request);
    
    // 设置请求超时
    setTimeout(() => {
      if (pendingRequests.has(requestId)) {
        pendingRequests.delete(requestId);
        res.status(504).json({ error: 'Request timeout' });
      }
    }, 30000);
  } catch (error) {
    pendingRequests.delete(requestId);
    console.error('Error sending WebSocket message:', error);
    res.status(500).json({ error: 'Failed to send message to MCP Godot' });
  }
});

// 启动服务器
app.listen(port, () => {
  console.log(`Claude MCP Proxy server listening at http://localhost:${port}`);
});
