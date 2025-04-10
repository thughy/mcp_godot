// Import MCP SDK components
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpGodot } from './godot/mcpGodot.js';
import { Logger, LogLevel } from './utils/logger.js';
import { createExecuteCommandTool } from './tools/executeCommandTool.js';
import { createSelectNodeTool } from './tools/selectNodeTool.js';
import { createUpdatePropertyTool } from './tools/updatePropertyTool.js';
import { createAddNodeTool } from './tools/addNodeTool.js';
import { createNotifyMessageTool } from './tools/notifyMessageTool.js';
import { createGetSceneTreeResource } from './resources/getSceneTreeResource.js';
import { createGetNodeInfoResource } from './resources/getNodeInfoResource.js';
import { createGetEditorLogsResource } from './resources/getEditorLogsResource.js';
// Initialize loggers
const serverLogger = new Logger('Server', LogLevel.INFO);
const godotLogger = new Logger('Godot', LogLevel.INFO);
const toolLogger = new Logger('Tools', LogLevel.INFO);
const resourceLogger = new Logger('Resources', LogLevel.INFO);
// Initialize the MCP server
const server = new McpServer({
    name: "MCP Godot Server",
    version: "1.0.0"
}, {
    capabilities: {
        tools: {},
        resources: {},
    },
});
// Initialize MCP HTTP bridge with Godot editor
const mcpGodot = new McpGodot(godotLogger);
// Add all tools to the registry
createExecuteCommandTool(server, mcpGodot, toolLogger);
createSelectNodeTool(server, mcpGodot, toolLogger);
createUpdatePropertyTool(server, mcpGodot, toolLogger);
createAddNodeTool(server, mcpGodot, toolLogger);
createNotifyMessageTool(server, mcpGodot, toolLogger);
// Create and register all resources with the MCP server
createGetSceneTreeResource(server, mcpGodot, resourceLogger);
createGetNodeInfoResource(server, mcpGodot, resourceLogger);
createGetEditorLogsResource(server, mcpGodot, resourceLogger);
// Server startup function
async function startServer() {
    try {
        // Initialize STDIO transport for MCP client communication
        const stdioTransport = new StdioServerTransport();
        // Connect the server to the transport
        await server.connect(stdioTransport);
        serverLogger.info('MCP Server started');
        // Get the client name from the MCP server
        const clientName = server.server.getClientVersion()?.name || 'Unknown MCP Client';
        serverLogger.info(`Connected MCP client: ${clientName}`);
        // Start Godot Bridge connection with client name in headers
        await mcpGodot.start(clientName);
    }
    catch (error) {
        serverLogger.error('Failed to start server', error);
        process.exit(1);
    }
}
// Start the server
startServer();
// Handle shutdown
process.on('SIGINT', async () => {
    serverLogger.info('Shutting down...');
    await mcpGodot.stop();
    process.exit(0);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    serverLogger.error('Uncaught exception', error);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    serverLogger.error('Unhandled rejection', reason);
});
