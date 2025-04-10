# MCP Godot

MCP Godot 是一个为 Godot 游戏引擎实现的 Model Context Protocol (MCP) 集成。它允许 AI 助手（如 Claude、Windsurf 和 Cursor）与 Godot 编辑器交互，执行各种操作。

## 功能

MCP Godot 提供以下核心功能：

### 工具

- `execute_command`: 执行 Godot 编辑器命令
- `select_node`: 在场景树中选择节点
- `update_property`: 更新节点的属性
- `add_node`: 向场景中添加新节点
- `notify_message`: 在 Godot 编辑器中显示通知消息

### 资源

- `godot://scene-tree`: 获取当前场景树结构
- `godot://node/{nodePath}`: 获取特定节点的详细信息
- `godot://logs`: 获取 Godot 编辑器日志

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
