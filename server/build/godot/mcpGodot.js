import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { McpGodotError, ErrorType } from '../utils/errors.js';
export class McpGodot {
    logger;
    port;
    ws = null;
    pendingRequests = new Map();
    REQUEST_TIMEOUT = 10000;
    constructor(logger) {
        this.logger = logger;
        // Initialize port from environment variable or use default
        const envPort = process.env.GODOT_PORT;
        this.port = envPort ? parseInt(envPort, 10) : 8090;
        this.logger.info(`Using port: ${this.port} for Godot WebSocket connection`);
    }
    /**
     * Start the Godot connection
     * @param clientName Optional name of the MCP client connecting to Godot
     */
    async start(clientName) {
        try {
            this.logger.info('Attempting to connect to Godot WebSocket...');
            await this.connect(clientName);
            this.logger.info('Successfully connected to Godot WebSocket');
            if (clientName) {
                this.logger.info(`Client identified to Godot as: ${clientName}`);
            }
        }
        catch (error) {
            this.logger.warn(`Could not connect to Godot WebSocket: ${error instanceof Error ? error.message : String(error)}`);
            this.logger.warn('Will retry connection on next request');
            // Disconnect to clean up for the next request attempt
            this.disconnect();
        }
        return Promise.resolve();
    }
    /**
     * Stop the Godot connection
     */
    async stop() {
        this.disconnect();
        return Promise.resolve();
    }
    /**
     * Check if connected to Godot
     */
    get isConnected() {
        return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
    }
    /**
     * Send a request to Godot
     * @param request The request to send
     * @returns A promise that resolves to the response
     */
    async sendRequest(request) {
        if (!this.isConnected) {
            try {
                await this.connect();
            }
            catch (error) {
                throw new McpGodotError(ErrorType.CONNECTION, `Failed to connect to Godot: ${error instanceof Error ? error.message : String(error)}`);
            }
        }
        const id = request.id || uuidv4();
        const requestWithId = { ...request, id };
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new McpGodotError(ErrorType.CONNECTION, 'Request timeout'));
                }
            }, this.REQUEST_TIMEOUT);
            this.pendingRequests.set(id, { resolve, reject, timeout });
            try {
                this.ws.send(JSON.stringify(requestWithId));
            }
            catch (error) {
                clearTimeout(timeout);
                this.pendingRequests.delete(id);
                reject(new McpGodotError(ErrorType.CONNECTION, `Failed to send request: ${error instanceof Error ? error.message : String(error)}`));
            }
        });
    }
    /**
     * Connect to the Godot WebSocket
     * @param clientName Optional name of the MCP client connecting to Godot
     */
    async connect(clientName) {
        if (this.isConnected) {
            this.logger.debug('Already connected to Godot WebSocket');
            return Promise.resolve();
        }
        // First, properly close any existing WebSocket connection
        this.disconnect();
        return new Promise((resolve, reject) => {
            const wsUrl = `ws://localhost:${this.port}/mcp_godot`;
            this.logger.debug(`Connecting to ${wsUrl}...`);
            // Create connection options with headers for client identification
            const options = {
                headers: {
                    'X-Client-Name': clientName || ''
                },
                origin: clientName || ''
            };
            // Create a new WebSocket with options
            this.ws = new WebSocket(wsUrl, options);
            const connectionTimeout = setTimeout(() => {
                if (this.ws && (this.ws.readyState === WebSocket.CONNECTING)) {
                    this.logger.warn('Connection timeout, terminating WebSocket');
                    this.disconnect();
                    reject(new McpGodotError(ErrorType.CONNECTION, 'Connection timeout'));
                }
            }, this.REQUEST_TIMEOUT);
            this.ws.onopen = () => {
                clearTimeout(connectionTimeout);
                this.logger.debug('WebSocket connected');
                resolve();
            };
            this.ws.onerror = (err) => {
                clearTimeout(connectionTimeout);
                this.logger.error(`WebSocket error: ${err.message || 'Unknown error'}`);
                reject(new McpGodotError(ErrorType.CONNECTION, `Connection failed: ${err.message || 'Unknown error'}`));
                this.disconnect();
            };
            this.ws.onmessage = (event) => {
                this.handleMessage(event.data.toString());
            };
            this.ws.onclose = () => {
                this.logger.debug('WebSocket closed');
                this.disconnect();
            };
        });
    }
    /**
     * Handle messages received from Godot
     */
    handleMessage(data) {
        try {
            const response = JSON.parse(data);
            if (response.id && this.pendingRequests.has(response.id)) {
                const request = this.pendingRequests.get(response.id);
                clearTimeout(request.timeout);
                this.pendingRequests.delete(response.id);
                if (response.error) {
                    request.reject(new McpGodotError(ErrorType.TOOL_EXECUTION, response.error.message || 'Unknown error', response.error.details));
                }
                else {
                    request.resolve(response.result);
                }
            }
        }
        catch (e) {
            this.logger.error(`Error parsing WebSocket message: ${e instanceof Error ? e.message : String(e)}`);
        }
    }
    /**
     * Disconnect from Godot
     */
    disconnect() {
        if (this.ws) {
            this.logger.debug(`Disconnecting WebSocket in state: ${this.ws.readyState}`);
            // First remove all event handlers to prevent callbacks during close
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            // Different handling based on WebSocket state
            try {
                if (this.ws.readyState === WebSocket.CONNECTING) {
                    // For sockets still connecting, use terminate() to force immediate close
                    this.ws.terminate();
                }
                else if (this.ws.readyState === WebSocket.OPEN) {
                    // For open sockets, use close() for clean shutdown
                    this.ws.close();
                }
            }
            catch (err) {
                this.logger.error(`Error closing WebSocket: ${err instanceof Error ? err.message : String(err)}`);
            }
            // Clear the reference
            this.ws = null;
            // Reject all pending requests
            for (const [id, request] of this.pendingRequests.entries()) {
                clearTimeout(request.timeout);
                request.reject(new McpGodotError(ErrorType.CONNECTION, 'Connection closed'));
                this.pendingRequests.delete(id);
            }
        }
    }
}
