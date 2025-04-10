import { z } from 'zod';
import { McpGodotError, ErrorType } from '../utils/errors.js';
// Constants for the resource
const resourceName = 'godot://node/{nodePath}';
const resourceDescription = 'Retrieves detailed information about a specific node in the Godot scene tree';
const paramsSchema = z.object({
    nodePath: z.string().describe('The path to the node to get information about (e.g. "/root/Main/Player")')
});
/**
 * Creates and registers the Get Node Info resource with the MCP server
 * This resource allows retrieving detailed information about a specific node in Godot
 *
 * @param server The MCP server instance to register with
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param logger The logger instance for diagnostic information
 */
export function createGetNodeInfoResource(server, mcpGodot, logger) {
    logger.info(`Registering resource: ${resourceName}`);
    // Register this resource with the MCP server
    server.resource(resourceName, resourceDescription, async (params) => {
        try {
            logger.info(`Fetching resource: ${resourceName}`, params);
            const result = await resourceHandler(mcpGodot, params);
            logger.info(`Resource fetch successful: ${resourceName}`);
            return result;
        }
        catch (error) {
            logger.error(`Resource fetch failed: ${resourceName}`, error);
            throw error;
        }
    }, paramsSchema.shape);
}
/**
 * Handles node info fetch requests
 *
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param params The parameters for the resource
 * @returns A promise that resolves to the resource data
 * @throws McpGodotError if the request to Godot fails
 */
async function resourceHandler(mcpGodot, params) {
    const { nodePath } = params;
    const response = await mcpGodot.sendRequest({
        method: 'get_node_info',
        params: { nodePath }
    });
    if (!response.success) {
        throw new McpGodotError(ErrorType.RESOURCE_FETCH, response.message || `Failed to fetch node info for: ${nodePath}`);
    }
    return response.data || {};
}
