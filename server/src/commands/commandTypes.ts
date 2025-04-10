/**
 * Command types for MCP Godot
 */

// Base command interface
export interface Command {
  type: string;
  params: Record<string, any>;
}

// Command response interface
export interface CommandResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Command handler interface
export interface CommandHandler {
  canHandle(command: Command): boolean;
  handle(command: Command): Promise<CommandResponse>;
}

// Scene operation command types
export enum SceneCommandType {
  CREATE_SCENE = 'create_scene',
  OPEN_SCENE = 'open_scene',
  SAVE_SCENE = 'save_scene',
  CLOSE_SCENE = 'close_scene'
}

// Node operation command types
export enum NodeCommandType {
  ADD_NODE = 'add_node',
  REMOVE_NODE = 'remove_node',
  SELECT_NODE = 'select_node',
  DUPLICATE_NODE = 'duplicate_node',
  RENAME_NODE = 'rename_node'
}

// Property operation command types
export enum PropertyCommandType {
  SET_PROPERTY = 'set_property',
  GET_PROPERTY = 'get_property'
}

// Script operation command types
export enum ScriptCommandType {
  CREATE_SCRIPT = 'create_script',
  ATTACH_SCRIPT = 'attach_script',
  EDIT_SCRIPT = 'edit_script'
}

// Resource operation command types
export enum ResourceCommandType {
  IMPORT_RESOURCE = 'import_resource',
  CREATE_RESOURCE = 'create_resource',
  USE_RESOURCE = 'use_resource'
}

// Project operation command types
export enum ProjectCommandType {
  BUILD_PROJECT = 'build_project',
  RUN_PROJECT = 'run_project',
  STOP_PROJECT = 'stop_project'
}

// Notification command types
export enum NotificationCommandType {
  NOTIFY = 'notify'
}

// Query command types
export enum QueryCommandType {
  GET_SCENE_TREE = 'get_scene_tree',
  GET_NODE_INFO = 'get_node_info',
  GET_RESOURCES = 'get_resources'
}

// All command types combined
export const CommandTypes = {
  ...SceneCommandType,
  ...NodeCommandType,
  ...PropertyCommandType,
  ...ScriptCommandType,
  ...ResourceCommandType,
  ...ProjectCommandType,
  ...NotificationCommandType,
  ...QueryCommandType
};
