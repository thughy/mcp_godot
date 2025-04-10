// Import components
import { McpGodot } from './godot/mcpGodot.js';
import { Logger, LogLevel } from './utils/logger.js';
import { GodotCommandHandler } from './commands/commandHandler.js';
// Initialize loggers
const serverLogger = new Logger('Server', LogLevel.INFO);
const godotLogger = new Logger('Godot', LogLevel.INFO);
const commandLogger = new Logger('Command', LogLevel.INFO);
// Initialize MCP Godot connection
const mcpGodot = new McpGodot(godotLogger);
// Initialize command handler
const commandHandler = new GodotCommandHandler(mcpGodot, commandLogger);
// Server startup function
async function startServer() {
    try {
        serverLogger.info('MCP Godot Server starting...');
        // Start Godot Bridge connection
        await mcpGodot.start();
        serverLogger.info('MCP Godot Server started successfully');
        serverLogger.info(`Listening on port ${process.env.GODOT_PORT || 8090}`);
        serverLogger.info('Waiting for Godot editor to connect...');
        // Example of how to send a command to Godot
        // This is just for testing and can be removed in production
        setTimeout(async () => {
            try {
                serverLogger.info('Sending test notification to Godot...');
                const notifyCommand = {
                    type: 'notify',
                    params: {
                        message: 'MCP Godot Server connected successfully!',
                        level: 'info'
                    }
                };
                const result = await commandHandler.handle(notifyCommand);
                if (result.success) {
                    serverLogger.info('Test notification sent successfully', result);
                }
                else {
                    serverLogger.warn('Test notification failed', result);
                }
            }
            catch (error) {
                serverLogger.error('Failed to send test notification', error);
            }
        }, 5000);
    }
    catch (error) {
        serverLogger.error('Failed to start server', error);
        process.exit(1);
    }
}
// Start the server
startServer();
// Handle shutdown
process.on('SIGINT', async () => {
    serverLogger.info('Shutting down...');
    await mcpGodot.stop();
    process.exit(0);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    serverLogger.error('Uncaught exception', error);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
    serverLogger.error('Unhandled rejection', reason);
});
