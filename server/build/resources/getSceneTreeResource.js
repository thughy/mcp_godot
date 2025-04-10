import { McpGodotError, ErrorType } from '../utils/errors.js';
// Constants for the resource
const resourceName = 'godot://scene-tree';
const resourceDescription = 'Retrieves the current scene tree structure from Godot';
/**
 * Creates and registers the Get Scene Tree resource with the MCP server
 * This resource allows retrieving the scene tree structure from Godot
 *
 * @param server The MCP server instance to register with
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param logger The logger instance for diagnostic information
 */
export function createGetSceneTreeResource(server, mcpGodot, logger) {
    logger.info(`Registering resource: ${resourceName}`);
    // Register this resource with the MCP server
    server.resource(resourceName, resourceDescription, async () => {
        try {
            logger.info(`Fetching resource: ${resourceName}`);
            const result = await resourceHandler(mcpGodot);
            logger.info(`Resource fetch successful: ${resourceName}`);
            return result;
        }
        catch (error) {
            logger.error(`Resource fetch failed: ${resourceName}`, error);
            throw error;
        }
    });
}
/**
 * Handles scene tree fetch requests
 *
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @returns A promise that resolves to the resource data
 * @throws McpGodotError if the request to Godot fails
 */
async function resourceHandler(mcpGodot) {
    const response = await mcpGodot.sendRequest({
        method: 'get_scene_tree',
        params: {}
    });
    if (!response.success) {
        throw new McpGodotError(ErrorType.RESOURCE_FETCH, response.message || 'Failed to fetch scene tree');
    }
    return response.data || {};
}
