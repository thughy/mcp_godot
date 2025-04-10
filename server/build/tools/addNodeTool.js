import { z } from 'zod';
import { McpGodotError, ErrorType } from '../utils/errors.js';
// Constants for the tool
const toolName = 'add_node';
const toolDescription = 'Adds a new node to the Godot scene tree';
const paramsSchema = z.object({
    parentPath: z.string().describe('The path to the parent node (e.g. "/root/Main")'),
    nodeType: z.string().describe('The type of node to add (e.g. "Sprite2D", "Node3D")'),
    nodeName: z.string().optional().describe('Optional name for the new node')
});
/**
 * Creates and registers the Add Node tool with the MCP server
 * This tool allows adding new nodes in the Godot Editor
 *
 * @param server The MCP server instance to register with
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param logger The logger instance for diagnostic information
 */
export function createAddNodeTool(server, mcpGodot, logger) {
    logger.info(`Registering tool: ${toolName}`);
    // Register this tool with the MCP server
    server.tool(toolName, toolDescription, paramsSchema.shape, async (params) => {
        try {
            logger.info(`Executing tool: ${toolName}`, params);
            const result = await toolHandler(mcpGodot, params);
            logger.info(`Tool execution successful: ${toolName}`);
            return result;
        }
        catch (error) {
            logger.error(`Tool execution failed: ${toolName}`, error);
            throw error;
        }
    });
}
/**
 * Handles add node requests
 *
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param params The parameters for the tool
 * @returns A promise that resolves to the tool execution result
 * @throws McpGodotError if the request to Godot fails
 */
async function toolHandler(mcpGodot, params) {
    const { parentPath, nodeType, nodeName } = params;
    const response = await mcpGodot.sendRequest({
        method: toolName,
        params: { parentPath, nodeType, nodeName }
    });
    if (!response.success) {
        throw new McpGodotError(ErrorType.TOOL_EXECUTION, response.message || `Failed to add ${nodeType} node to: ${parentPath}`);
    }
    return {
        content: [{
                type: 'text',
                text: response.message || `Successfully added ${nodeType} node to: ${parentPath}`
            }]
    };
}
