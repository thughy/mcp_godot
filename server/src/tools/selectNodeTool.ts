/**
 * Select Node Tool for MCP Godot
 * 
 * This tool provides functionality to select nodes in the Godot editor
 */
import { McpGodot } from '../godot/mcpGodot.js';
import { Logger } from '../utils/logger.js';

/**
 * SelectNodeTool class
 */
export class SelectNodeTool {
  private mcpGodot: McpGodot;
  private logger: Logger;

  /**
   * Constructor
   * @param mcpGodot McpGodot instance
   * @param logger Logger instance
   */
  constructor(mcpGodot: McpGodot, logger: Logger) {
    this.mcpGodot = mcpGodot;
    this.logger = logger;
  }

  /**
   * Select a node in the Godot editor
   * @param nodePath Path to the node to select
   * @returns Promise that resolves when the node is selected
   */
  async selectNode(nodePath: string): Promise<boolean> {
    try {
      this.logger.info(`Selecting node: ${nodePath}`);
      
      // Send request to Godot to select the node
      const result = await this.mcpGodot.sendRequest('select_node', { 
        node_path: nodePath 
      });
      
      this.logger.info(`Node selection result:`, result);
      
      return result && result.success === true;
    } catch (error) {
      this.logger.error(`Failed to select node: ${nodePath}`, error);
      return false;
    }
  }
}
