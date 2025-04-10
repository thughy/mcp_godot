/**
 * Error types and classes for MCP Godot
 */
export var ErrorType;
(function (ErrorType) {
    ErrorType["CONNECTION"] = "connection_error";
    ErrorType["TOOL_EXECUTION"] = "tool_execution_error";
    ErrorType["RESOURCE_FETCH"] = "resource_fetch_error";
    ErrorType["INVALID_PARAMETER"] = "invalid_parameter_error";
    ErrorType["UNKNOWN"] = "unknown_error";
})(ErrorType || (ErrorType = {}));
export class McpGodotError extends Error {
    type;
    details;
    constructor(type, message, details) {
        super(message);
        this.name = 'McpGodotError';
        this.type = type;
        this.details = details;
    }
}
