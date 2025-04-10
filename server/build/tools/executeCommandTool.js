import { z } from 'zod';
import { McpGodotError, ErrorType } from '../utils/errors.js';
// Constants for the tool
const toolName = 'execute_command';
const toolDescription = 'Executes a Godot editor command by name';
const paramsSchema = z.object({
    command: z.string().describe('The name of the command to execute (e.g. "file_new_scene")')
});
/**
 * Creates and registers the Execute Command tool with the MCP server
 * This tool allows executing commands in the Godot Editor
 *
 * @param server The MCP server instance to register with
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param logger The logger instance for diagnostic information
 */
export function createExecuteCommandTool(server, mcpGodot, logger) {
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
 * Handles command execution requests
 *
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param params The parameters for the tool
 * @returns A promise that resolves to the tool execution result
 * @throws McpGodotError if the request to Godot fails
 */
async function toolHandler(mcpGodot, params) {
    const { command } = params;
    const response = await mcpGodot.sendRequest({
        method: toolName,
        params: { command }
    });
    if (!response.success) {
        throw new McpGodotError(ErrorType.TOOL_EXECUTION, response.message || `Failed to execute command: ${command}`);
    }
    return {
        content: [{
                type: response.type || 'text',
                text: response.message || `Successfully executed command: ${command}`
            }]
    };
}
