import { z } from 'zod';
import { McpGodotError, ErrorType } from '../utils/errors.js';
// Constants for the tool
const toolName = 'update_property';
const toolDescription = 'Updates a property on a node in the Godot scene tree';
const paramsSchema = z.object({
    nodePath: z.string().describe('The path to the node to update (e.g. "/root/Main/Player")'),
    property: z.string().describe('The property to update (e.g. "position")'),
    value: z.any().describe('The value to set the property to')
});
/**
 * Creates and registers the Update Property tool with the MCP server
 * This tool allows updating properties on nodes in the Godot Editor
 *
 * @param server The MCP server instance to register with
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param logger The logger instance for diagnostic information
 */
export function createUpdatePropertyTool(server, mcpGodot, logger) {
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
 * Handles property update requests
 *
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param params The parameters for the tool
 * @returns A promise that resolves to the tool execution result
 * @throws McpGodotError if the request to Godot fails
 */
async function toolHandler(mcpGodot, params) {
    const { nodePath, property, value } = params;
    const response = await mcpGodot.sendRequest({
        method: toolName,
        params: { nodePath, property, value }
    });
    if (!response.success) {
        throw new McpGodotError(ErrorType.TOOL_EXECUTION, response.message || `Failed to update property ${property} on node: ${nodePath}`);
    }
    return {
        content: [{
                type: 'text',
                text: response.message || `Successfully updated property ${property} on node: ${nodePath}`
            }]
    };
}
