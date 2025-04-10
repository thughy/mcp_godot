# MCP Godot

MCP Godot 是一个为 Godot 游戏引擎实现的 Model Context Protocol (MCP) 集成。它允许 AI 助手（如 Claude、Windsurf 和 Cursor）与 Godot 编辑器交互，执行各种操作。该实现是最小化、稳定和可靠的，支持完整的游戏开发工作流程。

## 功能

MCP Godot 提供以下核心功能：

### 场景操作

- `create_scene`: 创建新场景（支持 2D 和 3D 模板）
- `open_scene`: 打开现有场景
- `save_scene`: 保存当前场景
- `close_scene`: 关闭当前场景

### 节点操作

- `add_node`: 向场景中添加新节点
- `remove_node`: 从场景中移除节点
- `select_node`: 在场景树中选择节点
- `duplicate_node`: 复制现有节点

### 属性操作

- `set_property`: 设置节点的属性值
- `get_property`: 获取节点的属性值

### 脚本操作

- `create_script`: 创建新脚本
- `attach_script`: 将脚本附加到节点
- `edit_script`: 编辑现有脚本

### 通知操作

- `notify`: 在 Godot 编辑器中显示通知消息

## 要求

- Godot 4.4 或更高版本
- Node.js 18 或更高版本
- npm 9 或更高版本

## 安装

### 步骤 1: 安装 Godot 插件

1. 将 `godot_plugin` 目录复制到您的 Godot 项目的 `addons` 目录中，并将其重命名为 `mcp_godot`
2. 在 Godot 编辑器中，转到 `项目 > 项目设置 > 插件`
3. 找到 "MCP Godot" 插件并启用它

### 步骤 2: 安装 Node.js MCP 服务器

1. 确保已安装 Node.js 和 npm
2. 进入 `server` 目录
3. 运行 `npm install` 安装依赖
4. 运行 `npm run build` 构建服务器

## 使用方法

### 启动 MCP 服务器

1. 确保 Godot 编辑器已打开并且 MCP Godot 插件已启用
2. 在 `server` 目录中运行 `npm start` 启动 MCP 服务器

### 配置 AI 助手

根据您使用的 AI 助手（如 Windsurf、Cursor 等），按照相应的说明配置 MCP 服务器连接。

## 故障排除

### WebSocket 连接问题

- 确保 Godot 编辑器已打开并且 MCP Godot 插件已启用
- 确认端口 8090 未被其他应用程序占用
- 检查防火墙设置是否允许本地 WebSocket 连接

### 命令执行失败

- 确保您正在尝试执行的命令在当前 Godot 上下文中可用
- 检查节点路径是否正确（区分大小写）

## 开发

### 扩展工具

要添加新工具，请在 `server/src/tools` 目录中创建新文件，并在 `server/src/index.ts` 中注册它。

### 扩展资源

要添加新资源，请在 `server/src/resources` 目录中创建新文件，并在 `server/src/index.ts` 中注册它。

## 许可证

MIT
