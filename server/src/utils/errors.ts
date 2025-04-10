/**
 * Error types and classes for MCP Godot
 */

export enum ErrorType {
  CONNECTION = 'connection_error',
  TOOL_EXECUTION = 'tool_execution_error',
  RESOURCE_FETCH = 'resource_fetch_error',
  INVALID_PARAMETER = 'invalid_parameter_error',
  UNKNOWN = 'unknown_error'
}

export class McpGodotError extends Error {
  type: ErrorType;
  details?: any;

  constructor(type: ErrorType, message: string, details?: any) {
    super(message);
    this.name = 'McpGodotError';
    this.type = type;
    this.details = details;
  }
}
