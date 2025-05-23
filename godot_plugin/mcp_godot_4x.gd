@tool
extends EditorPlugin

const PORT = 8090
var tcp_server = null
var peers = {}
var editor_interface = null

func _enter_tree():
	# 初始化插件
	print("MCP Godot 插件已加载")
	editor_interface = get_editor_interface()
	
	# 创建 TCP 服务器
	tcp_server = TCPServer.new()
	var err = tcp_server.listen(PORT)
	if err != OK:
		push_error("无法启动 MCP Godot TCP 服务器: %s" % err)
		return
	
	print("MCP Godot TCP 服务器已启动，监听端口: %d" % PORT)

func _exit_tree():
	# 清理插件
	if tcp_server:
		tcp_server.stop()
		tcp_server = null
	
	# 关闭所有连接
	for peer_id in peers:
		var peer = peers[peer_id]
		if peer.ws and peer.ws.get_ready_state() != WebSocketPeer.STATE_CLOSED:
			peer.ws.close()
	peers.clear()
	
	print("MCP Godot 插件已卸载")

func _process(delta):
	# 接受新连接
	if tcp_server and tcp_server.is_connection_available():
		var connection = tcp_server.take_connection()
		if connection:
			_setup_peer(connection)
	
	# 处理现有连接
	var peers_to_remove = []
	for peer_id in peers:
		var peer = peers[peer_id]
		var ws = peer.ws
		
		ws.poll()
		var state = ws.get_ready_state()
		
		if state == WebSocketPeer.STATE_OPEN:
			while ws.get_available_packet_count() > 0:
				var packet = ws.get_packet()
				var data = packet.get_string_from_utf8()
				_handle_message(peer_id, data)
		
		elif state == WebSocketPeer.STATE_CLOSING:
			# 等待关闭
			pass
		
		elif state == WebSocketPeer.STATE_CLOSED:
			peers_to_remove.append(peer_id)
	
	# 移除已关闭的连接
	for peer_id in peers_to_remove:
		print("MCP 客户端已断开连接: %s" % peer_id)
		peers.erase(peer_id)

func _setup_peer(connection):
	var ws = WebSocketPeer.new()
	ws.accept_stream(connection)
	
	var peer_id = str(connection.get_connected_host()) + ":" + str(connection.get_connected_port())
	print("MCP 客户端已连接: %s" % peer_id)
	
	peers[peer_id] = {
		"ws": ws,
		"name": "Unknown Client",
		"pending_requests": {}
	}

func _handle_message(peer_id, data):
	print("收到来自 MCP 客户端的数据: %s" % data)
	
	# 解析 JSON 请求
	var json = JSON.new()
	var error = json.parse(data)
	if error != OK:
		_send_error_response(peer_id, "无效的 JSON 请求", "invalid_request")
		return
	
	var request = json.get_data()
	
	# 验证请求格式
	if not request.has("method") and not request.has("type"):
		_send_error_response(peer_id, "请求缺少 method 或 type 字段", "invalid_request")
		return
	
	# 处理请求
	var method = request.method if request.has("method") else request.type
	var params = request.params if request.has("params") else {}
	var request_id = request.id if request.has("id") else ""
	
	# 根据方法分发请求
	match method:
		# 场景操作命令
		"create_scene":
			_handle_create_scene(peer_id, request_id, params)
		"open_scene":
			_handle_open_scene(peer_id, request_id, params)
		"save_scene":
			_handle_save_scene(peer_id, request_id, params)
		"close_scene":
			_handle_close_scene(peer_id, request_id, params)
		
		# 节点操作命令
		"add_node":
			_handle_add_node(peer_id, request_id, params)
		"remove_node":
			_handle_remove_node(peer_id, request_id, params)
		"select_node":
			_handle_select_node(peer_id, request_id, params)
		"duplicate_node":
			_handle_duplicate_node(peer_id, request_id, params)
		
		# 属性操作命令
		"set_property":
			_handle_set_property(peer_id, request_id, params)
		"get_property":
			_handle_get_property(peer_id, request_id, params)
		
		# 脚本操作命令
		"create_script":
			_handle_create_script(peer_id, request_id, params)
		"attach_script":
			_handle_attach_script(peer_id, request_id, params)
		"edit_script":
			_handle_edit_script(peer_id, request_id, params)
		
		# 通知命令
		"notify":
			_handle_notify(peer_id, request_id, params)
		
		# 兼容旧版命令
		"notify_message":
			_handle_notify_message(peer_id, request_id, params)
		
		_:
			_send_error_response(peer_id, "未知命令: %s" % method, "unknown_command", request_id)

# 场景操作处理函数
func _handle_create_scene(peer_id, request_id, params):
	var template = params.template if params.has("template") else ""
	print("创建场景，模板: %s" % template)
	
	var scene_root = null
	
	# 创建新场景
	if template == "3d":
		# 创建3D场景
		scene_root = Node3D.new()
		scene_root.name = "Node3D"
		
		# 添加摄像机
		var camera = Camera3D.new()
		camera.name = "Camera3D"
		camera.transform.origin = Vector3(0, 1, 5)
		camera.transform = camera.transform.looking_at(Vector3(0, 0, 0))
		scene_root.add_child(camera)
		camera.owner = scene_root
		
		# 添加光源
		var light = DirectionalLight3D.new()
		light.name = "DirectionalLight3D"
		light.transform.origin = Vector3(0, 5, 0)
		light.transform = light.transform.looking_at(Vector3(1, -1, 1))
		scene_root.add_child(light)
		light.owner = scene_root
	elif template == "2d":
		# 创建2D场景
		scene_root = Node2D.new()
		scene_root.name = "Node2D"
		
		# 添加摄像机
		var camera = Camera2D.new()
		camera.name = "Camera2D"
		scene_root.add_child(camera)
		camera.owner = scene_root
	else:
		# 创建空场景
		scene_root = Node.new()
		scene_root.name = "Node"
	
	# 创建一个新的场景树
	var scene = SceneTree.new()
	scene.root.add_child(scene_root)
	
	# 获取当前编辑界面
	var editor_main_screen = editor_interface.get_editor_main_screen()
	
	# 将新场景设置为当前编辑场景
	editor_interface.get_editor_settings().set_setting("filesystem/file_dialog/show_hidden_files", true)
	
	# 创建一个临时场景文件
	var temp_scene_path = "res://temp_scene.tscn"
	var packed_scene = PackedScene.new()
	packed_scene.pack(scene_root)
	ResourceSaver.save(packed_scene, temp_scene_path)
	
	# 打开临时场景
	editor_interface.open_scene_from_path(temp_scene_path)
	
	# 发送成功响应
	_send_success_response(peer_id, request_id, "场景创建成功", {
		"scene_name": scene_root.name,
		"scene_path": temp_scene_path
	})

func _handle_open_scene(peer_id, request_id, params):
	if not params.has("path"):
		_send_error_response(peer_id, "缺少必需的参数: path", "invalid_params", request_id)
		return
	
	var path = params.path
	print("打开场景: %s" % path)
	
	# 打开场景
	var error = editor_interface.open_scene_from_path(path)
	if error != OK:
		_send_error_response(peer_id, "无法打开场景: %s" % error, "open_scene_error", request_id)
		return
	
	_send_success_response(peer_id, request_id, "场景打开成功", {
		"scene_path": path
	})

func _handle_save_scene(peer_id, request_id, params):
	var path = params.path if params.has("path") else ""
	print("保存场景，路径: %s" % path)
	
	var scene = editor_interface.get_edited_scene_root()
	if not scene:
		_send_error_response(peer_id, "没有正在编辑的场景", "save_scene_error", request_id)
		return
	
	# 保存场景
	if path.is_empty():
		# 保存当前场景
		var current_path = scene.scene_file_path
		if current_path.is_empty():
			current_path = "res://temp_scene.tscn"
		
		var packed_scene = PackedScene.new()
		var result = packed_scene.pack(scene)
		if result == OK:
			var err = ResourceSaver.save(packed_scene, current_path)
			if err == OK:
				_send_success_response(peer_id, request_id, "场景保存成功", {
					"scene_path": current_path
				})
			else:
				_send_error_response(peer_id, "无法保存场景: %s" % err, "save_scene_error", request_id)
		else:
			_send_error_response(peer_id, "无法打包场景: %s" % result, "save_scene_error", request_id)
	else:
		# 保存到指定路径
		# 检查路径是否有效
		if not path.begins_with("res://"):
			path = "res://" + path
		
		# 确保目录存在
		var dir = path.get_base_dir()
		if not DirAccess.dir_exists_absolute(dir):
			DirAccess.make_dir_recursive_absolute(dir)
		
		var packed_scene = PackedScene.new()
		var result = packed_scene.pack(scene)
		if result == OK:
			var err = ResourceSaver.save(packed_scene, path)
			if err == OK:
				_send_success_response(peer_id, request_id, "场景保存成功", {
					"scene_path": path
				})
			else:
				_send_error_response(peer_id, "无法保存场景: %s" % err, "save_scene_error", request_id)
		else:
			_send_error_response(peer_id, "无法打包场景: %s" % result, "save_scene_error", request_id)

func _handle_close_scene(peer_id, request_id, params):
	print("关闭当前场景")
	
	# 关闭当前场景
	editor_interface.get_editor_main_screen().get_tree().get_root().get_child(0).queue_free()
	
	_send_success_response(peer_id, request_id, "场景关闭成功", {})

# 属性操作处理函数
func _handle_set_property(peer_id, request_id, params):
	if not params.has("node_path") or not params.has("property") or not params.has("value"):
		_send_error_response(peer_id, "缺少必需的参数: node_path, property, value", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	var property_name = params.property
	var property_value = params.value
	print("设置属性: %s.%s = %s" % [node_path, property_name, property_value])
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			if property_name in node:
				node.set(property_name, property_value)
				_send_success_response(peer_id, request_id, "成功设置属性: %s.%s" % [node_path, property_name], {
					"node_path": node_path,
					"property": property_name,
					"value": property_value
				})
			else:
				_send_error_response(peer_id, "节点没有属性: %s" % property_name, "property_not_found", request_id)
		else:
			_send_error_response(peer_id, "找不到节点: %s" % node_path, "node_not_found", request_id)
	else:
		_send_error_response(peer_id, "没有打开的场景", "no_scene", request_id)

func _handle_get_property(peer_id, request_id, params):
	if not params.has("node_path") or not params.has("property"):
		_send_error_response(peer_id, "缺少必需的参数: node_path, property", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	var property_name = params.property
	print("获取属性: %s.%s" % [node_path, property_name])
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			if property_name in node:
				var value = node.get(property_name)
				_send_success_response(peer_id, request_id, "成功获取属性: %s.%s" % [node_path, property_name], {
					"node_path": node_path,
					"property": property_name,
					"value": value
				})
			else:
				_send_error_response(peer_id, "节点没有属性: %s" % property_name, "property_not_found", request_id)
		else:
			_send_error_response(peer_id, "找不到节点: %s" % node_path, "node_not_found", request_id)
	else:
		_send_error_response(peer_id, "没有打开的场景", "no_scene", request_id)

# 脚本操作处理函数
func _handle_create_script(peer_id, request_id, params):
	if not params.has("path") or not params.has("content"):
		_send_error_response(peer_id, "缺少必需的参数: path, content", "invalid_params", request_id)
		return
	
	var script_path = params.path
	var script_content = params.content
	print("创建脚本: %s" % script_path)
	
	# 确保路径有效
	if not script_path.begins_with("res://"):
		script_path = "res://" + script_path
	
	# 确保目录存在
	var dir = script_path.get_base_dir()
	if not DirAccess.dir_exists_absolute(dir):
		DirAccess.make_dir_recursive_absolute(dir)
	
	# 写入脚本内容
	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if file:
		file.store_string(script_content)
		file.close()
		_send_success_response(peer_id, request_id, "脚本创建成功", {
			"script_path": script_path
		})
	else:
		_send_error_response(peer_id, "无法写入脚本文件", "script_write_error", request_id)

func _handle_attach_script(peer_id, request_id, params):
	if not params.has("node_path") or not params.has("script_path"):
		_send_error_response(peer_id, "缺少必需的参数: node_path, script_path", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	var script_path = params.script_path
	print("附加脚本到节点: %s -> %s" % [node_path, script_path])
	
	# 确保路径有效
	if not script_path.begins_with("res://"):
		script_path = "res://" + script_path
	
	var scene = editor_interface.get_edited_scene_root()
	if scene:
		var node = scene.get_node_or_null(node_path)
		if node:
			# 加载脚本
			var script = load(script_path)
			if script:
				# 附加脚本到节点
				node.set_script(script)
				_send_success_response(peer_id, request_id, "脚本附加成功", {
					"node_path": node_path,
					"script_path": script_path
				})
			else:
				_send_error_response(peer_id, "无法加载脚本: %s" % script_path, "script_load_error", request_id)
		else:
			_send_error_response(peer_id, "找不到节点: %s" % node_path, "node_not_found", request_id)
	else:
		_send_error_response(peer_id, "没有打开的场景", "no_scene", request_id)

func _handle_edit_script(peer_id, request_id, params):
	if not params.has("script_path") or not params.has("content"):
		_send_error_response(peer_id, "缺少必需的参数: script_path, content", "invalid_params", request_id)
		return
	
	var script_path = params.script_path
	var script_content = params.content
	print("编辑脚本: %s" % script_path)
	
	# 确保路径有效
	if not script_path.begins_with("res://"):
		script_path = "res://" + script_path
	
	# 写入脚本内容
	var file = FileAccess.open(script_path, FileAccess.WRITE)
	if file:
		file.store_string(script_content)
		file.close()
		_send_success_response(peer_id, request_id, "脚本编辑成功", {
			"script_path": script_path
		})
	else:
		_send_error_response(peer_id, "无法写入脚本文件", "script_write_error", request_id)

# 节点操作处理函数
func _handle_add_node(peer_id, request_id, params):
	if not params.has("node_type"):
		_send_error_response(peer_id, "缺少必需的参数: node_type", "invalid_params", request_id)
		return
	
	var node_type = params.node_type
	var parent_path = params.parent_path if params.has("parent_path") else ""
	var node_name = params.node_name if params.has("node_name") else ""
	
	print("添加节点，类型: %s，父节点: %s，名称: %s" % [node_type, parent_path, node_name])
	
	# 创建节点
	var node = null
	match node_type:
		"Node3D", "Spatial":
			node = Node3D.new()
		"Node2D":
			node = Node2D.new()
		"Control":
			node = Control.new()
		"Camera3D", "Camera":
			node = Camera3D.new()
		"Camera2D":
			node = Camera2D.new()
		"DirectionalLight3D", "DirectionalLight":
			node = DirectionalLight3D.new()
		"SpotLight3D", "SpotLight":
			node = SpotLight3D.new()
		"OmniLight3D", "OmniLight":
			node = OmniLight3D.new()
		"Sprite2D", "Sprite":
			node = Sprite2D.new()
		"AnimatedSprite2D", "AnimatedSprite":
			node = AnimatedSprite2D.new()
		"Label":
			node = Label.new()
		"Button":
			node = Button.new()
		"LineEdit":
			node = LineEdit.new()
		"TextEdit":
			node = TextEdit.new()
		"Panel":
			node = Panel.new()
		"RichTextLabel":
			node = RichTextLabel.new()
		"CollisionShape3D", "CollisionShape":
			node = CollisionShape3D.new()
		"CollisionShape2D":
			node = CollisionShape2D.new()
		"StaticBody3D", "StaticBody":
			node = StaticBody3D.new()
		"StaticBody2D":
			node = StaticBody2D.new()
		"RigidBody3D", "RigidBody":
			node = RigidBody3D.new()
		"RigidBody2D":
			node = RigidBody2D.new()
		"Area3D", "Area":
			node = Area3D.new()
		"Area2D":
			node = Area2D.new()
		"CSGBox3D":
			node = CSGBox3D.new()
		"CSGSphere3D":
			node = CSGSphere3D.new()
		"CSGCylinder3D":
			node = CSGCylinder3D.new()
		"CSGTorus3D":
			node = CSGTorus3D.new()
		_:
			_send_error_response(peer_id, "不支持的节点类型: %s" % node_type, "unsupported_node_type", request_id)
			return
	
	# 设置节点名称
	if not node_name.is_empty():
		node.name = node_name
	
	# 获取当前编辑场景的根节点
	var scene_root = editor_interface.get_edited_scene_root()
	if not scene_root:
		_send_error_response(peer_id, "没有打开的场景", "no_open_scene", request_id)
		return
	
	# 添加到父节点
	var parent = null
	if parent_path.is_empty():
		# 添加到当前选中的节点
		var selected_nodes = editor_interface.get_selection().get_selected_nodes()
		if selected_nodes.size() > 0:
			parent = selected_nodes[0]
		else:
			# 添加到场景根节点
			parent = scene_root
	else:
		# 添加到指定路径的节点
		parent = scene_root.get_node(parent_path)
	
	if parent:
		parent.add_child(node)
		node.owner = scene_root
		
		# 选中新添加的节点
		editor_interface.get_selection().clear()
		editor_interface.get_selection().add_node(node)
		
		_send_success_response(peer_id, request_id, "节点添加成功", {
			"node_path": node.get_path(),
			"node_name": node.name,
			"node_type": node_type
		})
	else:
		node.queue_free()
		_send_error_response(peer_id, "找不到父节点", "parent_node_not_found", request_id)

func _handle_remove_node(peer_id, request_id, params):
	if not params.has("node_path"):
		_send_error_response(peer_id, "缺少必需的参数: node_path", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	print("删除节点: %s" % node_path)
	
	# 获取当前编辑场景的根节点
	var scene_root = editor_interface.get_edited_scene_root()
	if not scene_root:
		_send_error_response(peer_id, "没有打开的场景", "no_open_scene", request_id)
		return
	
	# 获取节点
	var node = scene_root.get_node(node_path)
	if not node:
		_send_error_response(peer_id, "找不到节点: %s" % node_path, "node_not_found", request_id)
		return
	
	# 删除节点
	node.queue_free()
	
	_send_success_response(peer_id, request_id, "节点删除成功", {
		"node_path": node_path
	})

func _handle_select_node(peer_id, request_id, params):
	if not params.has("node_path"):
		_send_error_response(peer_id, "缺少必需的参数: node_path", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	print("选择节点: %s" % node_path)
	
	# 获取当前编辑场景的根节点
	var scene_root = editor_interface.get_edited_scene_root()
	if not scene_root:
		_send_error_response(peer_id, "没有打开的场景", "no_open_scene", request_id)
		return
	
	# 获取节点
	var node = scene_root.get_node(node_path)
	if not node:
		_send_error_response(peer_id, "找不到节点: %s" % node_path, "node_not_found", request_id)
		return
	
	# 选择节点
	editor_interface.get_selection().clear()
	editor_interface.get_selection().add_node(node)
	
	_send_success_response(peer_id, request_id, "节点选择成功", {
		"node_path": node_path,
		"node_name": node.name,
		"node_type": node.get_class()
	})

func _handle_duplicate_node(peer_id, request_id, params):
	if not params.has("node_path"):
		_send_error_response(peer_id, "缺少必需的参数: node_path", "invalid_params", request_id)
		return
	
	var node_path = params.node_path
	print("复制节点: %s" % node_path)
	
	# 获取当前编辑场景的根节点
	var scene_root = editor_interface.get_edited_scene_root()
	if not scene_root:
		_send_error_response(peer_id, "没有打开的场景", "no_open_scene", request_id)
		return
	
	# 获取节点
	var node = scene_root.get_node(node_path)
	if not node:
		_send_error_response(peer_id, "找不到节点: %s" % node_path, "node_not_found", request_id)
		return
	
	# 复制节点
	var duplicate = node.duplicate()
	node.get_parent().add_child(duplicate)
	duplicate.owner = scene_root
	
	# 选择复制的节点
	editor_interface.get_selection().clear()
	editor_interface.get_selection().add_node(duplicate)
	
	_send_success_response(peer_id, request_id, "节点复制成功", {
		"node_path": duplicate.get_path(),
		"node_name": duplicate.name,
		"node_type": duplicate.get_class()
	})

# 通知命令处理函数
func _handle_notify(peer_id, request_id, params):
	if not params.has("message"):
		_send_error_response(peer_id, "缺少必需的参数: message", "invalid_params", request_id)
		return
	
	var message = params.message
	var level = params.level if params.has("level") else "info"
	
	print("显示通知: %s (级别: %s)" % [message, level])
	
	# 在编辑器中显示通知
	match level:
		"info":
			print("INFO: %s" % message)
			OS.alert(message, "MCP Godot 信息")
		"warning":
			push_warning(message)
			OS.alert(message, "MCP Godot 警告")
		"error":
			push_error(message)
			OS.alert(message, "MCP Godot 错误")
	
	_send_success_response(peer_id, request_id, "通知已显示", {})

# 兼容旧版通知命令
func _handle_notify_message(peer_id, request_id, params):
	if not params.has("message"):
		_send_error_response(peer_id, "缺少必需的参数: message", "invalid_params", request_id)
		return
	
	var message = params.message
	var type = params.type if params.has("type") else "info"
	
	# 转换为新的通知命令
	_handle_notify(peer_id, request_id, {
		"message": message,
		"level": type
	})

# 发送成功响应
func _send_success_response(peer_id, request_id, message, data):
	var response = {
		"success": true,
		"message": message,
		"data": data
	}
	
	if request_id:
		response["id"] = request_id
	
	var json_string = JSON.stringify(response)
	print("发送响应: %s" % json_string)
	peers[peer_id].ws.send_text(json_string)

# 发送错误响应
func _send_error_response(peer_id, message, error_type, request_id = ""):
	var response = {
		"success": false,
		"message": message,
		"error": {
			"code": error_type,
			"message": message
		}
	}
	
	if request_id:
		response["id"] = request_id
	
	var json_string = JSON.stringify(response)
	print("发送错误响应: %s" % json_string)
	peers[peer_id].ws.send_text(json_string)
