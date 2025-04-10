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
        this.logger.info(`Not connected to Godot, attempting to connect...`);
        await this.connect();
        this.logger.info(`Successfully connected to Godot`);
      } catch (error) {
        const errorMsg = `Failed to connect to Godot: ${error instanceof Error ? error.message : String(error)}`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }
    }
    
    const id = uuidv4();
    const request = { id, method, params };
    
    return new Promise((resolve, reject) => {
      // 设置请求超时
      const timeoutId = setTimeout(() => {
        const errorMsg = `Request timeout for method: ${method}`;
        this.logger.error(errorMsg);
        reject(new Error(errorMsg));
      }, 15000); // 增加超时时间到 15 秒
      
      // 设置消息处理函数
      const messageHandler = (data: WebSocket.Data) => {
        try {
          // 确保数据是字符串
          if (!data) {
            this.logger.warn(`Received empty WebSocket message`);
            return; // 忽略空消息
          }
          
          const dataStr = data.toString();
          this.logger.debug(`Received response: ${dataStr}`);
          
          // 解析 JSON 响应
          const response = JSON.parse(dataStr);
          
          // 检查是否是当前请求的响应
          if (response.id === id) {
            // 移除消息处理函数
            if (this.ws) {
              this.ws.removeListener('message', messageHandler);
            }
            clearTimeout(timeoutId);
            
            // 处理响应
            if (response.error) {
              const errorMsg = response.error.message || 'Unknown error';
              this.logger.error(`Error response for method ${method}: ${errorMsg}`);
              reject(new Error(errorMsg));
            } else if (!response.success && response.message) {
              // 有些响应可能没有 error 字段，但有 success=false
              const errorMsg = response.message;
              this.logger.error(`Failed response for method ${method}: ${errorMsg}`);
              reject(new Error(errorMsg));
            } else {
              this.logger.debug(`Successful response for method ${method}`);
              resolve(response);
            }
          }
        } catch (e) {
          this.logger.error(`Error parsing WebSocket message: ${e instanceof Error ? e.message : String(e)}`);
          // 不要在这里 reject，因为可能收到的是其他请求的响应
        }
      };
      
      // 添加消息处理函数
      if (this.ws) {
        this.ws.on('message', messageHandler);
      } else {
        clearTimeout(timeoutId);
        const errorMsg = 'WebSocket is not initialized';
        this.logger.error(errorMsg);
        reject(new Error(errorMsg));
        return;
      }
      
      // 发送请求
      try {
        const requestStr = JSON.stringify(request);
        this.logger.debug(`Sending request: ${requestStr}`);
        this.ws.send(requestStr);
        this.logger.debug(`Request sent for method: ${method}`);
      } catch (error) {
        clearTimeout(timeoutId);
        if (this.ws) {
          this.ws.removeListener('message', messageHandler);
        }
        const errorMsg = `Failed to send request: ${error instanceof Error ? error.message : String(error)}`;
        this.logger.error(errorMsg);
        reject(new Error(errorMsg));
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
