import { Command, CommandHandler, CommandResponse } from './commandTypes.js';
import { McpGodot } from '../godot/mcpGodot.js';
import { Logger } from '../utils/logger.js';

/**
 * Godot command handler implementation
 */
export class GodotCommandHandler implements CommandHandler {
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
   * Check if this handler can handle the command
   * @param command Command to check
   * @returns True if the command can be handled
   */
  canHandle(command: Command): boolean {
    // This handler can handle all commands
    return true;
  }

  /**
   * Handle a command
   * @param command Command to handle
   * @returns Promise that resolves to a command response
   */
  async handle(command: Command): Promise<CommandResponse> {
    try {
      this.logger.info(`Handling command: ${command.type}`, command.params);
      
      // Map command type to Godot method
      const method = this.mapCommandTypeToMethod(command.type);
      
      // Send request to Godot
      const result = await this.mcpGodot.sendRequest(method, command.params);
      
      // Return success response
      return {
        success: true,
        data: result
      };
    } catch (error) {
      this.logger.error(`Error handling command: ${command.type}`, error);
      
      // Return error response
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Map command type to Godot method
   * @param commandType Command type
   * @returns Godot method name
   */
  private mapCommandTypeToMethod(commandType: string): string {
    // Direct mapping for now, can be customized if needed
    return commandType;
  }
}
