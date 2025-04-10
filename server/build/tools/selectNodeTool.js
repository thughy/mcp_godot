import { z } from 'zod';
import { McpGodotError, ErrorType } from '../utils/errors.js';
// Constants for the tool
const toolName = 'select_node';
const toolDescription = 'Selects a node in the Godot scene tree by path';
const paramsSchema = z.object({
    nodePath: z.string().describe('The path to the node to select (e.g. "/root/Main/Player")')
});
/**
 * Creates and registers the Select Node tool with the MCP server
 * This tool allows selecting nodes in the Godot Editor
 *
 * @param server The MCP server instance to register with
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param logger The logger instance for diagnostic information
 */
export function createSelectNodeTool(server, mcpGodot, logger) {
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
 * Handles node selection requests
 *
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param params The parameters for the tool
 * @returns A promise that resolves to the tool execution result
 * @throws McpGodotError if the request to Godot fails
 */
async function toolHandler(mcpGodot, params) {
    const { nodePath } = params;
    const response = await mcpGodot.sendRequest({
        method: toolName,
        params: { nodePath }
    });
    if (!response.success) {
        throw new McpGodotError(ErrorType.TOOL_EXECUTION, response.message || `Failed to select node: ${nodePath}`);
    }
    return {
        content: [{
                type: 'text',
                text: response.message || `Successfully selected node: ${nodePath}`
            }]
    };
}
