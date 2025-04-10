import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger.js';

/**
 * McpGodot class for handling WebSocket communication with Godot
 */
export class McpGodot {
  private logger: Logger;
  private port: number;
  private ws: WebSocket | null = null;
  private isConnected = false;
  
  /**
   * Constructor
   * @param logger Logger instance
   */
  constructor(logger: Logger) {
    this.logger = logger;
    
    // Initialize port from environment variable or use default
    const envPort = process.env.GODOT_PORT;
    this.port = envPort ? parseInt(envPort, 10) : 8090;
    
    this.logger.info(`Using port: ${this.port} for Godot WebSocket connection`);
  }
  
  /**
   * Start the Godot connection
   */
  public async start(): Promise<void> {
    try {
      this.logger.info('Attempting to connect to Godot WebSocket...');
      await this.connect();
      this.logger.info('Successfully connected to Godot WebSocket');
    } catch (error) {
      this.logger.warn(`Could not connect to Godot WebSocket: ${error instanceof Error ? error.message : String(error)}`);
      this.logger.warn('Will retry connection on next request');
      this.disconnect();
    }
    
    return Promise.resolve();
  }
  
  /**
   * Stop the Godot connection
   */
  public async stop(): Promise<void> {
    this.disconnect();
    return Promise.resolve();
  }
  
  /**
   * Send a request to Godot
   * @param method The method to call
   * @param params The parameters for the method
   * @returns A promise that resolves to the response
   */
  public async sendRequest(method: string, params: any = {}): Promise<any> {
    if (!this.isConnected) {
      try {
        await this.connect();
      } catch (error) {
        throw new Error(`Failed to connect to Godot: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    const id = uuidv4();
    const request = { id, method, params };
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);
      
      // Set up a one-time message handler for this request
      const messageHandler = (event: WebSocket.MessageEvent) => {
        try {
          const response = JSON.parse(event.data.toString());
          
          if (response.id === id) {
            // Remove the message handler
            if (this.ws) {
              this.ws.removeListener('message', messageHandler);
            }
            clearTimeout(timeoutId);
            
            if (response.error) {
              reject(new Error(response.error.message || 'Unknown error'));
            } else {
              resolve(response.result);
            }
          }
        } catch (e) {
          this.logger.error(`Error parsing WebSocket message: ${e instanceof Error ? e.message : String(e)}`);
        }
      };
      
      // Add the message handler
      if (this.ws) {
        this.ws.on('message', messageHandler);
      }
      
      try {
        if (this.ws) {
          this.ws.send(JSON.stringify(request));
        } else {
          throw new Error('WebSocket is not initialized');
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (this.ws) {
          this.ws.removeListener('message', messageHandler);
        }
        reject(new Error(`Failed to send request: ${error instanceof Error ? error.message : String(error)}`));
      }
    });
  }
  
  /**
   * Connect to the Godot WebSocket
   */
  private async connect(): Promise<void> {
    if (this.isConnected) {
      this.logger.debug('Already connected to Godot WebSocket');
      return Promise.resolve();
    }
    
    // First, properly close any existing WebSocket connection
    this.disconnect();
    
    return new Promise<void>((resolve, reject) => {
      const wsUrl = `ws://localhost:${this.port}/mcp_godot`;
      this.logger.debug(`Connecting to ${wsUrl}...`);
      
      // Create a new WebSocket
      this.ws = new WebSocket(wsUrl);
      
      const connectionTimeout = setTimeout(() => {
        if (this.ws) {
          this.logger.warn('Connection timeout, terminating WebSocket');
          this.disconnect();
          reject(new Error('Connection timeout'));
        }
      }, 10000);
        
      this.ws.on('open', () => {
        clearTimeout(connectionTimeout);
        this.logger.debug('WebSocket connected');
        this.isConnected = true;
        resolve();
      });
        
      this.ws.on('error', (err) => {
        clearTimeout(connectionTimeout);
        this.logger.error(`WebSocket error: ${err.message || 'Unknown error'}`);
        reject(new Error(`Connection failed: ${err.message || 'Unknown error'}`));
        this.disconnect();
      });
        
      this.ws.on('close', () => {
        this.logger.debug('WebSocket closed');
        this.isConnected = false;
      });
    });
  }
  
  /**
   * Disconnect from Godot
   */
  private disconnect(): void {
    if (this.ws) {
      this.logger.debug(`Disconnecting WebSocket...`);
      
      // First remove all event handlers to prevent callbacks during close
      this.ws.removeAllListeners();
      
      try {
        this.ws.close();
      } catch (err) {
        this.logger.error(`Error closing WebSocket: ${err instanceof Error ? err.message : String(err)}`);
      }
      
      // Clear the reference
      this.ws = null;
      this.isConnected = false;
    }
  }
}
