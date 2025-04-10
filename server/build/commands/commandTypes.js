/**
 * Command types for MCP Godot
 */
// Scene operation command types
export var SceneCommandType;
(function (SceneCommandType) {
    SceneCommandType["CREATE_SCENE"] = "create_scene";
    SceneCommandType["OPEN_SCENE"] = "open_scene";
    SceneCommandType["SAVE_SCENE"] = "save_scene";
    SceneCommandType["CLOSE_SCENE"] = "close_scene";
})(SceneCommandType || (SceneCommandType = {}));
// Node operation command types
export var NodeCommandType;
(function (NodeCommandType) {
    NodeCommandType["ADD_NODE"] = "add_node";
    NodeCommandType["REMOVE_NODE"] = "remove_node";
    NodeCommandType["SELECT_NODE"] = "select_node";
    NodeCommandType["DUPLICATE_NODE"] = "duplicate_node";
    NodeCommandType["RENAME_NODE"] = "rename_node";
})(NodeCommandType || (NodeCommandType = {}));
// Property operation command types
export var PropertyCommandType;
(function (PropertyCommandType) {
    PropertyCommandType["SET_PROPERTY"] = "set_property";
    PropertyCommandType["GET_PROPERTY"] = "get_property";
})(PropertyCommandType || (PropertyCommandType = {}));
// Script operation command types
export var ScriptCommandType;
(function (ScriptCommandType) {
    ScriptCommandType["CREATE_SCRIPT"] = "create_script";
    ScriptCommandType["ATTACH_SCRIPT"] = "attach_script";
    ScriptCommandType["EDIT_SCRIPT"] = "edit_script";
})(ScriptCommandType || (ScriptCommandType = {}));
// Resource operation command types
export var ResourceCommandType;
(function (ResourceCommandType) {
    ResourceCommandType["IMPORT_RESOURCE"] = "import_resource";
    ResourceCommandType["CREATE_RESOURCE"] = "create_resource";
    ResourceCommandType["USE_RESOURCE"] = "use_resource";
})(ResourceCommandType || (ResourceCommandType = {}));
// Project operation command types
export var ProjectCommandType;
(function (ProjectCommandType) {
    ProjectCommandType["BUILD_PROJECT"] = "build_project";
    ProjectCommandType["RUN_PROJECT"] = "run_project";
    ProjectCommandType["STOP_PROJECT"] = "stop_project";
})(ProjectCommandType || (ProjectCommandType = {}));
// Notification command types
export var NotificationCommandType;
(function (NotificationCommandType) {
    NotificationCommandType["NOTIFY"] = "notify";
})(NotificationCommandType || (NotificationCommandType = {}));
// Query command types
export var QueryCommandType;
(function (QueryCommandType) {
    QueryCommandType["GET_SCENE_TREE"] = "get_scene_tree";
    QueryCommandType["GET_NODE_INFO"] = "get_node_info";
    QueryCommandType["GET_RESOURCES"] = "get_resources";
})(QueryCommandType || (QueryCommandType = {}));
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
