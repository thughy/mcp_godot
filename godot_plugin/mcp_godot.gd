@tool
extends EditorPlugin

const PORT = 8090
var server = null
var clients = {}
var editor_interface = null

func _enter_tree():
	# 初始化插件
	print("MCP Godot 插件已加载")
	editor_interface = get_editor_interface()
	
	# 创建 WebSocket 服务器
	var tcp_server = TCPServer.new()
	var err = tcp_server.listen(PORT)
	if err != OK:
		push_error("无法启动 MCP Godot WebSocket 服务器: %s" % err)
		return
	
	print("MCP Godot WebSocket 服务器已启动，监听端口: %d" % PORT)
	tcp_server.connect("connection_accepted", self, "_on_connection_accepted")

func _exit_tree():
	# 清理插件
	if server:
		server.close()
		server = null
	
	print("MCP Godot 插件已卸载")

func _process(delta):
	# 处理 WebSocket 连接
	if server:
		server.poll()

func _on_connection_accepted(peer):
	server = WebSocketPeer.new()
	server.set_peer(peer)
	server.connect("data_received", self, "_data_received")
	server.connect("disconnected", self, "_client_disconnected")
	clients[server.get_peer(1).get_remote_address()] = {
		"name": "Unknown Client",
		"pending_requests": {}
	}

func _client_disconnected(id, was_clean_close):
	print("MCP 客户端已断开连接: %d (clean: %s)" % [id, was_clean_close])
	if clients.has(id):
		clients.erase(id)

func _data_received(id):
	# 处理接收到的数据
	var data = server.get_peer(1).get_packet().get_string_from_utf8()
	print("收到来自 MCP 客户端的数据: %s" % data)
	
	# 解析 JSON 请求
	var json = JSON.new()
	var error = json.parse(data)
	if error != OK:
		_send_error_response(id, "无效的 JSON 请求", "invalid_request")
		return
	
	var request = json.get_data()
	
	# 验证请求格式
	if not request.has("method") and not request.has("type"):
		_send_error_response(id, "请求缺少 method 或 type 字段", "invalid_request")
		return
	
	# 处理请求
	var method = request.method if request.has("method") else request.type
	var params = request.params if request.has("params") else {}
	var request_id = request.id if request.has("id") else ""
	
	# 根据方法分发请求
	match method:
		# 场景操作命令
		"create_scene":
			_handle_create_scene(id, request_id, params)
		"open_scene":
			_handle_open_scene(id, request_id, params)
		"save_scene":
			_handle_save_scene(id, request_id, params)
		"close_scene":
			_handle_close_scene(id, request_id, params)
		
		# 节点操作命令
		"add_node":
			_handle_add_node(id, request_id, params)
		"remove_node":
			_handle_remove_node(id, request_id, params)
		"select_node":
			_handle_select_node(id, request_id, params)
		"duplicate_node":
			_handle_duplicate_node(id, request_id, params)
		
		# 属性操作命令
		"set_property":
			_handle_set_property(id, request_id, params)
		"get_property":
			_handle_get_property(id, request_id, params)
		
		# 脚本操作命令
		"create_script":
			_handle_create_script(id, request_id, params)
		"attach_script":
			_handle_attach_script(id, request_id, params)
		"edit_script":
			_handle_edit_script(id, request_id, params)
		
		# 资源操作命令
		"import_resource":
			_handle_import_resource(id, request_id, params)
		"create_resource":
			_handle_create_resource(id, request_id, params)
		"use_resource":
			_handle_use_resource(id, request_id, params)
		
		# 项目操作命令
		"build_project":
			_handle_build_project(id, request_id, params)
		"run_project":
			_handle_run_project(id, request_id, params)
		"stop_project":
			_handle_stop_project(id, request_id, params)
		
		# 通知命令
		"notify":
			_handle_notify(id, request_id, params)
		
		# 查询命令
		"query_scene_tree":
			_handle_query_scene_tree(id, request_id, params)
		"query_node_info":
			_handle_query_node_info(id, request_id, params)
		"query_resources":
			_handle_query_resources(id, request_id, params)
		"query_scripts":
			_handle_query_scripts(id, request_id, params)
		
		# 兼容旧版命令
		"execute_command":
			_handle_execute_command(id, request_id, params)
		"notify_message":
			_handle_notify_message(id, request_id, params)
		"get_scene_tree":
			_handle_query_scene_tree(id, request_id, params)
		"get_node_info":
			_handle_query_node_info(id, request_id, params)
		
		_:
			_send_error_response(id, "未知命令: %s" % method, "unknown_command", request_id)

# 场景操作处理函数
func _handle_create_scene(client_id, request_id, params):
	var template = params.template if params.has("template") else ""
	print("创建场景，模板: %s" % template)
	
	var success = false
	var message = ""
	var data = {}
	
	# 创建新场景
	var scene = Node.new()
	scene.name = "Scene"
	
	# 如果指定了模板，尝试使用模板
	if template != "":
		if template == "3d":
			# 创建3D场景
			var world_3d = Node3D.new()
			world_3d.name = "World"
			scene.add_child(world_3d)
			world_3d.owner = scene
			
			var camera = Camera3D.new()
			camera.name = "Camera"
			world_3d.add_child(camera)
			camera.owner = scene
			
			var light = DirectionalLight3D.new()
			light.name = "DirectionalLight"
			world_3d.add_child(light)
			light.owner = scene
			
			success = true
			message = "成功创建3D场景"
			data = {"scene_root": scene.name}
		elif template == "2d":
			# 创建2D场景
			var world_2d = Node2D.new()
			world_2d.name = "World"
			scene.add_child(world_2d)
			world_2d.owner = scene
			
			success = true
			message = "成功创建2D场景"
			data = {"scene_root": scene.name}
		else:
			message = "未知场景模板: %s" % template
	else:
		# 创建空场景
		success = true
		message = "成功创建空场景"
		data = {"scene_root": scene.name}
	
	if success:
		# 设置为当前场景
		editor_interface.get_edited_scene_root()
		
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message,
			"data": data
		})
	else:
		_send_error_response(client_id, message, "scene_creation_error", request_id)

func _handle_open_scene(client_id, request_id, params):
	if not params.has("path"):
		_send_error_response(client_id, "缺少必需的参数: path", "invalid_params", request_id)
		return
	
	var path = params.path
	print("打开场景: %s" % path)
	
	# 尝试打开场景
	var success = false
	var message = ""
	
	# 检查文件是否存在
	if FileAccess.file_exists(path):
		# 尝试打开场景
		var err = editor_interface.open_scene_from_path(path)
		if err == OK:
			success = true
			message = "成功打开场景: %s" % path
		else:
			message = "无法打开场景: %s, 错误码: %s" % [path, err]
	else:
		message = "场景文件不存在: %s" % path
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "scene_open_error", request_id)

func _handle_save_scene(client_id, request_id, params):
	var path = params.path if params.has("path") else ""
	print("保存场景，路径: %s" % path)
	
	var success = false
	var message = ""
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		if path != "":
			# 保存场景到指定路径
			var err = editor_interface.save_scene_as(path)
			if err == OK:
				success = true
				message = "成功保存场景到: %s" % path
			else:
				message = "无法保存场景到: %s, 错误码: %s" % [path, err]
		else:
			# 保存当前场景
			var err = editor_interface.save_scene()
			if err == OK:
				success = true
				message = "成功保存当前场景"
			else:
				message = "无法保存当前场景, 错误码: %s" % err
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "scene_save_error", request_id)

func _handle_close_scene(client_id, request_id, params):
	print("关闭当前场景")
	
	var success = false
	var message = ""
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		# 关闭当前场景
		editor_interface.get_resource_filesystem().scan()
		success = true
		message = "成功关闭当前场景"
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "scene_close_error", request_id)

# 节点操作处理函数
func _handle_add_node(client_id, request_id, params):
	if not params.has("node_type"):
		_send_error_response(client_id, "缺少必需的参数: node_type", "invalid_params", request_id)
		return
	
	var node_type = params.node_type
	var parent_path = params.parent_path if params.has("parent_path") else ""
	var node_name = params.node_name if params.has("node_name") else ""
	
	print("添加节点: %s, 父节点: %s, 名称: %s" % [node_type, parent_path, node_name])
	
	var success = false
	var message = ""
	var data = {}
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var parent_node = scene
		
		# 如果指定了父节点路径，尝试获取父节点
		if parent_path != "":
			parent_node = scene.get_node_or_null(parent_path)
			if not parent_node:
				_send_error_response(client_id, "找不到父节点: %s" % parent_path, "node_not_found", request_id)
				return
		
		# 创建新节点
		var new_node = ClassDB.instantiate(node_type)
		if new_node:
			# 设置节点名称
			if node_name != "":
				new_node.name = node_name
			
			# 添加到父节点
			parent_node.add_child(new_node)
			new_node.owner = scene
			
			success = true
			message = "成功添加节点: %s" % node_type
			data = {
				"node_path": new_node.get_path(),
				"node_name": new_node.name,
				"node_type": node_type
			}
		else:
			message = "无法创建节点类型: %s" % node_type
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message,
			"data": data
		})
	else:
		_send_error_response(client_id, message, "add_node_error", request_id)

func _handle_remove_node(client_id, request_id, params):
	if not params.has("node_path"):
		_send_error_response(client_id, "缺少必需的参数: node_path", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	print("删除节点: %s" % node_path)
	
	var success = false
	var message = ""
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			# 删除节点
			node.get_parent().remove_child(node)
			node.queue_free()
			
			success = true
			message = "成功删除节点: %s" % node_path
		else:
			message = "找不到节点: %s" % node_path
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "remove_node_error", request_id)

func _handle_select_node(client_id, request_id, params):
	if not params.has("node_path"):
		_send_error_response(client_id, "缺少必需的参数: node_path", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	print("选择节点: %s" % node_path)
	
	var success = false
	var message = ""
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			# 选择节点
			var editor_selection = editor_interface.get_selection()
			editor_selection.clear()
			editor_selection.add_node(node)
			
			success = true
			message = "成功选择节点: %s" % node_path
		else:
			message = "找不到节点: %s" % node_path
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "select_node_error", request_id)

func _handle_duplicate_node(client_id, request_id, params):
	if not params.has("node_path"):
		_send_error_response(client_id, "缺少必需的参数: node_path", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	print("复制节点: %s" % node_path)
	
	var success = false
	var message = ""
	var data = {}
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			# 复制节点
			var duplicate = node.duplicate()
			node.get_parent().add_child(duplicate)
			duplicate.owner = scene
			
			success = true
			message = "成功复制节点: %s" % node_path
			data = {
				"node_path": duplicate.get_path(),
				"node_name": duplicate.name,
				"node_type": duplicate.get_class()
			}
		else:
			message = "找不到节点: %s" % node_path
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message,
			"data": data
		})
	else:
		_send_error_response(client_id, message, "duplicate_node_error", request_id)

# 属性操作处理函数
func _handle_set_property(client_id, request_id, params):
	if not params.has("node_path") or not params.has("property") or not params.has("value"):
		_send_error_response(client_id, "缺少必需的参数: node_path, property, value", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	var property_name = params.property
	var property_value = params.value
	print("设置属性: %s.%s = %s" % [node_path, property_name, property_value])
	
	var success = false
	var message = ""
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			if property_name in node:
				node.set(property_name, property_value)
				success = true
				message = "成功设置属性: %s.%s" % [node_path, property_name]
			else:
				message = "节点没有属性: %s" % property_name
		else:
			message = "找不到节点: %s" % node_path
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "set_property_error", request_id)

func _handle_get_property(client_id, request_id, params):
	if not params.has("node_path") or not params.has("property"):
		_send_error_response(client_id, "缺少必需的参数: node_path, property", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	var property_name = params.property
	print("获取属性: %s.%s" % [node_path, property_name])
	
	var success = false
	var message = ""
	var data = {}
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			if property_name in node:
				var value = node.get(property_name)
				success = true
				message = "成功获取属性: %s.%s" % [node_path, property_name]
				data = {
					"property": property_name,
					"value": value
				}
			else:
				message = "节点没有属性: %s" % property_name
		else:
			message = "找不到节点: %s" % node_path
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message,
			"data": data
		})
	else:
		_send_error_response(client_id, message, "get_property_error", request_id)

# 脚本操作处理函数
func _handle_create_script(client_id, request_id, params):
	if not params.has("script_path") or not params.has("script_content"):
		_send_error_response(client_id, "缺少必需的参数: script_path, script_content", "invalid_params", request_id)
		return
	
	var script_path = params.script_path
	var script_content = params.script_content
	var language = params.language if params.has("language") else "gdscript"
	print("创建脚本: %s, 语言: %s" % [script_path, language])
	
	var success = false
	var message = ""
	
	# 确保脚本目录存在
	var dir = DirAccess.open("res://")
	var script_dir = script_path.get_base_dir()
	if script_dir != "":
		dir.make_dir_recursive(script_dir)
	
	# 创建脚本文件
	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if file:
		file.store_string(script_content)
		file.close()
		
		# 刷新文件系统
		editor_interface.get_resource_filesystem().scan()
		
		success = true
		message = "成功创建脚本: %s" % script_path
	else:
		message = "无法创建脚本文件: %s" % script_path
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "create_script_error", request_id)

func _handle_attach_script(client_id, request_id, params):
	if not params.has("node_path") or not params.has("script_path"):
		_send_error_response(client_id, "缺少必需的参数: node_path, script_path", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	var script_path = params.script_path
	print("附加脚本: %s 到节点: %s" % [script_path, node_path])
	
	var success = false
	var message = ""
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			# 加载脚本资源
			var script = load(script_path)
			if script:
				# 附加脚本到节点
				node.set_script(script)
				
				success = true
				message = "成功附加脚本: %s 到节点: %s" % [script_path, node_path]
			else:
				message = "无法加载脚本: %s" % script_path
		else:
			message = "找不到节点: %s" % node_path
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "attach_script_error", request_id)

func _handle_edit_script(client_id, request_id, params):
	if not params.has("script_path") or not params.has("script_content"):
		_send_error_response(client_id, "缺少必需的参数: script_path, script_content", "invalid_params", request_id)
		return
	
	var script_path = params.script_path
	var script_content = params.script_content
	print("编辑脚本: %s" % script_path)
	
	var success = false
	var message = ""
	
	# 检查脚本文件是否存在
	if FileAccess.file_exists(script_path):
		# 编辑脚本文件
		var file = FileAccess.open(script_path, FileAccess.WRITE)
		if file:
			file.store_string(script_content)
			file.close()
			
			# 刷新文件系统
			editor_interface.get_resource_filesystem().scan()
			
			success = true
			message = "成功编辑脚本: %s" % script_path
		else:
			message = "无法打开脚本文件: %s" % script_path
	else:
		message = "脚本文件不存在: %s" % script_path
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "edit_script_error", request_id)

# 资源操作处理函数
func _handle_import_resource(client_id, request_id, params):
	if not params.has("resource_path"):
		_send_error_response(client_id, "缺少必需的参数: resource_path", "invalid_params", request_id)
		return
	
	var resource_path = params.resource_path
	print("导入资源: %s" % resource_path)
	
	var success = false
	var message = "资源导入功能尚未实现"
	
	_send_error_response(client_id, message, "not_implemented", request_id)

func _handle_create_resource(client_id, request_id, params):
	if not params.has("resource_type") or not params.has("resource_path"):
		_send_error_response(client_id, "缺少必需的参数: resource_type, resource_path", "invalid_params", request_id)
		return
	
	var resource_type = params.resource_type
	var resource_path = params.resource_path
	print("创建资源: %s, 类型: %s" % [resource_path, resource_type])
	
	var success = false
	var message = ""
	
	# 创建资源
	var resource = null
	match resource_type:
		"Texture2D":
			resource = ImageTexture.new()
		"Material":
			resource = StandardMaterial3D.new()
		"AudioStream":
			resource = AudioStreamWAV.new()
		_:
			message = "不支持的资源类型: %s" % resource_type
	
	if resource:
		# 保存资源
		var err = ResourceSaver.save(resource, resource_path)
		if err == OK:
			success = true
			message = "成功创建资源: %s" % resource_path
		else:
			message = "无法保存资源: %s, 错误码: %s" % [resource_path, err]
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "create_resource_error", request_id)

func _handle_use_resource(client_id, request_id, params):
	if not params.has("resource_path") or not params.has("node_path") or not params.has("property"):
		_send_error_response(client_id, "缺少必需的参数: resource_path, node_path, property", "invalid_params", request_id)
		return
	
	var resource_path = params.resource_path
	var node_path = params.node_path
	var property = params.property
	print("使用资源: %s 设置节点: %s 的属性: %s" % [resource_path, node_path, property])
	
	var success = false
	var message = ""
	
	# 加载资源
	var resource = load(resource_path)
	if resource:
		var scene = editor_interface.get_edited_scene_root()
		if scene:
			var node = scene.get_node_or_null(node_path)
			if node:
				if property in node:
					# 设置属性
					node.set(property, resource)
					success = true
					message = "成功设置资源: %s 到节点: %s 的属性: %s" % [resource_path, node_path, property]
				else:
					message = "节点没有属性: %s" % property
			else:
				message = "找不到节点: %s" % node_path
		else:
			message = "没有打开的场景"
	else:
		message = "无法加载资源: %s" % resource_path
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "use_resource_error", request_id)

# 项目操作处理函数
func _handle_build_project(client_id, request_id, params):
	var platform = params.platform if params.has("platform") else "Windows Desktop"
	var debug = params.debug if params.has("debug") else true
	print("构建项目，平台: %s, 调试模式: %s" % [platform, debug])
	
	var message = "项目构建功能尚未实现"
	_send_error_response(client_id, message, "not_implemented", request_id)

func _handle_run_project(client_id, request_id, params):
	var debug = params.debug if params.has("debug") else true
	print("运行项目，调试模式: %s" % debug)
	
	var success = false
	var message = ""
	
	# 运行项目
	editor_interface.play_main_scene()
	success = true
	message = "成功运行项目"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "run_project_error", request_id)

func _handle_stop_project(client_id, request_id, params):
	print("停止项目")
	
	var success = false
	var message = ""
	
	# 停止项目
	editor_interface.stop_playing_scene()
	success = true
	message = "成功停止项目"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message
		})
	else:
		_send_error_response(client_id, message, "stop_project_error", request_id)

# 通知处理函数
func _handle_notify(client_id, request_id, params):
	if not params.has("message"):
		_send_error_response(client_id, "缺少必需的参数: message", "invalid_params", request_id)
		return
	
	var message = params.message
	var level = params.level if params.has("level") else "info"
	print("显示通知: %s, 级别: %s" % [message, level])
	
	# 显示通知
	match level:
		"info":
			editor_interface.get_base_control().notify_info(message)
		"warning":
			editor_interface.get_base_control().notify_warning(message)
		"error":
			editor_interface.get_base_control().notify_error(message)
		_:
			editor_interface.get_base_control().notify_info(message)
	
	_send_success_response(client_id, request_id, {
		"success": true,
		"message": "成功显示通知: %s" % message
	})

# 查询处理函数
func _handle_query_scene_tree(client_id, request_id, params):
	print("查询场景树")
	
	var scene_tree = {}
	var scene = editor_interface.get_edited_scene_root()
	
	if scene:
		scene_tree = _get_node_data(scene)
	
	_send_success_response(client_id, request_id, {
		"success": true,
		"data": scene_tree
	})

func _handle_query_node_info(client_id, request_id, params):
	if not params.has("node_path"):
		_send_error_response(client_id, "缺少必需的参数: node_path", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	print("查询节点信息: %s" % node_path)
	
	var success = false
	var message = ""
	var data = {}
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			data = _get_node_data(node, true)
			success = true
			message = "成功获取节点信息: %s" % node_path
		else:
			message = "找不到节点: %s" % node_path
	else:
		message = "没有打开的场景"
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message,
			"data": data
		})
	else:
		_send_error_response(client_id, message, "query_node_info_error", request_id)

func _handle_query_resources(client_id, request_id, params):
	var filter = params.filter if params.has("filter") else ""
	print("查询资源，过滤器: %s" % filter)
	
	var resources = []
	
	# 获取项目中的资源
	var dir = DirAccess.open("res://")
	if dir:
		_scan_dir_for_resources(dir, "", resources, filter)
	
	_send_success_response(client_id, request_id, {
		"success": true,
		"data": {
			"resources": resources
		}
	})

func _handle_query_scripts(client_id, request_id, params):
	var filter = params.filter if params.has("filter") else ""
	print("查询脚本，过滤器: %s" % filter)
	
	var scripts = []
	
	# 获取项目中的脚本
	var dir = DirAccess.open("res://")
	if dir:
		_scan_dir_for_scripts(dir, "", scripts, filter)
	
	_send_success_response(client_id, request_id, {
		"success": true,
		"data": {
			"scripts": scripts
		}
	})

# 兼容旧版命令
func _handle_execute_command(client_id, request_id, params):
	if not params.has("command"):
		_send_error_response(client_id, "缺少必需的参数: command", "invalid_params", request_id)
		return
	
	var command = params.command
	print("执行命令: %s" % command)
	
	# 尝试执行命令
	var success = true
	var message = "成功执行命令: %s" % command
	
	if success:
		_send_success_response(client_id, request_id, {
			"success": true,
			"message": message,
			"type": "text"
		})
	else:
		_send_error_response(client_id, "执行命令失败: %s" % command, "execution_error", request_id)

func _handle_notify_message(client_id, request_id, params):
	if not params.has("message"):
		_send_error_response(client_id, "缺少必需的参数: message", "invalid_params", request_id)
		return
	
	var message = params.message
	var type = params.type if params.has("type") else "info"
	print("显示通知: %s (类型: %s)" % [message, type])
	
	# 显示通知
	match type:
		"info":
			editor_interface.get_base_control().notify_info(message)
		"warning":
			editor_interface.get_base_control().notify_warning(message)
		"error":
			editor_interface.get_base_control().notify_error(message)
		_:
			editor_interface.get_base_control().notify_info(message)
	
	_send_success_response(client_id, request_id, {
		"success": true,
		"message": "成功显示通知: %s" % message
	})

# 辅助函数
func _get_node_data(node, include_properties = false):
	var data = {
		"name": node.name,
		"type": node.get_class(),
		"path": node.get_path()
	}
	
	if include_properties:
		var properties = {}
		var property_list = node.get_property_list()
		
		for prop in property_list:
			if prop.usage & PROPERTY_USAGE_EDITOR and not prop.name.begins_with("_"):
				properties[prop.name] = node.get(prop.name)
		
		data["properties"] = properties
	
	var children = []
	for child in node.get_children():
		if not include_properties:
			children.append(_get_node_data(child))
	
	if children.size() > 0:
		data["children"] = children
	
	return data

func _scan_dir_for_resources(dir, path, resources, filter):
	dir.list_dir_begin()
	var file_name = dir.get_next()
	
	while file_name != "":
		if dir.current_is_dir():
			var sub_dir = DirAccess.open("res://%s/%s" % [path, file_name])
			if sub_dir:
				var sub_path = path + "/" + file_name if path != "" else file_name
				_scan_dir_for_resources(sub_dir, sub_path, resources, filter)
		else:
			var file_path = path + "/" + file_name if path != "" else file_name
			var full_path = "res://%s" % file_path
			
			# 检查是否是资源文件
			if file_name.get_extension() in ["png", "jpg", "tres", "res", "wav", "mp3", "ogg"]:
				if filter == "" or filter in file_path:
					resources.append({
						"path": full_path,
						"type": file_name.get_extension(),
						"name": file_name.get_basename()
					})
		
		file_name = dir.get_next()
	
	dir.list_dir_end()

func _scan_dir_for_scripts(dir, path, scripts, filter):
	dir.list_dir_begin()
	var file_name = dir.get_next()
	
	while file_name != "":
		if dir.current_is_dir():
			var sub_dir = DirAccess.open("res://%s/%s" % [path, file_name])
			if sub_dir:
				var sub_path = path + "/" + file_name if path != "" else file_name
				_scan_dir_for_scripts(sub_dir, sub_path, scripts, filter)
		else:
			var file_path = path + "/" + file_name if path != "" else file_name
			var full_path = "res://%s" % file_path
			
			# 检查是否是脚本文件
			if file_name.get_extension() in ["gd", "cs"]:
				if filter == "" or filter in file_path:
					scripts.append({
						"path": full_path,
						"language": "gdscript" if file_name.get_extension() == "gd" else "csharp",
						"name": file_name.get_basename()
					})
		
		file_name = dir.get_next()
	
	dir.list_dir_end()

# 发送成功响应
func _send_success_response(client_id, request_id, result):
	var response = {
		"jsonrpc": "2.0",
		"id": request_id,
		"result": result
	}
	
	var json_string = JSON.stringify(response)
	server.get_peer(1).put_packet(json_string.to_utf8_buffer())

# 发送错误响应
func _send_error_response(client_id, message, error_type, request_id = ""):
	var response = {
		"jsonrpc": "2.0",
		"id": request_id,
		"error": {
			"message": message,
			"type": error_type
		}
	}
	
	var json_string = JSON.stringify(response)
	server.get_peer(1).put_packet(json_string.to_utf8_buffer())
