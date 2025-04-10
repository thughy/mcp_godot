#!/bin/bash

# 运行 Claude MCP Godot 集成系统
# 此脚本启动所有必要的服务，以便与 Claude 官网协作开发 Godot 游戏

BASE_DIR="/Users/ghy/Desktop/guohaoyuan/mcp_test/mcp_godot"
GODOT_DIR="/Users/ghy/Desktop/guohaoyuan/mcp_test/godot"
SERVER_DIR="$BASE_DIR/server"
PROXY_DIR="$BASE_DIR/claude-proxy"

# 颜色定义
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
NC="\033[0m" # 恢复默认颜色

echo -e "${GREEN}===== 启动 Claude MCP Godot 集成系统 =====${NC}"

# 步骤 1: 启动 Godot 编辑器
echo -e "${YELLOW}步骤 1: 启动 Godot 编辑器${NC}"
open -a Godot "$GODOT_DIR"
echo "等待 Godot 编辑器启动..."
sleep 5

# 步骤 2: 启动 MCP Godot 服务器
echo -e "${YELLOW}步骤 2: 启动 MCP Godot 服务器${NC}"
cd "$SERVER_DIR" && npm start &
SERVER_PID=$!
echo "MCP Godot 服务器已启动 (PID: $SERVER_PID)"
sleep 3

# 步骤 3: 启动 Claude 代理服务器
echo -e "${YELLOW}步骤 3: 启动 Claude 代理服务器${NC}"
cd "$PROXY_DIR" && npm start &
PROXY_PID=$!
echo "Claude 代理服务器已启动 (PID: $PROXY_PID)"
sleep 2

# 步骤 4: 打开控制面板
echo -e "${YELLOW}步骤 4: 打开控制面板${NC}"
open "http://localhost:3000"

echo -e "${GREEN}===== 所有服务已启动 =====${NC}"
echo "控制面板: http://localhost:3000"
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "kill $SERVER_PID $PROXY_PID; echo -e '\n${GREEN}已停止所有服务${NC}'; exit 0" INT
wait