# Claude 与 MCP Godot 集成指南

本文档详细说明了如何将 Claude 官网与 MCP Godot 集成，以便使用 Claude 的 AI 能力协助 Godot 游戏开发。

## 系统架构

该集成系统由三个主要组件组成：

1. **Godot 编辑器**：运行 MCP Godot 插件，提供编辑器操作接口
2. **MCP Godot 服务器**：处理与 Godot 编辑器的通信
3. **Claude 代理服务器**：作为 Claude 官网和 MCP Godot 服务器之间的桥梁

## 安装和设置

### 前提条件

- Godot 4.4 或更高版本
- Node.js 18 或更高版本
- npm 9 或更高版本

### 安装步骤

1. **设置 Godot 插件**
   - 将 `godot_plugin` 目录中的文件复制到您的 Godot 项目的 `addons/mcp_godot` 目录中
   - 在 Godot 编辑器中启用 MCP Godot 插件

2. **设置 MCP Godot 服务器**
   - 进入 `server` 目录
   - 运行 `npm install` 安装依赖
   - 运行 `npm run build` 构建服务器

3. **设置 Claude 代理服务器**
   - 进入 `claude-proxy` 目录
   - 运行 `npm install` 安装依赖

## 启动系统

您可以使用提供的 `run_claude.sh` 脚本一键启动整个系统：

```bash
chmod +x run_claude.sh
./run_claude.sh
```

或者，您可以分别启动各个组件：

1. **启动 Godot 编辑器**：打开您的 Godot 项目

2. **启动 MCP Godot 服务器**：
   ```bash
   cd server
   npm start
   ```

3. **启动 Claude 代理服务器**：
   ```bash
   cd claude-proxy
   npm start
   ```

启动后，您可以访问 [http://localhost:3000](http://localhost:3000) 打开控制面板。

## 与 Claude 官网协作开发

### 步骤 1: 准备 Claude

1. 打开 [Claude 官网](https://claude.ai)
2. 开始一个新的对话
3. 从控制面板复制 JavaScript 代码（点击"复制代码"按钮）
4. 将代码粘贴到 Claude 对话框中，并发送

### 步骤 2: 指导 Claude 使用 MCP Godot

向 Claude 发送以下提示，让它了解如何使用 MCP Godot：

```
我想让你帮我使用 Godot 引擎开发一个简单的 3D 游戏。我已经设置了 MCP Godot 系统，允许你通过 API 控制 Godot 编辑器。

当你需要执行 Godot 操作时，请提供 JavaScript 代码，格式如下：

```javascript
// 操作描述
const result = await sendToGodot('命令名称', { 参数1: '值1', 参数2: '值2' });
console.log(result);
```

我会复制这段代码并在我的环境中执行，然后将结果反馈给你。

可用的命令有：
- create_scene: 创建新场景（参数：template，可以是 '2d' 或 '3d'）
- save_scene: 保存场景（参数：path，如 'res://my_scene.tscn'）
- add_node: 添加节点（参数：node_type, node_name）
- select_node: 选择节点（参数：node_path）
- set_property: 设置节点属性（参数：node_path, property, value）
- get_property: 获取节点属性（参数：node_path, property）
- create_script: 创建脚本（参数：path, content）
- attach_script: 附加脚本到节点（参数：node_path, script_path）

让我们开始创建一个简单的 3D 游戏，包含一个可以移动的角色和一些障碍物。请指导我一步步完成。
```

### 步骤 3: 执行 Claude 提供的代码

1. Claude 会响应您的提示，并提供 JavaScript 代码来执行 Godot 操作
2. 复制 Claude 提供的代码
3. 在浏览器的开发者控制台中执行代码：
   - 在 Chrome/Edge 中按 F12 或右键点击页面并选择"检查"
   - 切换到"控制台"选项卡
   - 粘贴代码并按 Enter 执行
4. 将执行结果复制回 Claude 对话框
5. Claude 会根据结果提供下一步操作

## 可用命令参考

| 命令 | 描述 | 参数 |
|------|------|------|
| create_scene | 创建新场景 | template: '2d' 或 '3d' |
| open_scene | 打开场景 | path: 场景文件路径 |
| save_scene | 保存场景 | path: 保存路径 |
| close_scene | 关闭当前场景 | - |
| add_node | 添加节点 | node_type: 节点类型, node_name: 节点名称 |
| remove_node | 移除节点 | node_path: 节点路径 |
| select_node | 选择节点 | node_path: 节点路径 |
| duplicate_node | 复制节点 | node_path: 节点路径 |
| set_property | 设置节点属性 | node_path: 节点路径, property: 属性名, value: 属性值 |
| get_property | 获取节点属性 | node_path: 节点路径, property: 属性名 |
| create_script | 创建脚本 | path: 脚本路径, content: 脚本内容 |
| attach_script | 附加脚本到节点 | node_path: 节点路径, script_path: 脚本路径 |
| edit_script | 编辑脚本 | script_path: 脚本路径, content: 脚本内容 |
| notify | 显示通知 | message: 消息内容, level: 通知级别 |

## 示例工作流程

以下是一个示例工作流程，展示如何与 Claude 协作开发游戏：

1. **创建 3D 场景**：
   ```javascript
   const result = await sendToGodot('create_scene', { template: '3d' });
   console.log(result);
   ```

2. **添加角色节点**：
   ```javascript
   const result = await sendToGodot('add_node', { node_type: 'CharacterBody3D', node_name: 'Player' });
   console.log(result);
   ```

3. **添加碰撞形状**：
   ```javascript
   const playerPath = result.data.node_path;
   const collisionResult = await sendToGodot('add_node', { 
     node_type: 'CollisionShape3D', 
     node_name: 'Collision',
     parent: playerPath
   });
   console.log(collisionResult);
   ```

4. **创建并附加脚本**：
   ```javascript
   const createScriptResult = await sendToGodot('create_script', {
     path: 'res://player.gd',
     content: `extends CharacterBody3D

var speed = 5.0
var jump_strength = 10.0
var gravity = 20.0

func _physics_process(delta):
    # 添加重力
    if not is_on_floor():
        velocity.y -= gravity * delta
    
    # 处理跳跃
    if Input.is_action_just_pressed("ui_accept") and is_on_floor():
        velocity.y = jump_strength
    
    # 获取输入方向
    var input_dir = Input.get_vector("ui_left", "ui_right", "ui_up", "ui_down")
    var direction = (transform.basis * Vector3(input_dir.x, 0, input_dir.y)).normalized()
    
    # 处理移动
    if direction:
        velocity.x = direction.x * speed
        velocity.z = direction.z * speed
    else:
        velocity.x = 0.0
        velocity.z = 0.0
    
    move_and_slide()
`
   });
   console.log(createScriptResult);
   
   const attachScriptResult = await sendToGodot('attach_script', {
     node_path: playerPath,
     script_path: 'res://player.gd'
   });
   console.log(attachScriptResult);
   ```

5. **保存场景**：
   ```javascript
   const saveResult = await sendToGodot('save_scene', { path: 'res://game.tscn' });
   console.log(saveResult);
   ```

## 注意事项和提示

1. **保持所有服务运行**：确保 Godot 编辑器、MCP Godot 服务器和 Claude 代理服务器都在运行
2. **查看 Godot 编辑器**：在执行命令后，查看 Godot 编辑器以确认更改已应用
3. **错误处理**：如果命令执行失败，将错误信息提供给 Claude，它会帮助您解决问题
4. **节点路径**：使用 `select_node` 和 `get_property` 命令获取节点路径，以便在后续命令中使用
5. **保存进度**：定期使用 `save_scene` 命令保存您的进度

## 故障排除

### 连接问题

如果您遇到连接问题，请检查：

1. Godot 编辑器是否正在运行，并且 MCP Godot 插件已启用
2. MCP Godot 服务器是否正在运行（检查控制台输出）
3. Claude 代理服务器是否正在运行（访问 http://localhost:3000）

### 命令执行失败

如果命令执行失败，请检查：

1. 命令参数是否正确
2. 节点路径是否存在
3. Godot 编辑器控制台中的错误信息

## 高级用法

### 自定义命令

您可以通过修改 `claude-proxy/index.js` 文件中的 `/commands` 端点来添加自定义命令。

### 扩展 Godot 插件

您可以通过修改 `godot_plugin/mcp_godot_4x.gd` 文件来添加新的命令处理函数。
