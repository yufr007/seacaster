"""Original SeaCaster Blender art kit. X right, Y up, Z toward player in glTF.
No third-party models, images, fonts or downloaded materials. Named pivots are
runtime interfaces. This is reproducible DCC source, not runtime primitives.
"""
import bpy, math, json, random
import numpy as np
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'public/models/sculpted'
OUT.mkdir(parents=True,exist_ok=True)
random.seed(71)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
for block in list(bpy.data.materials):bpy.data.materials.remove(block)
def V(p):return Vector((p[0],-p[2],p[1]))
def lin(c):return c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4
def rgb(h):return tuple(lin(int(h[i:i+2],16)/255) for i in (1,3,5))
def parent(obj,root):
    if root:obj.parent=root
    return obj
def empty(name,at=(0,0,0),root=None):
    o=bpy.data.objects.new(name,None);bpy.context.collection.objects.link(o);o.location=V(at);parent(o,root);return o
def texture(name,kind,base):
    n=512 if kind in ('wood','fish') else 128;y,x=np.mgrid[0:n,0:n]/n
    if kind=='wood':
        flow=x+.025*np.sin(y*13)+.008*np.sin(y*35+x*9)
        grain=np.sin(flow*115+np.sin(y*9)*2);fine=np.sin(flow*370+np.cos(y*26)*2)
        knot=np.exp(-(((x-.3)/.12)**2+((y-.56)/.21)**2))
        variation=.055*grain+.016*fine-.14*knot+.06*np.sin(y*4)
    elif kind=='fish':variation=.05*np.cos(x*28+y*18)+.035*np.cos(x*66)*np.cos(y*55)
    else:variation=.025*np.sin(x*18+y*7)+.018*np.cos(y*30-x*9)
    color=np.array([int(base[i:i+2],16)/255 for i in (1,3,5)])
    pixels=np.empty((n,n,4),np.float32);pixels[:,:,:3]=np.clip(color[None,None,:]+variation[:,:,None],0,1);pixels[:,:,3]=1
    image=bpy.data.images.new(name,width=n,height=n,alpha=True);image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw=str(OUT/(name+'.png'));image.file_format='PNG';image.save();image.pack();return image
def material(name,color,rough=.65,metal=0,paint=None):
    m=bpy.data.materials.new(name);m.use_nodes=True;bs=m.node_tree.nodes.get('Principled BSDF')
    bs.inputs['Base Color'].default_value=(*rgb(color),1);bs.inputs['Roughness'].default_value=rough;bs.inputs['Metallic'].default_value=metal
    if paint:
        node=m.node_tree.nodes.new('ShaderNodeTexImage');node.image=texture(name,paint,color);m.node_tree.links.new(node.outputs['Color'],bs.inputs['Base Color'])
    return m
M={
 'timber':material('Honey_oiled_timber','#C58A4E',.73,paint='wood'),
 'edge':material('Timber_endgrain','#8E512F',.8,paint='wood'),
 'cream':material('Warm_ivory_enamel','#F5E4B8',.34,paint='paint'),
 'teal':material('Lagoon_lacquer','#248D9E',.3,paint='paint'),
 'blue':material('Deep_ocean_enamel','#25546C',.37),
 'coral':material('Coral_red_paint','#DB6851',.45,paint='paint'),
 'gold':material('Brushed_brass','#DBB570',.33,.58),
 'rope':material('Braided_hemp','#D4B87D',.95,paint='wood'),
 'dark':material('Deep_cavity','#223B48',.87),
 'glass':material('Aqua_window_glass','#398DA4',.14,.25),
 'grass':material('Sea_grass','#62AD52',.85,paint='paint'),
 'leaf':material('Palm_leaf_light','#93C65C',.79),
 'leafdark':material('Palm_leaf_shadow','#378955',.84),
 'sand':material('Warm_sandstone','#E6C48A',.96,paint='paint'),
 'rock':material('Smooth_slate','#638D92',.87,paint='paint'),
 'white':material('Sailcloth','#FFEECD',.78),
 'fin':material('Amber_fins','#EC9E45',.44),
 'fish':material('Reef_fish_scales','#E9AC62',.36,paint='fish'),
 'belly':material('Fish_pearl_belly','#FFE6AA',.35),
 'iris':material('Ocean_iris','#197C8D',.19),
 'pupil':material('Eye_pupil','#152A34',.14),
 'highlight':material('Eye_catchlight','#FFFFFF',.12),
 'cushion':material('Mint_canvas','#73C5AF',.86,paint='paint'),
 'cork':material('Rod_cork','#BD986B',.9,paint='wood'),
 'graphite':material('Graphite_blank','#314951',.32,.24),
}
def finish(o,name,mat,root=None,bevel=0,smooth=True):
    o.name=name
    if mat:o.data.materials.append(M[mat] if isinstance(mat,str) else mat)
    if o.type=='MESH':
        for p in o.data.polygons:p.use_smooth=smooth
        if not o.data.uv_layers:
            layer=o.data.uv_layers.new(name='UVMap')
            for p in o.data.polygons:
                normal=p.normal;axis=max(range(3),key=lambda k:abs(normal[k]));axes=[k for k in range(3) if k!=axis]
                for li in p.loop_indices:
                    co=o.data.vertices[o.data.loops[li].vertex_index].co;layer.data[li].uv=(co[axes[0]]*.5,co[axes[1]]*.5)
        if bevel:
            b=o.modifiers.new('Rounded_authored_edges','BEVEL');b.width=bevel;b.segments=3
            if hasattr(b,'affect'):b.affect='EDGES'
            bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=b.name)
            w=o.modifiers.new('Face_weighted_normals','WEIGHTED_NORMAL');w.keep_sharp=True;w.weight=40;bpy.ops.object.modifier_apply(modifier=w.name)
    parent(o,root);return o
def box(name,at,size,mat,root=None,bevel=.05):
    bpy.ops.mesh.primitive_cube_add(size=1,location=V(at));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,root,min(bevel,min(size)*.4))
def ball(name,at,size,mat,root=None,segments=24,rings=16):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=segments,ring_count=rings,radius=1,location=V(at));o=bpy.context.object;o.scale=(size[0],size[2],size[1]);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    return finish(o,name,mat,root)
def tube(name,points,radius,mat,root=None):
    c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=6 if len(points)<9 else 2;c.bevel_depth=radius;c.bevel_resolution=3
    s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
    for p,co in zip(s.bezier_points,points):p.co=V(co);p.handle_left_type='AUTO';p.handle_right_type='AUTO'
    o=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(o);bpy.context.view_layer.objects.active=o;o.select_set(True);bpy.ops.object.convert(target='MESH');o.select_set(False)
    return finish(o,name,mat,root)
def cyl(name,a,b,r1,r2,mat,root=None,verts=24):
    va,vb=V(a),V(b);d=vb-va;bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r1,radius2=r2,depth=d.length,location=(va+vb)*.5)
    o=bpy.context.object;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return finish(o,name,mat,root,min(.025,r1*.12))
def mesh(name,vertices,faces,mat,root=None,uvs=None):
    data=bpy.data.meshes.new(name);data.from_pydata([V(p) for p in vertices],[],faces);data.update();o=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(o)
    if uvs:
        layer=data.uv_layers.new(name='UVMap')
        for p in data.polygons:
            for li in p.loop_indices:layer.data[li].uv=uvs[data.loops[li].vertex_index]
    return finish(o,name,mat,root)
def ring(name,at,r,thick,mat,root=None,axis='y'):
    pts=[]
    for i in range(17):
        a=math.tau*i/16;pts.append((at[0]+math.cos(a)*r,at[1]+(math.sin(a)*r if axis=='z' else 0),at[2]+(math.sin(a)*r if axis=='y' else 0)))
    return tube(name,pts,thick,mat,root)
def coil(root,x,y,z):
    pts=[]
    for i in range(150):
        a=i/149*math.tau*3.4;r=.16+.21*i/149;pts.append((x+math.cos(a)*r,y+.018*math.sin(a),z+math.sin(a)*r))
    tube('Hemp_coil',pts,.033,'rope',root)
def cleat(root,x,y,z):
    box('Cleat_foot',(x,y,z),(.26,.075,.14),'gold',root,.03)
    tube('Cleat_horns',[(x-.25,y+.16,z),(x-.12,y+.18,z),(x,y+.11,z),(x+.12,y+.18,z),(x+.25,y+.16,z)],.038,'gold',root)
def leaf(root,at,length,width,angle,droop,mat='leaf'):
    vertices=[];uv=[]
    for j in range(15):
        t=j/14;w=width*(math.sin(math.pi*t)**.8)
        for side in [-1,0,1]:
            lateral=side*w;forward=t*length
            vertices.append((at[0]+forward*math.cos(angle)-lateral*math.sin(angle),at[1]+.35*math.sin(t*math.pi)-droop*t*t+(1-abs(side))*.07,at[2]+forward*math.sin(angle)+lateral*math.cos(angle)));uv.append((t,(side+1)/2))
    faces=[]
    for j in range(14):
        for k in range(2):a=j*3+k;faces.append((a,a+1,a+4,a+3))
    o=mesh('Sculpted_leaf',vertices,faces,mat,root,uv);solid=o.modifiers.new('Leaf_thickness','SOLIDIFY');solid.thickness=.023
    bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=solid.name);return o
def palm(root,x,y,z,h=3):
    pts=[(x,y,z),(x+.1,y+h*.35,z),(x+.35,y+h*.7,z+.1),(x+.57,y+h,z+.05)];tube('Curved_palm_trunk',pts,.15,'edge',root)
    for j in range(9):
        t=j/9;ring('Trunk_growth_ring',(x+.5*t*t,y+h*t,z+.05*t),.15-.03*t,.017,'timber',root)
    for i in range(8):leaf(root,pts[-1],1.5+(i%3)*.18,.2,math.tau*i/8,.8 if i%2 else .55,'leaf' if i%2 else 'leafdark')
    for dx,dz in [(-.12,0),(.12,.06),(0,-.14)]:ball('Coconut',(pts[-1][0]+dx,pts[-1][1]-.13,pts[-1][2]+dz),(.16,.18,.16),'edge',root,16,10)
def batch(root,exclude=()):
    groups={}
    for o in list(root.children):
        if o.type=='MESH' and o.name not in exclude and not o.data.shape_keys:groups.setdefault(o.active_material.name,[]).append(o)
    for name,objects in groups.items():
        if len(objects)<2:continue
        bpy.ops.object.select_all(action='DESELECT')
        for o in objects:o.select_set(True)
        bpy.context.view_layer.objects.active=objects[0];bpy.ops.object.join();objects[0].name=root.name+'_'+name
    bpy.ops.object.select_all(action='DESELECT')
roots=[]
def asset(name):
    o=empty(name);o['art_version']=3;o['units']='metres';o['source']='Original SeaCaster Blender source';roots.append(o);return o
pier=asset('Pier')
for j in range(12):
    x=-2.2+j*.4;o=box('Oiled_deck_plank',(x,.03,5.9),(.385,.25,4.8),'timber',pier,.045);o.rotation_euler.z=(j%3-1)*.003
    for z in [3.7,7.95]:cyl('Flush_brass_nail',(x,.152,z),(x,.168,z),.022,.022,'gold',pier,12)
box('Deck_front_beam',(0,-.17,3.65),(4.95,.35,.32),'edge',pier,.1)
for x in [-2.45,2.45]:
    for z in [3.65,6.85]:
        cyl('Rounded_pier_pile',(x,-.85,z),(x,.76,z),.20,.17,'edge',pier);box('Post_cap',(x,.84,z),(.49,.15,.49),'timber',pier,.075)
        for y in [.46,.53,.60]:ring('Post_binding',(x,y,z),.188,.031,'rope',pier)
coil(pier,1.4,.2,4.7);cleat(pier,2,.25,4.25)
empty('Pier_BaitSocket',(-1.15,.38,3.5),pier);empty('Pier_RodSocket',(.95,.45,4.3),pier);batch(pier)
def hull(root,yacht=False):
    width=2.1 if not yacht else 2.4;length=6.0 if not yacht else 7.2;verts=[];uv=[];rings=9;segments=48
    for j in range(rings):
        t=j/(rings-1);scale=.50+.50*math.sin(t*math.pi*.5)
        for i in range(segments+1):
            a=math.tau*i/segments;z=5.5+math.cos(a)*length*.5;w=width*(.8+.2*math.sin(a*.5));x=math.sin(a)*w*scale
            verts.append((x,-.82+t*1.12,z));uv.append((i/segments,t))
    faces=[]
    for j in range(rings-1):
        for i in range(segments):a=j*(segments+1)+i;faces.append((a,a+1,a+segments+2,a+segments+1))
    o=mesh('Continuous_curved_hull',verts,faces,'cream' if yacht else 'teal',root,uv);s=o.modifiers.new('Hull_thickness','SOLIDIFY');s.thickness=.10;bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=s.name)
    for yy,rr,mat in [(.28,.105,'cream'),(.07,.043,'gold'),(-.24,.025,'coral' if not yacht else 'blue')]:
        pts=[]
        for i in range(49):
            a=math.tau*i/48;pts.append((math.sin(a)*width*(.8+.2*math.sin(a*.5)),yy,5.5+math.cos(a)*length*.5))
        tube('Rounded_gunwale',pts,rr,mat,root)
    for j in range(15):
        x=(j-7)*.27;half=length*.5*math.sqrt(max(.04,1-(x/(width*.9))**2))*.92;box('Teak_deck',(x,.20,5.5),(.259,.14,half*2),'timber',root,.022)
    for side in [-1,1]:
        for z in [4.25,6.6]:
            ball('Soft_fender',(side*width*.87,-.04,z),(.17,.42,.18),'white',root)
            tube('Fender_rope',[(side*width*.86,.46,z),(side*width*.91,.24,z),(side*width*.88,.04,z)],.022,'rope',root);cleat(root,side*width*.83,.4,z)
    if yacht:
        box('Sculpted_cabin',(1.15,.95,6.8),(1.48,1.55,2.05),'cream',root,.27)
        box('Panoramic_window',(1.13,1.25,5.762),(1.16,.57,.035),'glass',root,.12)
        box('Cabin_roof',(1.12,1.83,6.77),(1.72,.18,2.25),'cream',root,.09)
        for side in [-1,1]:
            tube('Polished_rail',[(side*2.06,.99,4.1),(side*2.2,1.02,5.2),(side*2.09,1.0,6.7)],.032,'gold',root)
            for z in [4.2,5.4,6.6]:cyl('Rail_stanchion',(side*2.1,.36,z),(side*2.1,1,z),.024,.024,'gold',root,12)
        for z in [4.1,4.9]:
            box('Upholstered_seat',(1.27,.5,z),(.86,.30,.74),'cushion',root,.13)
            tube('Cushion_piping',[(.86,.66,z-.29),(1.61,.66,z-.29),(1.61,.66,z+.29),(.86,.66,z+.29),(.86,.66,z-.29)],.013,'white',root)
    else:
        box('Boat_bench',(0,.55,6.2),(3.15,.22,.65),'timber',root,.085)
        box('Tackle_cooler',(1.15,.54,3.95),(.72,.53,.72),'cream',root,.09);box('Cooler_lid',(1.15,.83,3.95),(.79,.12,.79),'coral',root,.05)
        box('Cooler_handle',(1.53,.62,3.95),(.09,.16,.29),'gold',root,.035)
    coil(root,-1.6,.34,4.6)
boat=asset('Skiff');hull(boat);batch(boat)
yacht=asset('Yacht');hull(yacht,True);batch(yacht)
chest=asset('BaitChest')
box('Chest_undertray',(0,-.12,0),(1.05,.46,.73),'edge',chest,.085)
for side in [-1,1]:box('Chest_side',(side*.48,0,0),(.13,.5,.74),'teal',chest,.04)
for z in [-.33,.33]:box('Chest_slats',(0,0,z),(1.06,.49,.1),'teal',chest,.04)
box('Dark_open_tray',(0,.19,0),(.86,.04,.57),'dark',chest,.01)
for x in [-.41,.41]:box('Chest_brass_band',(x,.0,.391),(.07,.45,.026),'gold',chest,.012)
box('Latch',(0,.04,.40),(.14,.21,.048),'gold',chest,.025)
lid=empty('LidPivot',(0,.27,-.34),chest);box('Domed_chest_lid',(0,.045,.34),(1.12,.18,.8),'teal',lid,.08)
for x in [-.4,.4]:box('Lid_brass_band',(x,.145,.34),(.07,.04,.76),'gold',lid,.015)
ball('Fish_emblem',(0,.16,.33),(.16,.015,.08),'gold',lid,16,8);empty('BaitAnchor',(0,.85,.20),chest);batch(chest);batch(lid)
def island(name,lighthouse=False):
    r=asset(name);ball('Sand_foundation',(0,-.13,0),(3.75,.49,2.75),'sand',r);ball('Grassy_crown',(0,.22,-.25),(3.38,.52,2.25),'grass',r)
    for i in range(8):
        a=i*math.tau/8;rock=ball('Weathered_boulder',(math.cos(a)*2.8,.10,math.sin(a)*1.9),(.49+(i%3)*.16,.37+(i%2)*.2,.46),'rock',r,20,12);rock.rotation_euler.z=i*.8
    palm(r,1.4,.6,-.15,3.4);palm(r,-1.7,.45,-.9,2.5)
    for i in range(10):
        a=i*2.4;leaf(r,(math.cos(a)*2.3,.62,math.sin(a)*1.7),.62,.14,a,.3)
    if lighthouse:
        x,z=-.65,.5;cyl('Stone_foot',(x,.45,z),(x,.72,z),.9,.8,'sand',r);cyl('Tower_plaster',(x,.68,z),(x,3.85,z),.64,.46,'cream',r,32)
        for y in [1.4,2.5]:cyl('Coral_tower_band',(x,y,z),(x,y+.38,z),.64-(y-.68)*.057,.62-(y-.68)*.057,'coral',r,32)
        box('Arched_door',(x,.97,z+.60),(.32,.65,.06),'blue',r,.11)
        for y in [2.0,3.05]:box('Window_recess',(x,y,z+.52),(.24,.3,.08),'glass',r,.08)
        cyl('Lantern_balcony',(x,3.8,z),(x,3.99,z),.80,.80,'gold',r,32);cyl('Lantern_glass',(x,4.02,z),(x,4.67,z),.5,.5,'glass',r,24)
        for i in range(8):
            a=i*math.tau/8;cyl('Lantern_mullion',(x+math.cos(a)*.5,4,z+math.sin(a)*.5),(x+math.cos(a)*.5,4.69,z+math.sin(a)*.5),.035,.035,'cream',r,12)
        cyl('Copper_roof',(x,4.67,z),(x,5.23,z),.79,.03,'coral',r,32);ball('Roof_finial',(x,5.27,z),(.09,.12,.09),'gold',r,12,8);empty('LanternSocket',(x,4.3,z),r)
    batch(r);return r
island('Island');island('LighthouseIsland',True)
inlet=asset('InletBanks')
for side in [-1,1]:
    ball('Soft_estuary_bank',(side*6,-.15,-6),(3.7,.7,11),'grass',inlet)
    for i in range(9):
        z=-12+i*2;ball('River_stone',(side*(3.4+(i%3)*.25),.03,z),(.47,.26,.64),'rock',inlet,16,10)
        for j in range(3):leaf(inlet,(side*3.55,.14,z),.62+j*.24,.085,side*.5+j*.6,-.65,'leafdark')
    palm(inlet,side*5,.35,-6,2.6)
for x,z in [(-2,-3),(2.5,-5),(-3,-8)]:
    ball('Lily_pad',(x,.035,z),(.40,.025,.34),'grass',inlet,20,8)
    for i in range(6):leaf(inlet,(x,.055,z),.16,.06,i*math.tau/6,-.08,'white')
batch(inlet)
fish=asset('ReefFish');verts=[];faces=[];uv=[]
for j in range(33):
    t=j/32;x=-.60+t*1.35;width=(math.sin(math.pi*t)**.55)*(.22+.09*t)+.012;height=(math.sin(math.pi*t)**.65)*(.28+.06*t)+.012
    for i in range(25):
        a=i/24*math.tau;verts.append((x,math.sin(a)*height,math.cos(a)*width));uv.append((t,i/24))
for j in range(32):
    for i in range(24):a=j*25+i;faces.append((a,a+25,a+26,a+1))
body=mesh('ReefBody',verts,faces,'fish',fish,uv);body.shape_key_add(name='Basis')
for name,sign in [('SwimLeft',1),('SwimRight',-1)]:
    k=body.shape_key_add(name=name)
    for i,v in enumerate(verts):
        x,y,z=v;tail=max(0,(.4-x)/1.0);k.data[i].co=V((x,y,z+sign*.15*tail*tail))
for frame,left,right in [(1,0,0),(9,1,0),(17,0,0),(25,0,1),(33,0,0)]:
    for key,val in [('SwimLeft',left),('SwimRight',right)]:body.data.shape_keys.key_blocks[key].value=val;body.data.shape_keys.key_blocks[key].keyframe_insert('value',frame=frame)
body.data.shape_keys.animation_data.action.name='ReefFish_Swim'
ball('Pearl_belly',(.17,-.08,0),(.5,.21,.254),'belly',fish)
for sign in [-1,1]:
    ball('Eye_white',(.45,.11,sign*.255),(.155,.165,.095),'white',fish,24,16);ball('Eye_iris',(.48,.12,sign*.322),(.092,.104,.040),'iris',fish,20,12)
    ball('Eye_pupil',(.50,.125,sign*.350),(.046,.064,.021),'pupil',fish,20,12);ball('Eye_glint',(.52,.162,sign*.37),(.027,.03,.012),'highlight',fish,12,8)
    tube('Curved_gill',[(.23,.22,sign*.247),(.16,.05,sign*.29),(.24,-.13,sign*.23)],.017,'fin',fish)
    f=empty('FinLeft' if sign<0 else 'FinRight',(.10,-.05,sign*.23),fish);leaf(f,(0,0,0),.40,.135,math.pi+sign*.6,.20,'fin')
tail=empty('TailPivot',(-.57,0,0),fish)
tv=[(0,0,0),(-.44,.32,.01),(-.36,.12,.035),(-.31,0,.055),(-.36,-.12,.035),(-.44,-.32,.01)]
tm=mesh('Fan_tail',tv,[(0,1,2),(0,2,3),(0,3,4),(0,4,5)],'fin',tail,[(.8,.5),(0,1),(.3,.8),(.4,.5),(.3,.2),(0,0)])
s=tm.modifiers.new('Fin_membrane','SOLIDIFY');s.thickness=.04;bpy.context.view_layer.objects.active=tm;bpy.ops.object.modifier_apply(modifier=s.name)
for frame,a in [(1,0),(9,.28),(17,0),(25,-.28),(33,0)]:tail.rotation_euler.z=a;tail.keyframe_insert('rotation_euler',frame=frame)
tail.animation_data.action.name='ReefFish_Tail';leaf(fish,(-.2,.24,0),.65,.14,0,-.25,'fin');tube('Smile',[(.65,-.075,.14),(.72,-.10,0),(.65,-.075,-.14)],.015,'edge',fish);batch(fish)
rod=asset('Rod');cyl('Cork_grip',(0,-.08,0),(0,.60,0),.083,.064,'cork',rod,24)
for y in [.02,.21,.42,.57]:ring('Grip_wrap',(0,y,0),.078-y*.018,.009,'edge',rod)
cyl('Reel_seat',(0,.60,0),(0,.82,0),.070,.054,'gold',rod,24)
rv=[];rf=[];ru=[]
for j in range(49):
    y=.73+(3.55-.73)*j/48;r=.045*(1-j/48)+.009*j/48
    for i in range(17):a=i*math.tau/16;rv.append((math.cos(a)*r,y,math.sin(a)*r));ru.append((i/16,j/48))
for j in range(48):
    for i in range(16):a=j*17+i;rf.append((a,a+17,a+18,a+1))
mesh('RodBlank',rv,rf,'graphite',rod,ru);empty('RodTip',(0,3.55,0),rod)
cyl('Reel_spool',(.065,.45,.04),(.28,.45,.04),.155,.155,'teal',rod,32)
for x in [.08,.25]:cyl('Spool_rim',(x,.45,.04),(x+.018,.45,.04),.174,.174,'gold',rod,32)
crank=empty('ReelCrank',(.30,.45,.04),rod);tube('Crank_arm',[(0,0,0),(0,.10,.04),(.035,.24,.07)],.025,'gold',crank);cyl('Crank_knob',(.01,.24,.07),(.15,.24,.07),.045,.045,'cork',crank,20);batch(rod,('RodBlank',));batch(crank)
bobber=asset('Bobber');ball('Ivory_float',(0,.045,0),(.14,.17,.14),'cream',bobber);ball('Coral_cap',(0,.125,0),(.134,.10,.134),'coral',bobber)
cyl('Float_stem',(0,.17,0),(0,.45,0),.022,.016,'coral',bobber,16);ring('Waterline_ring',(0,.04,0),.142,.012,'gold',bobber);batch(bobber)
gull=asset('Gull');ball('Gull_body',(0,0,0),(.46,.155,.17),'white',gull,24,14);ball('Gull_head',(.32,.10,0),(.18,.15,.14),'white',gull,20,12);cyl('Gull_beak',(.43,.08,0),(.64,.03,0),.065,.012,'gold',gull,16)
for side in [-1,1]:
    ball('Gull_eye',(.39,.14,side*.11),(.022,.025,.018),'pupil',gull,12,8);wing=empty('WingLeft' if side<0 else 'WingRight',(-.07,.03,side*.09),gull)
    for j in range(4):leaf(wing,(-.03*j,0,side*.12*j),.85-j*.08,.13,side*math.pi/2+.14,-.03,'white')
    batch(wing)
batch(gull)
bpy.context.scene.frame_set(1)
for r in roots:r['interface']='Named pivot; clone root, reuse materials; do not normalize scale in runtime'
bpy.ops.wm.save_as_mainfile(filepath='/tmp/seacaster-art-source.blend')
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.context.scene.objects:o.select_set(True)
bpy.context.scene.render.fps=24
bpy.ops.export_scene.gltf(filepath=str(OUT/'harbour-kit.glb'),export_format='GLB',export_yup=True,export_apply=False,export_extras=True,export_animations=True,export_frame_range=False,export_force_sampling=True,export_nla_strips=True,export_materials='EXPORT',export_image_format='AUTO')
report={'version':3,'source':'tools/art/build.py','authoring':'Original scripted Blender models and procedural paint textures; no purchased or AI-generated art.','roots':[r.name for r in roots],'units':'metres','up':'+Y','forward':'-Z for environment; +X for fish','runtime':'harbour-kit.glb','review':'Candidate asset set; artistic approval and physical-device profiling are separate gates.'}
(OUT/'manifest.json').write_text(json.dumps(report,indent=2)+'\n')
for temporary in OUT.glob('*.png'):temporary.unlink()
print('SEACASTER_ART_EXPORT_COMPLETE',(OUT/'harbour-kit.glb').stat().st_size)
