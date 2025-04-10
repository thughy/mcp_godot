/**
 * Logger utility for MCP Godot
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
export class Logger {
    name;
    level;
    constructor(name, level = LogLevel.INFO) {
        this.name = name;
        this.level = level;
    }
    /**
     * Log a debug message
     */
    debug(message, ...args) {
        this.log(LogLevel.DEBUG, message, ...args);
    }
    /**
     * Log an info message
     */
    info(message, ...args) {
        this.log(LogLevel.INFO, message, ...args);
    }
    /**
     * Log a warning message
     */
    warn(message, ...args) {
        this.log(LogLevel.WARN, message, ...args);
    }
    /**
     * Log an error message
     */
    error(message, ...args) {
        this.log(LogLevel.ERROR, message, ...args);
    }
    /**
     * Internal log method
     */
    log(level, message, ...args) {
        if (level < this.level) {
            return;
        }
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${this.getLevelString(level)}] [${this.name}]`;
        if (args.length > 0) {
            console.log(`${prefix} ${message}`, ...args);
        }
        else {
            console.log(`${prefix} ${message}`);
        }
    }
    /**
     * Get string representation of log level
     */
    getLevelString(level) {
        switch (level) {
            case LogLevel.DEBUG:
                return 'DEBUG';
            case LogLevel.INFO:
                return 'INFO';
            case LogLevel.WARN:
                return 'WARN';
            case LogLevel.ERROR:
                return 'ERROR';
            default:
                return 'UNKNOWN';
        }
    }
}
