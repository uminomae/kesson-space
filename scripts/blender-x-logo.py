import bpy
import math

# ======= パラメータ設定 =======
LOGO_SCALE    = 1.0       # 全体のサイズ
THICKNESS     = 0.2       # 厚み
SOLID_WIDTH   = 0.45      # 実線（右上がり）の太さ
HOLLOW_WIDTH  = 0.42      # 中抜き線（左上がり）の外幅
HOLLOW_GAP    = 0.18      # 中抜きの隙間の幅（くり抜く幅）
BEVEL_AMT     = 0.01      # ベベル（面取り）量
ROTATION_X    = 90.0      # X軸回転（立たせる）

# ロゴの角度と、切り出す高さ
BAR_ANGLE     = 32.0      # 棒の傾き角度
CUT_HEIGHT    = 1.35      # 上下の水平カット位置（Y軸方向）
# ============================

def cleanup(name_prefix="X_Logo"):
    for obj in bpy.data.objects:
        if obj.name.startswith(name_prefix):
            bpy.data.objects.remove(obj, do_unlink=True)
    for mesh in bpy.data.meshes:
        if mesh.name.startswith(name_prefix):
            bpy.data.meshes.remove(mesh, do_unlink=True)

def create_solid_bar(name):
    bpy.ops.mesh.primitive_cube_add(size=1)
    obj = bpy.context.active_object
    obj.name = name
    length = CUT_HEIGHT * 4.0
    obj.scale = (SOLID_WIDTH, length, THICKNESS)
    obj.rotation_euler = (0, 0, math.radians(BAR_ANGLE))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    return obj

def create_hollow_bar_closed(name):
    length = CUT_HEIGHT * 4.0

    bpy.ops.mesh.primitive_cube_add(size=1)
    outer_bar = bpy.context.active_object
    outer_bar.name = name + "_Outer"
    outer_bar.scale = (HOLLOW_WIDTH, length, THICKNESS)

    bpy.ops.mesh.primitive_cube_add(size=1)
    inner_cutter = bpy.context.active_object
    inner_cutter.name = name + "_InnerCutter"
    inner_cutter.scale = (HOLLOW_GAP, length * 1.01, THICKNESS * 1.01)

    bpy.context.view_layer.objects.active = outer_bar
    bool_mod = outer_bar.modifiers.new(name="Hollow_Cut", type='BOOLEAN')
    bool_mod.operation = 'DIFFERENCE'
    bool_mod.object = inner_cutter
    bool_mod.solver = 'EXACT'
    bpy.ops.object.modifier_apply(modifier=bool_mod.name)

    bpy.data.objects.remove(inner_cutter, do_unlink=True)

    obj = outer_bar
    obj.name = name

    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.rotation_euler = (0, 0, math.radians(-BAR_ANGLE))
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

    return obj

def apply_horizontal_cut(target_obj, cut_pos):
    cutter_size = (CUT_HEIGHT*5, CUT_HEIGHT*5, CUT_HEIGHT*5)

    bpy.ops.mesh.primitive_cube_add(size=1)
    cutter_top = bpy.context.active_object
    cutter_top.scale = cutter_size
    cutter_top.location.y = cut_pos + cutter_size[1] / 2

    bpy.ops.mesh.primitive_cube_add(size=1)
    cutter_bottom = bpy.context.active_object
    cutter_bottom.scale = cutter_size
    cutter_bottom.location.y = -cut_pos - cutter_size[1] / 2

    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = target_obj

    for cutter in [cutter_top, cutter_bottom]:
        bool_mod = target_obj.modifiers.new(name="Horizontal_Cut", type='BOOLEAN')
        bool_mod.operation = 'DIFFERENCE'
        bool_mod.object = cutter
        bool_mod.solver = 'EXACT'
        bpy.ops.object.modifier_apply(modifier=bool_mod.name)
        bpy.data.objects.remove(cutter, do_unlink=True)

def setup_material(obj):
    mat_name = "X_Black_Mat_Closed"
    mat = bpy.data.materials.get(mat_name)
    if not mat:
        mat = bpy.data.materials.new(mat_name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        if bsdf:
            bsdf.inputs["Base Color"].default_value = (0.01, 0.01, 0.01, 1.0)
            bsdf.inputs["Metallic"].default_value = 0.9
            bsdf.inputs["Roughness"].default_value = 0.25
            if "Specular IOR Level" in bsdf.inputs:
                bsdf.inputs["Specular IOR Level"].default_value = 0.5
            elif "Specular" in bsdf.inputs:
                bsdf.inputs["Specular"].default_value = 0.5
    if obj.data.materials:
        obj.data.materials[0] = mat
    else:
        obj.data.materials.append(mat)

def add_modifiers(obj):
    bevel = obj.modifiers.new(name="Bevel", type='BEVEL')
    bevel.width = BEVEL_AMT
    bevel.segments = 3
    bevel.limit_method = 'ANGLE'
    bevel.angle_limit = math.radians(30)

    if bpy.app.version >= (4, 1, 0):
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(30))
    else:
        bpy.ops.object.shade_smooth()
        obj.data.use_auto_smooth = True
        obj.data.auto_smooth_angle = math.radians(30)

# ============================
# 実行
# ============================
cleanup()

solid_part = create_solid_bar("X_Solid")
hollow_part_closed = create_hollow_bar_closed("X_Hollow_Closed")

bpy.ops.object.select_all(action='DESELECT')
solid_part.select_set(True)
hollow_part_closed.select_set(True)
bpy.context.view_layer.objects.active = solid_part
bpy.ops.object.join()
final_obj = bpy.context.active_object
final_obj.name = "X_Logo_Closed_Final"

apply_horizontal_cut(final_obj, CUT_HEIGHT)

final_obj.scale = (LOGO_SCALE, LOGO_SCALE, LOGO_SCALE)
setup_material(final_obj)
add_modifiers(final_obj)

final_obj.rotation_euler = (math.radians(ROTATION_X), 0, 0)

print("Closed-End X Logo Created Successfully.")
