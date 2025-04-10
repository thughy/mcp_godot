import { z } from 'zod';
import { McpGodotError, ErrorType } from '../utils/errors.js';
// Constants for the tool
const toolName = 'notify_message';
const toolDescription = 'Displays a notification message in the Godot editor';
const paramsSchema = z.object({
    message: z.string().describe('The message to display'),
    type: z.enum(['info', 'warning', 'error']).default('info').describe('The type of notification')
});
/**
 * Creates and registers the Notify Message tool with the MCP server
 * This tool allows displaying notification messages in the Godot Editor
 *
 * @param server The MCP server instance to register with
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param logger The logger instance for diagnostic information
 */
export function createNotifyMessageTool(server, mcpGodot, logger) {
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
 * Handles notification message requests
 *
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param params The parameters for the tool
 * @returns A promise that resolves to the tool execution result
 * @throws McpGodotError if the request to Godot fails
 */
async function toolHandler(mcpGodot, params) {
    const { message, type } = params;
    const response = await mcpGodot.sendRequest({
        method: toolName,
        params: { message, type }
    });
    if (!response.success) {
        throw new McpGodotError(ErrorType.TOOL_EXECUTION, response.message || `Failed to display notification: ${message}`);
    }
    return {
        content: [{
                type: 'text',
                text: response.message || `Successfully displayed notification: ${message}`
            }]
    };
}
