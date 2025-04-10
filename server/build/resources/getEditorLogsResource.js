import { McpGodotError, ErrorType } from '../utils/errors.js';
// Constants for the resource
const resourceName = 'godot://logs';
const resourceDescription = 'Retrieves logs from the Godot editor';
/**
 * Creates and registers the Get Editor Logs resource with the MCP server
 * This resource allows retrieving logs from the Godot editor
 *
 * @param server The MCP server instance to register with
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @param logger The logger instance for diagnostic information
 */
export function createGetEditorLogsResource(server, mcpGodot, logger) {
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
 * Handles editor logs fetch requests
 *
 * @param mcpGodot The McpGodot instance to communicate with Godot
 * @returns A promise that resolves to the resource data
 * @throws McpGodotError if the request to Godot fails
 */
async function resourceHandler(mcpGodot) {
    const response = await mcpGodot.sendRequest({
        method: 'get_editor_logs',
        params: {}
    });
    if (!response.success) {
        throw new McpGodotError(ErrorType.RESOURCE_FETCH, response.message || 'Failed to fetch editor logs');
    }
    return response.data || {};
}
