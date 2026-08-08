extends Node2D

# Piknik Kahramanları: Zafer
# Harici asset gerektirmeyen, tamamen kodla çizilen mobil 2D platform oyunu.

const VW := 720.0
const VH := 1280.0
const GRAVITY := 1800.0
const LEVEL_COUNT := 5

var screen := "menu"
var level := 1
var world_x := 0.0
var world_width := 5200.0
var player_pos := Vector2(120, 880)
var velocity := Vector2.ZERO
var on_floor := false
var active_character := 0
var lives := 3
var score := 0
var stars := 0
var collected := {}
var message := ""
var message_time := 0.0
var win_time := 0.0
var level_complete := false
var platforms: Array[Rect2] = []
var items: Array[Dictionary] = []
var obstacles: Array[Rect2] = []
var family_offset := [Vector2(-75, 0), Vector2(-35, 0), Vector2(0, 0)]
var touch_left := false
var touch_right := false
var touch_jump := false
var touch_switch := false
var _switch_latch := false

var level_names = ["ORMAN YOLU", "NEHİR KIYISI", "TEPE YOLU", "KAYA GEÇİDİ", "PİKNİK ALANI"]
var character_names = ["KIZ", "ANNE", "BABA"]
var character_speed = [390.0, 310.0, 250.0]
var character_jump = [690.0, 790.0, 620.0]

func _ready() -> void:
    get_viewport().size_changed.connect(queue_redraw)
    _make_touch_ui()
    queue_redraw()

func _process(delta: float) -> void:
    if screen == "game":
        _update_game(delta)
    queue_redraw()

func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed:
            _handle_touch(event.position)
        else:
            touch_left = false
            touch_right = false
            touch_jump = false
            touch_switch = false
    elif event is InputEventMouseButton:
        if event.pressed:
            _handle_touch(event.position)
        else:
            touch_left = false
            touch_right = false
            touch_jump = false
            touch_switch = false

func _handle_touch(p: Vector2) -> void:
    if screen == "menu":
        if Rect2(210, 700, 300, 90).has_point(p):
            _start_level(1)
        elif Rect2(210, 805, 300, 90).has_point(p):
            screen = "levels"
    elif screen == "levels":
        for i in range(5):
            if Rect2(95 + i * 125, 420, 100, 100).has_point(p):
                _start_level(i + 1)
    elif screen == "game":
        if p.y > 1080:
            if p.x < 170: touch_left = true
            elif p.x < 330: touch_right = true
            elif p.x < 500: touch_jump = true
            else: touch_switch = true
    elif screen == "win":
        if Rect2(200, 850, 320, 90).has_point(p):
            _start_level(1)
        elif Rect2(200, 950, 320, 90).has_point(p):
            screen = "menu"

func _unhandled_input(event: InputEvent) -> void:
    if event is InputEventKey and event.pressed and not event.echo:
        if screen == "menu" and event.keycode == KEY_ENTER:
            _start_level(1)
        elif screen == "game" and event.keycode == KEY_ESCAPE:
            screen = "menu"

func _make_touch_ui() -> void:
    # Görsel düğmeler kodla çizildiği için ayrı Control asset'i gerektirmez.
    pass

func _start_level(n: int) -> void:
    level = clamp(n, 1, LEVEL_COUNT)
    screen = "game"
    level_complete = false
    win_time = 0.0
    world_x = 0.0
    player_pos = Vector2(140, 820)
    velocity = Vector2.ZERO
    active_character = 0
    lives = 3
    stars = 0
    score = (level - 1) * 1000
    collected.clear()
    _build_level()
    message = level_names[level - 1]
    message_time = 1.8

func _build_level() -> void:
    platforms.clear()
    items.clear()
    obstacles.clear()

    # zemin ve basamaklar
    platforms.append(Rect2(0, 930, world_width, 350))
    var base_y := [930, 830, 730, 845, 670, 780, 610]
    for i in range(1, 18):
        var x := float(i * 285)
        var y := base_y[i % base_y.size()]
        platforms.append(Rect2(x, y, 235, 35))
        if i % 3 == 0:
            platforms.append(Rect2(x + 70, y - 120, 150, 30))

    # Bölüme göre küçük görsel/oyunsal farklılık
    if level == 2:
        for i in range(4):
            platforms.append(Rect2(850 + i * 520, 760 - (i % 2) * 90, 170, 28))
    elif level == 3:
        for i in range(5):
            obstacles.append(Rect2(950 + i * 620, 885, 70, 45))
    elif level == 4:
        for i in range(6):
            obstacles.append(Rect2(650 + i * 680, 885, 95, 45))
    elif level == 5:
        platforms.append(Rect2(4100, 820, 420, 40))

    for i in range(20):
        var x := 300.0 + i * 235.0
        var y := 760.0 - float((i * 47) % 180)
        items.append({"id": "star_%d" % i, "type": "star", "pos": Vector2(x, y)})
    for i in range(8):
        var x2 := 600.0 + i * 520.0
        items.append({"id": "food_%d" % i, "type": "food", "pos": Vector2(x2, 860.0 - float((i % 3) * 100))})

func _update_game(delta: float) -> void:
    if level_complete:
        win_time += delta
        return

    var left := Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT) or touch_left
    var right := Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT) or touch_right
    var jump := Input.is_key_pressed(KEY_SPACE) or Input.is_key_pressed(KEY_Z) or touch_jump
    var sw := Input.is_key_pressed(KEY_C) or touch_switch

    if sw and not _switch_latch:
        active_character = (active_character + 1) % 3
        message = character_names[active_character]
        message_time = 0.7
    _switch_latch = sw

    var dir := 0.0
    if left: dir -= 1.0
    if right: dir += 1.0

    velocity.x = move_toward(velocity.x, dir * character_speed[active_character], 1800.0 * delta)
    velocity.y += GRAVITY * delta

    if jump and on_floor:
        velocity.y = -character_jump[active_character]
        on_floor = false

    var old_y := player_pos.y
    player_pos += velocity * delta
    on_floor = false

    # platform collision
    for r in platforms:
        if player_pos.x + 24 > r.position.x and player_pos.x - 24 < r.end.x:
            if old_y + 36 <= r.position.y and player_pos.y + 36 >= r.position.y and velocity.y >= 0:
                player_pos.y = r.position.y - 36
                velocity.y = 0
                on_floor = true

    player_pos.x = clamp(player_pos.x, 35.0, world_width - 35.0)
    if player_pos.y > 1200:
        _respawn()

    # obstacles
    for r in obstacles:
        if Rect2(player_pos - Vector2(22, 34), Vector2(44, 68)).intersects(r):
            if active_character == 2:
                r.position.x += 0 # Baba can visually push but collision is still forgiving.
            else:
                _respawn()
                break

    # collect
    for it in items:
        if collected.has(it.id): continue
        if player_pos.distance_to(it.pos) < 58:
            collected[it.id] = true
            if it.type == "star":
                stars += 1
                score += 100
            else:
                score += 150
                lives = min(3, lives + 1)

    # level end
    var goal_x := world_width - 520.0
    if player_pos.x > goal_x and level == LEVEL_COUNT:
        level_complete = true
        screen = "win"
        score += stars * 50
    elif player_pos.x > goal_x:
        _start_level(level + 1)

    world_x = clamp(player_pos.x - 180.0, 0.0, world_width - VW)
    if message_time > 0:
        message_time -= delta

func _respawn() -> void:
    lives -= 1
    if lives <= 0:
        _start_level(level)
    else:
        player_pos = Vector2(max(120.0, world_x + 140.0), 820)
        velocity = Vector2.ZERO
        message = "DİKKAT!"
        message_time = 0.8

func _draw() -> void:
    if screen == "menu":
        _draw_menu()
    elif screen == "levels":
        _draw_levels()
    elif screen == "game":
        _draw_game()
    elif screen == "win":
        _draw_win()

func _draw_menu() -> void:
    draw_rect(Rect2(0,0,VW,VH), Color("#111025"))
    draw_rect(Rect2(0,150,VW,700), Color("#1d264d"))
    _draw_trees(0)
    _draw_family(Vector2(360, 620), 0, true)
    _text("PİKNİK", Vector2(360, 130), 70, Color("#ffd84d"), HORIZONTAL_ALIGNMENT_CENTER, VW)
    _text("KAHRAMANLARI", Vector2(360, 205), 48, Color("#ffffff"), HORIZONTAL_ALIGNMENT_CENTER, VW)
    _text("ZAFER!", Vector2(360, 265), 60, Color("#ff5b5b"), HORIZONTAL_ALIGNMENT_CENTER, VW)
    _button(Rect2(210, 700, 300, 90), "BAŞLA")
    _button(Rect2(210, 805, 300, 90), "BÖLÜMLER")
    _text("Baba • Anne • Kız  |  Ailece piknik macerası", Vector2(360, 1000), 22, Color("#d8d8e8"), HORIZONTAL_ALIGNMENT_CENTER, VW)

func _draw_levels() -> void:
    draw_rect(Rect2(0,0,VW,VH), Color("#111025"))
    _text("BÖLÜM SEÇİMİ", Vector2(360, 170), 52, Color("#ffd84d"), HORIZONTAL_ALIGNMENT_CENTER, VW)
    for i in range(5):
        var r := Rect2(95 + i * 125, 420, 100, 100)
        draw_rect(r, Color("#26345d"))
        draw_rect(r, Color("#ffd84d"), false, 4)
        _text(str(i + 1), r.position + Vector2(0, 18), 48, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER, 100)
        _text(level_names[i], Vector2(r.position.x - 25, 555), 16, Color("#ffffff"), HORIZONTAL_ALIGNMENT_CENTER, 150)
    _text("Her bölümde yıldızları topla ve piknik alanına ulaş.", Vector2(360, 700), 24, Color("#cdd3ef"), HORIZONTAL_ALIGNMENT_CENTER, VW)

func _draw_game() -> void:
    # Sky
    draw_rect(Rect2(0,0,VW,VH), Color("#7cc7ed"))
    draw_rect(Rect2(0,0,VW,250), Color("#b9e6ff"))
    draw_circle(Vector2(610,130), 62, Color("#ffe77a"))
    _draw_trees(-world_x * 0.18)
    # world
    draw_set_transform(Vector2(-world_x, 0))
    for r in platforms:
        draw_rect(r, Color("#5a8a4f"))
        draw_rect(Rect2(r.position.x, r.position.y + 20, r.size.x, r.size.y - 20), Color("#6b4d38"))
        for x in range(int(r.position.x) + 10, int(r.end.x), 28):
            draw_rect(Rect2(x, r.position.y - 5, 18, 6), Color("#7bb35f"))
    for r in obstacles:
        draw_rect(r, Color("#7d6655"))
        draw_rect(Rect2(r.position + Vector2(8,8), r.size - Vector2(16,16)), Color("#5d4a3e"))
    for it in items:
        if collected.has(it.id): continue
        if it.type == "star":
            _draw_star(it.pos, 18, Color("#fff1a3"))
        else:
            draw_circle(it.pos, 18, Color("#e75a4d"))
            draw_circle(it.pos + Vector2(-5,-3), 4, Color("#ffad76"))
    # goal picnic
    var gx := world_width - 430.0
    draw_rect(Rect2(gx, 790, 360, 140), Color("#50734f"))
    draw_line(Vector2(gx+80,820), Vector2(gx+80, 690), Color("#f5f5f5"), 7)
    draw_colored_polygon(PackedVector2Array([Vector2(gx+80,700),Vector2(gx+190,730),Vector2(gx+80,760)]), Color("#e84848"))
    draw_rect(Rect2(gx+125, 850, 150, 55), Color("#8c5d38"))
    _text("PİKNİK!", Vector2(gx+200, 885), 28, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER, 170)
    # family followers
    for i in range(3):
        var p := player_pos + family_offset[i]
        if i != active_character:
            p.y = player_pos.y + sin(Time.get_ticks_msec()/160.0 + i)*3
        _draw_family_member(p, i, i == active_character)
    draw_set_transform(Vector2.ZERO)
    _draw_hud()
    _draw_touch_controls()
    if message_time > 0:
        _text(message, Vector2(360, 360), 42, Color("#fff1a3"), HORIZONTAL_ALIGNMENT_CENTER, VW)

func _draw_win() -> void:
    draw_rect(Rect2(0,0,VW,VH), Color("#111025"))
    draw_rect(Rect2(30,80,660,1050), Color("#f7e8c7"))
    _text("SEVİYE TAMAMLANDI!", Vector2(360, 180), 48, Color("#e24d3b"), HORIZONTAL_ALIGNMENT_CENTER, 620)
    _draw_family(Vector2(360, 500), 0, true)
    _text("AİLECEK PİKNİK ZAFERİ!", Vector2(360, 730), 34, Color("#2d4c35"), HORIZONTAL_ALIGNMENT_CENTER, 620)
    _text("PUAN  %06d    YILDIZ  %02d" % [score, stars], Vector2(360, 790), 26, Color("#493c2f"), HORIZONTAL_ALIGNMENT_CENTER, 620)
    _button(Rect2(200,850,320,90), "YENİDEN BAŞLA")
    _button(Rect2(200,950,320,90), "ANA MENÜ")

func _draw_hud() -> void:
    draw_rect(Rect2(0,0,VW,105), Color("#12111b"))
    _text("PİKNİK KAHRAMANLARI", Vector2(20, 42), 24, Color.WHITE)
    _text("♥".repeat(lives), Vector2(20, 78), 24, Color("#ff4e5d"))
    _text("★ %02d" % stars, Vector2(205, 78), 22, Color("#ffd84d"))
    _text("BÖLÜM %d/5" % level, Vector2(350, 42), 22, Color("#ffd84d"), HORIZONTAL_ALIGNMENT_CENTER, 140)
    _text(character_names[active_character], Vector2(535, 42), 20, Color("#ffffff"), HORIZONTAL_ALIGNMENT_CENTER, 150)
    _text("PUAN %06d" % score, Vector2(535, 78), 20, Color("#ffffff"), HORIZONTAL_ALIGNMENT_CENTER, 150)

func _draw_touch_controls() -> void:
    var y := 1130.0
    _circle_button(Vector2(90,y), "◀")
    _circle_button(Vector2(220,y), "▶")
    _circle_button(Vector2(500,y), "▲")
    _circle_button(Vector2(630,y), "C")

func _circle_button(p: Vector2, label: String) -> void:
    draw_circle(p, 58, Color(0.05,0.06,0.12,0.78))
    draw_circle(p, 58, Color("#d9d9e8"), false, 4)
    _text(label, p + Vector2(0, 15), 34, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER, 70, p.x-35)

func _button(r: Rect2, label: String) -> void:
    draw_rect(r, Color("#2b2555"))
    draw_rect(r, Color("#ffd84d"), false, 4)
    _text(label, r.position + Vector2(0, 57), 28, Color.WHITE, HORIZONTAL_ALIGNMENT_CENTER, r.size.x)

func _draw_trees(offset: float) -> void:
    for i in range(-1, 8):
        var x := float(i * 150) + fmod(offset, 150.0)
        var h := 120.0 + float((i * 31) % 60)
        draw_rect(Rect2(x, 350-h, 28, h), Color("#654735"))
        draw_circle(Vector2(x+14, 330-h), 62, Color("#2d754b"))
        draw_circle(Vector2(x-20, 350-h), 42, Color("#3c8d54"))
        draw_circle(Vector2(x+50, 355-h), 48, Color("#357d4d"))

func _draw_family(pos: Vector2, selected: int, celebratory: bool) -> void:
    for i in range(3):
        _draw_family_member(pos + Vector2((i-1)*105, 0), i, i == selected, celebratory)

func _draw_family_member(pos: Vector2, who: int, selected: bool, celebratory := false) -> void:
    var s := 1.0
    if who == 0: s = 0.86
    elif who == 1: s = 1.02
    else: s = 1.10
    var p := pos
    # shadow
    draw_ellipse(p + Vector2(0, 48*s), Vector2(35*s, 9*s), Color(0,0,0,0.25))
    # legs
    draw_rect(Rect2(p.x-19*s,p.y+18*s,14*s,32*s), Color("#243c69"))
    draw_rect(Rect2(p.x+5*s,p.y+18*s,14*s,32*s), Color("#243c69"))
    # body
    var shirt := [Color("#d7a62d"), Color("#e5e5e5"), Color("#f0f0f0")][who]
    draw_rect(Rect2(p.x-27*s,p.y-20*s,54*s,48*s), shirt)
    # head
    draw_circle(p + Vector2(0,-50*s), 27*s, Color("#f3bd86"))
    # hair
    if who == 0:
        draw_arc(p + Vector2(0,-52*s), 28*s, PI, TAU, 16, Color("#5a2f22"), 12*s)
    elif who == 1:
        draw_arc(p + Vector2(0,-54*s), 29*s, PI, TAU, 16, Color("#3d241e"), 12*s)
        draw_line(p + Vector2(-22,-45)*s, p + Vector2(-34,-28)*s, Color("#3d241e"), 8*s)
        draw_line(p + Vector2(22,-45)*s, p + Vector2(34,-28)*s, Color("#3d241e"), 8*s)
    else:
        draw_arc(p + Vector2(0,-55*s), 29*s, PI, TAU, 16, Color("#2f211d"), 13*s)
    # glasses for parents
    if who > 0:
        draw_circle(p + Vector2(-10,-52)*s, 9*s, Color(0.05,0.05,0.05,0.0))
        draw_arc(p + Vector2(-10,-52)*s, 9*s, 0, TAU, 12, Color("#222222"), 3*s)
        draw_arc(p + Vector2(10,-52)*s, 9*s, 0, TAU, 12, Color("#222222"), 3*s)
        draw_line(p + Vector2(0,-52)*s, p + Vector2(0,-52)*s, Color("#222222"), 3*s)
    # smile
    draw_arc(p + Vector2(0,-44)*s, 8*s, 0.2, 2.9, 8, Color("#7b3b31"), 2*s)
    # selection
    if selected:
        draw_arc(p + Vector2(0,-50)*s, 45*s, 0, TAU, 20, Color("#ffd84d"), 4*s)
    if celebratory:
        draw_line(p+Vector2(-35,-80)*s, p+Vector2(-65,-120)*s, Color("#ffd84d"), 5*s)
        draw_line(p+Vector2(35,-80)*s, p+Vector2(65,-120)*s, Color("#ffd84d"), 5*s)

func draw_ellipse(center: Vector2, radius: Vector2, color: Color) -> void:
    var pts := PackedVector2Array()
    for i in range(24):
        var a := TAU * float(i) / 24.0
        pts.append(center + Vector2(cos(a)*radius.x, sin(a)*radius.y))
    draw_colored_polygon(pts, color)

func _draw_star(p: Vector2, radius: float, color: Color) -> void:
    var pts := PackedVector2Array()
    for i in range(10):
        var a := -PI/2.0 + i * PI/5.0
        var rr := radius if i % 2 == 0 else radius * 0.42
        pts.append(p + Vector2(cos(a), sin(a)) * rr)
    draw_colored_polygon(pts, color)
    draw_polyline(pts + PackedVector2Array([pts[0]]), Color("#b98225"), 3)

func _text(t: String, p: Vector2, size: int, color: Color, align := HORIZONTAL_ALIGNMENT_LEFT, width := -1.0, x_override := -99999.0) -> void:
    var f := ThemeDB.fallback_font
    var pos := p
    var w := width
    if x_override != -99999.0:
        pos.x = x_override
    elif w < 0:
        w = 1000.0
    draw_string(f, pos, t, align, w, size, color)
