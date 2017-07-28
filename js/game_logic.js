var game_system = {
    canvas: document.createElement('canvas'),
    highscore: 0,
    score: 0,
    gravity: 0.48,
    game_speed: 6,
    scenario_mode: false,
    battle_mode: false,
    level: 1,
    battle: 1,
    pause: false,
    map: [
         [[1,2],[1,2],[1,3],[1,2,3],[1,2],[1],[-1],[1,2],[1,2]],
         [[1,2],[1,2],[1,3],[2],[1,3],[2],[1,3],[-1],[1],[1,2],[1,2]],
         [[1,2],[1,2],[1,3],[2],[1,3],[-1],[1],[1,2]],
         [[1,2],[1,2],[1,2],[-1],[1,2,3],[1,2,3],[1,2],[-1],[2],[1,2],[1,2]],
         [[1,2],[1,2],[1,3],[3],[1,3],[1,3],[1,3],[1,3],[2,3],[2,3],[1,2],[1,2]]
    ],
    exist_terrain: [],
    terrain_index: 0,
    terrain_chosen: 0,

    fire: [],
    props: [],
    light: [],
    bullet_list: [],
    danmanku_list: [],
    enemy: undefined,
    my_hero: undefined,

    system_configure: function() {
        document.body.insertBefore(game_system.canvas, document.body.childNodes[0]);
        game_system.canvas.width = 1024;
        game_system.canvas.height = 768;
        game_system.canvas.x = game_system.canvas.offsetLeft;
        game_system.canvas.y = game_system.canvas.offsetTop;
        game_system.bg_music = new music('music/title.mp3');
        game_system.bg_music.play();
        game_system.context = game_system.canvas.getContext('2d');
        
        window.addEventListener('keydown', function(e) {
            game_system.key = e.keyCode;
            console.info(game_system.key);
            if (game_system.key == 38) {
                if (game_system.my_hero.collision_detection() === undefined && game_system.my_hero.jump_time == 0) {
                    game_system.my_hero.jump_time = 1;
                } // the hero can only jump for once if he is already in the sky
                if (game_system.my_hero.jump_time == 0) {
                    game_system.my_hero.speed = -15;
                    game_system.my_hero.y += game_system.my_hero.speed;
                    game_system.my_hero.jump_time += 1;
                    game_system.my_hero.position_update();
                }
                else if (game_system.my_hero.jump_time == 1) {
                    game_system.my_hero.speed = -12.5;
                    game_system.my_hero.y += game_system.my_hero.speed;
                    game_system.my_hero.jump_time += 1;
                    game_system.my_hero.position_update();
                }
            } // jump up
            else if (game_system.key == 40) {
                if (game_system.my_hero.collision_detection() === undefined) {
                    return;
                } // the hero cannot jump down when in the sky
                var exist_terrain_below = false;
                for (var i of game_system.exist_terrain) {
                    if (i.top > game_system.my_hero.bottom && i.top < game_system.canvas.height) {
                        if (game_system.my_hero.right + 160 > i.left && game_system.my_hero.right + 160 < i.right) {
                            exist_terrain_below = true;
                            break;
                        }
                    }
                }
                if (exist_terrain_below === true) {
                    game_system.my_hero.jump_time = 2;
                    game_system.my_hero.y += 41.1;
                    game_system.my_hero.position_update();
                } // the hero can only jump down when there is a floor below
            } // jump down
            else if (game_system.key == 13) {
                if (scenario_system.in_handle) {
                    return;
                }
                scenario_system.read_command();
            }
            else if(game_system.key == 90){
                if(game_system.my_hero != undefined){
                    if(game_system.my_hero.energy > 0 && game_system.my_hero.abletoshoot){
                        game_system.my_hero.abletoshoot = false;
                        setTimeout(function(){game_system.my_hero.abletoshoot = true;},100);
                        for(var i of game_system.bullet_list){
                            if(i.disable){
                                i.x = game_system.my_hero.x + game_system.my_hero.width;
                                i.y = game_system.my_hero.y + 40;
                                i.sound.play();
                                game_system.my_hero.energy -= 1;
                                i.disable = false;
                                break;
                            }
                        }
                    }
                }
            }
            else if(game_system.key == 88){
                if(game_system.my_hero.rush == false && game_system.my_hero.energy >= 50){
                    game_system.my_hero.rush = true;
                    setTimeout(function(){game_system.my_hero.rush = false;},300);
                    game_system.my_hero.energy -= 50;
                }
            }
        })

        window.addEventListener('mousedown', function(e) {
            if (scenario_system.in_handle) {
                return;
            }
            if (e.pageX >= game_system.canvas.x && e.pageX <= game_system.canvas.x + game_system.canvas.width) {
                if (e.pageY >= game_system.canvas.y && e.pageY <= game_system.canvas.y + game_system.canvas.height) {
                    scenario_system.read_command();
                }
            }
        })
    },

    start: function() {
        for(var i = 0 ; i < 5 ; i ++){
            var temp = new bullet();
            game_system.bullet_list.push(temp);
        }
        for(var i = 0 ;i < 200 ; i ++){
            var temp = new danmanku();
            game_system.danmanku_list.push(temp);
        }
        if (!game_system.scenario_mode) {
            game_system.fire_interval = setInterval(game_system.produce_fire, 2500);
            game_system.danmanku_interval = setInterval(game_system.produce_danmanku,3000);
            game_system.props_interval = setInterval(game_system.produce_props, 3000);
            game_system.light_interval = setInterval(game_system.produce_light, 20000);
        }
        else {
            scenario_system.hard_set(game_system.level, game_system.battle);
        }
        
        game_system.battle_mode = true;
        document.getElementById('pause').style.display = 'block';
    },

    animation: function() {
        for (var i of game_system.fire) {
            i.animation();
        }
        for (var i of game_system.props) {
            i.animation();
        }
        if (game_system.enemy != undefined) {
            game_system.enemy.animation();
        }
    },

    hero_animation: function() {
        game_system.my_hero.animation();
    },

    update: function() {
        if(game_system.pause == true){
            return;
        }
        var last_terrain = game_system.exist_terrain[game_system.exist_terrain.length-1];
        if (last_terrain.right <= game_system.canvas.width + 4) {
            if (!game_system.battle_mode) {
                game_system.exist_terrain.push(new terrain(1));
            }
            else {
                if (game_system.terrain_index == 0) {
                    game_system.terrain_chosen = Math.floor(Math.random() * game_system.map.length);
                }
                var next_terrain = game_system.map[game_system.terrain_chosen][game_system.terrain_index++];
                if (game_system.terrain_index == game_system.map[game_system.terrain_chosen].length) {
                    game_system.terrain_index = 0;
                }
                for (var i of next_terrain) {
                    game_system.exist_terrain.push(new terrain(i));
                }
            }
        } // add terrain when the last terrain is in the canvas completely
        
        game_system.clear();
        if (game_system.enemy != undefined) {
            game_system.enemy.update();
        }
        for (var i of game_system.exist_terrain) {
            i.update();
        }
        for (var i of game_system.danmanku_list){
            i.update();
        }
        for (var i of game_system.bullet_list){
            i.update();
        }
        game_system.my_hero.update();
        for (var i of game_system.fire) {
            i.update();
        }
        for (var i of game_system.props) {
            i.update();
        }
        for (var i of game_system.light) {
            i.update();
        }

        if (game_system.battle_mode && !game_system.scenario_mode) {
            game_system.score += 1;
        }
        if (game_system.score > game_system.highscore) {
            game_system.highscore = game_system.score;
        }
        document.getElementById('score').innerHTML = "Score: " + game_system.score.toString();
        document.getElementById('highscore').innerHTML = "High Score: " + game_system.highscore.toString();
    },


    produce_danmanku: function(danmankulevel){
        if(game_system.pause == false){
            if(game_system.enemy != undefined){           
                var count = 0;
                var angle = 0;
                for(var j of game_system.danmanku_list){
                    if(j.disable == true){
                        j.disable = false;
                        var enemy_center_x = game_system.enemy.x + game_system.enemy.width / 2;
                        var enemy_center_y = game_system.enemy.y + game_system.enemy.height / 2;
                        j.x = enemy_center_x;
                        j.y = enemy_center_y;
                        j.angle = angle;
                        angle += Math.PI / 13;
                        count += 1;
                        if(count == 25){
                            break;
                        }
                    }
                }
            }
        }
    },

    produce_fire: function() {
        if(game_system.pause == false){
            var n = Math.floor(Math.random() * 6) + 2;
            game_system.fire.push(new fire(n));
        }
    },

    produce_props: function() {
        if(game_system.pause == false){
            if (game_system.terrain_index == 0) {
                return;
            }

            // the props can only be produced near the terrain
            var previous_terrain = game_system.map[game_system.terrain_chosen][game_system.terrain_index - 1];
            var n = Math.floor(Math.random() * previous_terrain.length);
            if (previous_terrain[n] > 0) {
                game_system.props.push(new props(previous_terrain[n]));
            }
        }
    },

    produce_light: function() {
        if(game_system.pause == false){
            var n = Math.floor(Math.random() * 3) + 1;
            game_system.light.push(new light(n));
        }
    },

    produce_enemy: function() {
        if(game_system.pause == false){
            var rank = Math.floor(Math.random() * 5) + 1;
            game_system.enemy = new enemy(rank);
        }
    },

    clear: function() {
        game_system.context.clearRect(0, 0, game_system.canvas.width, game_system.canvas.height);
    },

    stop: function() {
        clearInterval(game_system.interval);
        game_system.interval = undefined;
        clearTimeout(game_system.new_enemy);
        game_system.new_enemy = undefined;
        clearInterval(game_system.fire_interval);
        clearInterval(game_system.danmanku_interval);
        clearInterval(game_system.danmanku_interval1);
        clearInterval(game_system.danmanku_interval2);
        clearInterval(game_system.props_interval);
        clearInterval(game_system.light_interval);
        clearInterval(game_system.hero_animation_interval);
        clearInterval(game_system.animation_interval);
        game_system.hero_animation_interval = game_system.animation_interval = undefined;
        clearTimeout(game_system.enemy_interval);
        game_system.bg_music.stop();
    },

    end: function() {
        game_system.stop();
        game_system.bg_music = new music('music/end.mp3');
        game_system.bg_music.play();
        localStorage.setItem('highscore', game_system.highscore);
        document.getElementById('restart').style.display = 'block';
        document.getElementById('return').style.display = 'block';
        document.getElementById('pause').style.display = 'none';
        for (var i of game_system.exist_terrain) {
            delete i;
        }
        game_system.exist_terrain = [];
        for (var i of game_system.fire) {
            delete i;
        }
        game_system.fire = [];
        for (var i of game_system.props) {
            delete i;
        }
        game_system.props = [];
        for (var i of game_system.light) {
            delete i;
        }
        delete game_system.enemy;
        game_system.enemy = undefined;
        game_system.light = [];
        game_system.bullet_list = [];
        game_system.danmanku_list = [];
        game_system.game_speed = 6;
        game_system.terrain_index = 0;
        game_system.terrain_chosen = 0;
        game_system.battle = 1;
    }
}

var scenario_system = {
    command_index: 0,
    command: [],
    before_battle: false,
    timer: undefined,
    opacity: 1,
    text: '',
    in_handle: false,
    character: '',
    x: 0,
    current_x: 0,
    character_img: undefined,
    dialogue: undefined,

    read_command: function() {
        if (!scenario_system.before_battle) {
            return;
        }
        var command_piece = scenario_system.command[scenario_system.command_index++];
        if (command_piece.indexOf('[return]') != -1) {
            game_system.stop();
            return_title();
            return;
        }
        scenario_system.handle_command(command_piece);
        if (scenario_system.command_index == scenario_system.command.length) {
            scenario_system.command = [];
            scenario_system.before_battle = false;
            battle_interface();
        }
    },

    handle_command: function(cmd) {
        scenario_system.in_handle = true;
        if (cmd.indexOf('[show_bg]') != -1) {
            game_system.clear();
            var src = cmd.split(' ')[1];
            game_system.canvas.style.background = "url(" + src + ")";
            scenario_system.timer = setInterval(scenario_system.image_shower, 10);
        }
        else if (cmd.indexOf('[convert_bg]') != -1) {
            game_system.clear();
            var src = cmd.split(' ')[1];
            var origin_src = game_system.canvas.style.background.split('("')[1].split('")')[0];
            document.getElementById('bg_img').src = origin_src;
            document.getElementById('bg_img').style.opacity = 1;
            game_system.canvas.style.background = "url(" + src + ")";
            scenario_system.timer = setInterval(scenario_system.image_shower, 25);
        }
        else if (cmd.indexOf('[center]') != -1) {
            scenario_system.text = cmd.split(' ')[1];
            scenario_system.timer = setInterval(scenario_system.text_shower, 50);
        }
        else if (cmd.indexOf('[stop_bgm]') != -1) {
            game_system.bg_music.stop();
            scenario_system.in_handle = false;
            scenario_system.read_command();
        }
        else if (cmd.indexOf('[l_character]') != -1) {
            scenario_system.character = cmd.split(' ')[1];
            scenario_system.character_img = new Image();
            scenario_system.character_img.src = scenario_system.character;
            scenario_system.character_img.width = 220;
            scenario_system.character_img.height = 400;
            scenario_system.x = 75;
            scenario_system.current_x = -scenario_system.character_img.width;
            scenario_system.timer = setInterval(scenario_system.l_character_shower, 10);
        }
        else if (cmd.indexOf('[r_character]') != -1) {
            scenario_system.character = cmd.split(' ')[1];
            scenario_system.character_img = new Image();
            scenario_system.character_img.src = scenario_system.character;
            scenario_system.character_img.width = 177;
            scenario_system.character_img.height = 360;
            scenario_system.x = 700;
            scenario_system.current_x = game_system.canvas.width;
            scenario_system.timer = setInterval(scenario_system.r_character_shower, 10);
        }
        else if (cmd.indexOf('[l_dialogue]') != -1) {
            scenario_system.dialogue = new Image();
            scenario_system.dialogue.src = 'image/l_dialogue.png';
            scenario_system.dialogue.width = 400;
            scenario_system.dialogue.height = 129; 
            scenario_system.text = cmd.split(' ')[1];
            scenario_system.x = 355;
            scenario_system.timer = setInterval(scenario_system.dialogue_drawer, 20);
        }
        else if (cmd.indexOf('[r_dialogue]') != -1) {
            scenario_system.dialogue = new Image();
            scenario_system.dialogue.src = 'image/r_dialogue.png';
            scenario_system.dialogue.width = 400;
            scenario_system.dialogue.height = 129; 
            scenario_system.text = cmd.split(' ')[1];
            scenario_system.x = 330;
            scenario_system.timer = setInterval(scenario_system.dialogue_drawer, 20);
        }
        else if (cmd.indexOf('[play_sound]') != -1) {
            var src = cmd.split(' ')[1];
            scenario_system.sound = new sound(src);
            scenario_system.sound.play();
            scenario_system.in_handle = false;
            scenario_system.read_command();
        }
        else if (cmd.indexOf('[play_bgm]') != -1) {
            var src = cmd.split(' ')[1];
            game_system.bg_music.stop();
            game_system.bg_music = new music(src);
            game_system.bg_music.play();
            scenario_system.in_handle = false;
            scenario_system.read_command();
        }
        else if (cmd.indexOf('[return]') != -1) {
            return_title();
        }
    },

    scenario: function(level, battle) {
        if (level == 1) {
            switch(battle) {
                case 1:
                    game_system.enemy = new enemy(1);
                    break;
                case 2:
                    game_system.enemy = new enemy(1);
                    break;
                case 3:
                    game_system.enemy = new enemy(2);
                    break;
            }
        }
        else if (level == 2) {
            switch(battle) {
                case 1:
                    game_system.enemy = new enemy(1);
                    // to do
                    break;
                case 2:
                    game_system.enemy = new enemy(2);
                    break;
            }
        }
        else if (level == 3) {
            game_system.enemy = new enemy(3);
        }
        else if (level == 4) {
            switch(battle) {
                case 1:
                    game_system.enemy = new enemy(2);
                    break;
                case 2:
                    game_system.enemy = new enemy(3);
            }
        }
        else if (level == 5) {
            game_system.enemy = new enemy(4);
        }
        else if (level == 6) {
            game_system.enemy = new enemy(5);
        }
        else {
            game_system.enemy = new enemy(6);
        }
    },

    hard_set: function(level, battle) {
        game_system.props_interval = setInterval(game_system.produce_props, 3000);
        if (level == 1) {
            switch(battle) {
                case 1:
                    break;
                case 2:
                    game_system.fire_interval = setInterval(game_system.produce_fire, 5000);
                    break;
                case 3:
                    game_system.fire_interval = setInterval(game_system.produce_fire, 4000);
                    break;
            }
        }
        else if (level == 2) {
            switch(battle) {
                case 1:
                    game_system.fire_interval = setInterval(game_system.produce_fire, 3000);
                    break;
                case 2:
                    game_system.fire_interval = setInterval(game_system.produce_fire, 3000);
                    break;
            }
        }
        else if (level == 3) {
            game_system.light_interval = setInterval(game_system.produce_light, 5000);
        }
        else if (level == 4) {
            switch(battle) {
                case 1:
                    game_system.fire_interval = setInterval(game_system.produce_fire, 2500);
                    break;
                case 2:
                    game_system.fire_interval = setInterval(game_system.produce_light, 5000);
                    break;
            }
        }
        else if (level == 5) {
            game_system.fire_interval = setInterval(game_system.produce_fire, 1500);
        }
        else if (level == 6) {
            game_system.fire_interval = setInterval(game_system.produce_fire, 2500);
            game_system.light_interval = setInterval(game_system.produce_light, 9000);
        }
        else {
            game_system.danmanku_interval = setInterval(game_system.produce_danmanku,5000);
            game_system.fire_interval = setInterval(game_system.produce_fire, 2000);
            game_system.light_interval = setInterval(game_system.produce_light, 7000);
        }
    },

    image_shower: function() {
        if (scenario_system.opacity > 0) {
            scenario_system.opacity -= 0.05;
            document.getElementById('bg_img').style.opacity = scenario_system.opacity;
        }
        else {
            scenario_system.opacity = 1;
            clearInterval(scenario_system.timer);
            scenario_system.in_handle = false;
            scenario_system.read_command();
        }
    },

    dialogue_drawer: function() {
        if (scenario_system.opacity > 0) {
            scenario_system.opacity -= 0.1;
            game_system.context.clearRect(300, 450, 400, game_system.canvas.height - 450);
            ctx = game_system.context;
            ctx.globalAlpha = 1 - scenario_system.opacity;
            ctx.drawImage(scenario_system.dialogue, 300, 450, scenario_system.dialogue.width, scenario_system.dialogue.height);
        }
        else {
            scenario_system.opacity = 1;
            ctx = game_system.context;
            ctx.font = '10px 微软雅黑';
            ctx.fillStyle = 'black';
            ctx.textAlign = 'left';
            ctx.fillText(scenario_system.text, scenario_system.x, 490);
            scenario_system.in_handle = false;
            clearInterval(scenario_system.timer);
        }
    },

    text_shower: function() {
         if (scenario_system.opacity > 0) {
            scenario_system.opacity -= 0.05;
            ctx = game_system.context;
            game_system.clear();
            ctx.fillStyle = 'white';
            ctx.font = "25px 楷体";
            ctx.textAlign = "center";
            ctx.globalAlpha = 1 - scenario_system.opacity;
            ctx.fillText(scenario_system.text, game_system.canvas.width/2, game_system.canvas.height/2);
        }
        else {
            scenario_system.opacity = 1;
            clearInterval(scenario_system.timer);
            scenario_system.in_handle = false;
        }
    },

    l_character_shower: function() {
        if (scenario_system.current_x < scenario_system.x) {
            scenario_system.current_x += 5;
            ctx = game_system.context;
            var width = scenario_system.x + scenario_system.character_img.width;
            var height = scenario_system.character_img.height;
            game_system.context.clearRect(0, game_system.canvas.height - scenario_system.character_img.height, width, height);
            ctx.drawImage(scenario_system.character_img, scenario_system.current_x, game_system.canvas.height - scenario_system.character_img.height);
        }
        else {
            clearInterval(scenario_system.timer);
            scenario_system.in_handle = false;
            scenario_system.read_command();
        }
    },

    r_character_shower: function() {
        if (scenario_system.current_x > scenario_system.x) {
            scenario_system.current_x -= 5;
            ctx = game_system.context;
            var width = game_system.canvas.width - scenario_system.x;
            var height = scenario_system.character_img.height;
            game_system.context.clearRect(scenario_system.x, game_system.canvas.height - scenario_system.character_img.height, width, height);
            ctx.drawImage(scenario_system.character_img, scenario_system.current_x, game_system.canvas.height - scenario_system.character_img.height);
        }
        else {
            clearInterval(scenario_system.timer);
            scenario_system.in_handle = false;
            scenario_system.read_command();
        }
    }
}

function bullet(){
    this.width = 41;
    this.height = 17;
    this.x = -100;
    this.y = -100;
    this.left = this.x;
    this.right = this.x + this.width;
    this.speed =20;
    this.attack = 1;
    this.disable = true;
    this.image = new Image();
    this.image.src = 'image/bl.png';
    this.sound = new sound('sound/bullet.mp3');
    this.update = function(){
        this.position_update();
        this.collision_detection();
        ctx = game_system.context;
        ctx.drawImage(this.image,this.x,this.y,this.width,this.height);
    }
    this.position_update = function(){
        if(this.disable == false){
            this.x += this.speed;
            this.left = this.x;
            this.right = this.x + this.width;
            if(this.right > 1024 + this.width){
                this.disable = true;
            }
        }
    }
    this.collision_detection = function(){
        if(game_system.enemy != undefined && this.disable == false){
            if(this.x > game_system.enemy.x + game_system.enemy.width / 2){
                game_system.enemy.HP -= this.attack;
                this.x = -100;
                this.y = -100;
                this.disable = true;
            }
        }
    }
}

function hero() {
    this.width = 125;
    this.height = 153;
    this.constx = 60;
    this.x = 60;
    this.y = game_system.canvas.height - 133 - this.height;
    this.speed = 0;
    this.jump_time = 0;
    this.energy = 0;
    this.rush = false;
    this.attack_power = 100;
    this.left = this.x + 50;
    this.right = this.x + this.width - 30;
    this.top = this.y + 20;
    this.bottom = this.y + this.height;
    this.hp = 100;
    this.abletoshoot = true;
    this.danmanku_x = this.x + this.width/2;
    this.danmanku_y = this.y + this.height/2;
    this.danmanku_width = 16;
    this.danmanku_height = 16;
    this.danmanku_image = new Image();
    this.danmanku_image.src = 'image/dm.png';
    this.img_index = 1;
    this.image_list = [];
    for (var i = 1; i < 13; ++i) {
        var image = new Image();
        image.src = 'image/tsuki/'+ i.toString() + '.png';
        this.image_list.push(image);
    }

    this.update = function() {
        this.collision_detection();
        this.position_update();
        this.death_determination();
        ctx = game_system.context;
        ctx.drawImage(this.image_list[this.img_index-1], this.x, this.y, this.width, this.height);
        ctx.drawImage(this.danmanku_image,this.danmanku_x,this.danmanku_y,this.danmanku_width,this.danmanku_height);
        ctx.fillStyle = 'blue';
        ctx.fillRect(this.x + 20, this.y - 20, this.width * this.hp / 100, 20);
        ctx.fillStyle = 'black';
        ctx.strokeRect(this.x + 20, this.y - 20, this.width, 20);
        ctx.save();
        ctx.beginPath();
        ctx.arc(964,50,40,1.5*Math.PI,1.5*Math.PI + (2*Math.PI / 250)*this.energy,false);
        ctx.lineWidth = 8;
        ctx.strokeStyle = "blue";
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }

    this.animation = function() {
        if (this.jump_time != 0) {
            return;
        }
        this.img_index += 1;
        if (this.img_index == 13) {
            this.img_index = 1;
        }
    }

    this.death_determination = function() {
        if (this.y > game_system.canvas.height) {
            game_system.end();
        }
    }

    this.collision_detection = function() {
        var collision_object = undefined;
        for (var i of game_system.exist_terrain) {
            if (this.right > i.left && this.left < i.right
            && this.bottom >= i.top + 8 && this.bottom < i.bottom + 24
            && this.speed >= 0) {
                collision_object = i;
                break;
            }
        }
        if (collision_object === undefined) {
            this.speed += game_system.gravity;
            this.y += this.speed;
        }
        else {
            this.speed = 0;
            this.y = collision_object.top - this.height + 8;
            this.jump_time = 0;
        }
        return collision_object;
    }

    this.position_update = function() {
        if(this.x > this.constx && this.rush == false){
            this.x -= 1;
        }
        if(this.rush == true){
            this.x += 5;
        }
        this.left = this.x + 50;
        this.right = this.x + this.width - 30;
        this.top = this.y + 20;
        this.bottom = this.y + this.height;
        this.top = this.y + 20;
        this.bottom = this.y + this.height;
        this.danmanku_x = this.x + this.width/2;
        this.danmanku_y = this.y + this.height/2 - 10;
    }

    this.attack_detection = function() {
    }
}

function terrain(n) {
    this.width = 280;
    this.height = 25;
    this.x = game_system.canvas.width;
    this.y = game_system.canvas.height - n * 210 + 75;
    this.left = this.x;
    this.right = this.x + this.width;
    this.top = this.y;
    this.bottom = this.y + this.height;
    this.image = new Image();
    this.image.src = "image/floor.png";

    this.update = function() {
        this.position_update();
        ctx = game_system.context;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    this.position_update = function() {
        this.x -= game_system.game_speed;
        this.left = this.x;
        this.right = this.x + this.width;
        if (this.right < 0) {
            delete this;
        }
    }
}

function props(n) {
    this.width = 50;
    this.height = 50;
    this.x = game_system.canvas.width;
    this.y = game_system.canvas.height - n * 210 + 15;
    this.center = this.y;
    this.left = this.x;
    this.right = this.x + this.width;
    this.top = this.y;
    this.bottom = this.y + this.height;
    this.got = false;
    this.image = new Image();
    this.image.src = 'image/bullet.png';
    this.sound = new sound('sound/props.mp3');
    this.angle = 0;

    this.update = function() {
        if (!this.got) {
            this.position_update();
            this.collision_detection();
            ctx  = game_system.context;
            ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        }
    }

    this.animation = function() {
        this.angle = (this.angle + 1) % 360;
        this.y = this.center + 7 * Math.sin(this.angle * Math.PI / 180);
    }

    this.position_update = function() {
        this.x -= game_system.game_speed;
        this.left = this.x;
        this.right = this.x + this.width;
        this.top = this.y;
        this.bottom = this.y + this.height;
        if (this.right < 0) {
            delete this;
        }
    }

    this.collision_detection = function() {
        if (this.bottom > game_system.my_hero.top && this.top < game_system.my_hero.bottom
        && this.left < game_system.my_hero.right && this.right > game_system.my_hero.left
        && !this.got) {
            this.sound.play();
            this.got = true;
            if(game_system.my_hero.energy < 250){
                game_system.my_hero.energy += 50;

            }
            if(game_system.my_hero.hp < 100){
                game_system.my_hero.hp += 10;
                if(game_system.my_hero.hp > 100){
                    game_system.my_hero.hp = 100;
                }
            }
            game_system.my_hero.attack_detection();
        }
    }
}

function danmanku(){
    this.x = -100;
    this.y = -100;
    this.angle = 0;
    this.speed= 5;
    this.width = 32;
    this.height = 32;
    this.left = this.x;
    this.right = this.x + this.width;
    this.top = this.y;
    this.bottom = this.y + this.height;
    this.disable = true;
    this.image = new Image();
    this.image.src = 'image/danmanku.png';
    this.update = function(){
        if(this.disable == false){
            this.position_update();
            this.collision_detection();
            ctx = game_system.context;
            ctx.drawImage(this.image,this.x,this.y,this.width,this.height);
        }
    }
    this.position_update = function(){
        if(this.disable == false){
            this.x += this.speed*Math.cos(this.angle);
            this.y += this.speed*Math.sin(this.angle);
            this.left = this.x;
            this.right = this.x + this.width;
            this.top = this.y;
            this.bottom = this.y + this.height;
            if(this.x < -64 || this.x > 1088 || this.y < -64 || this.y > 832){
                this.disable = true;
            }
        }
    }
    this.collision_detection = function(){
        if (this.bottom > game_system.my_hero.danmanku_y && this.top < game_system.my_hero.danmanku_y + game_system.my_hero.danmanku_height
        && this.left < game_system.my_hero.danmanku_x + game_system.my_hero.danmanku_width && this.right - 25 > game_system.my_hero.danmanku_x && this.disable == false && game_system.my_hero.rush == false) {
            game_system.my_hero.hp -= 5;
            this.disable = true;
            if(game_system.my_hero.hp <= 0){
                game_system.end();
            }
        }
    }
}

function fire(n) {
    this.x = game_system.canvas.width + 40;
    this.y = game_system.canvas.height - n * 210 / 2;
    this.width = 60;
    this.height = 37;
    this.left = this.x;
    this.right = this.x + this.width;
    this.top = this.y;
    this.bottom = this.y + this.height;
    this.img_index = 0;
    this.disable = false;
    this.image_list = [];
    for (var i = 1; i < 5; ++i) {
        var image = new Image();
        image.src = 'image/fire'+ i.toString() + '.png';
        this.image_list.push(image);
    }
    this.sound = new sound('sound/fire.mp3');
    this.sound.play();

    this.update = function() {
        if(this.disable == false){
            this.position_update();
            this.collision_detection();
            ctx = game_system.context;
            ctx.drawImage(this.image_list[this.img_index], this.x, this.y, this.width, this.height);
        }
    }

    this.position_update = function() {
        this.x -= game_system.game_speed + 4;
        this.left = this.x;
        this.right = this.x + this.width;
        if (this.right < 0) {
            delete this;
        }
    }

    this.collision_detection = function() {
        if (this.bottom > game_system.my_hero.top && this.top < game_system.my_hero.bottom
        && this.left < game_system.my_hero.right && this.right - 25 > game_system.my_hero.left && this.disable == false && game_system.my_hero.rush == false) {
            game_system.my_hero.hp -= 20;
            this.disable = true;
            if(game_system.my_hero.hp <= 0){
                game_system.end();
            }
        }
    }

    this.animation = function() {
        this.img_index = (this.img_index + 1) % 4;
    }
}

function light(n) {
    this.x = 0;
    this.y = game_system.canvas.height - n * 210 - 60;
    this.width = game_system.canvas.width;
    this.height = 48;
    this.top = this.y;
    this.bottom = this.y + this.height;
    this.harmful = false;
    this.exist = true;
    this.count = 0;
    this.image = new Image();
    this.sound = new sound('sound/laser2.mp3');
    this.sound.play();

    this.update = function() {
        this.count += 1;
        if (this.count == 100) {
            this.activate();
        }
        else if (this.count == 125) {
            this.vanish();
        }
        this.collision_detection();
        if (!this.exist) {
            return;
        }
        ctx = game_system.context;
        if (!this.harmful) {
            this.image.src = 'image/laser1.png';
        }
        else {
            this.image.src = 'image/laser2.png';
        }
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
    }

    this.collision_detection = function() {
        if (game_system.my_hero.bottom > this.top && game_system.my_hero.top < this.bottom && this.harmful && game_system.my_hero.rush == false) {
            game_system.my_hero.hp -= 30;
            if(game_system.my_hero.hp <= 0){
                game_system.end();
            }
            
        }
    }

    this.activate = function() {
        this.harmful = true;
    }

    this.vanish = function() {
        this.harmful = false;
        this.exist = false;
        delete this;
    }
}

function enemy(rank) {
    this.x = game_system.canvas.width;
    this.y = 200;
    this.angle = 0;
    this.width = 440;
    this.alive = true;
    this.HP = rank * 100;
    this.image = new Image();
    this.image.src = 'image/enemy' + rank.toString() + '.png';
    switch (rank) {
        case 1:
            this.height = 250;
            break;
        case 2:
            this.height = 331;
            break;
        case 3:
            this.height = 341;
            break;
        case 4:
            this.height = 344;
            break;
        case 5:
            this.height = 342;
            break;
        case 6:
            this.height = 377;
            break;
    }

    this.update = function() {
        if (this.x > 500) {
            this.x -= 4;
        }
        this.death_determination();
        if (!this.alive) {
            return;
        }
        ctx = game_system.context;
        ctx.drawImage(this.image, this.x, this.y, this.width, this.height);
        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 50, this.width * this.HP / rank / 100, 20);
        ctx.fillStyle = 'black';
        ctx.strokeRect(this.x, this.y - 50, this.width, 20);
    }

    this.animation = function() {
        if (this.x > 500) {
            return;
        }
        else {
            this.angle = (this.angle + 1) % 360;
            this.y = 200 + 25 * Math.sin(this.angle * Math.PI / 180);
        }
    }

    this.death_determination = function() {
        if (this.HP <= 0) {
            game_system.terrain_index = 0;
            this.alive = false;
            if (!game_system.scenario_mode) {
                game_system.score += 5000 * rank;
            }
            delete this;
            game_system.enemy = undefined;
            game_system.battle_mode = false;
            game_system.battle += 1;
            if (game_system.fire_interval) {
                clearInterval(game_system.fire_interval);
            }
            if (game_system.props_interval) {
                clearInterval(game_system.props_interval);
            }
            if (game_system.light_interval) {
                clearInterval(game_system.light_interval);
            }
            if (game_system.scenario_mode) {
                if (game_system.level == 1 && game_system.battle == 4) {
                    game_system.level += 1;
                    game_system.battle = 1;
                    document.getElementById('bg_img').style.display = 'block';
                    setTimeout(scenario(game_system.level), 5000);
                }
                else if (game_system.level == 2 && game_system.battle == 3) {
                    game_system.level += 1;
                    game_system.battle = 1;
                    document.getElementById('bg_img').style.display = 'block';
                    setTimeout(scenario(game_system.level), 5000);
                }
                else if (game_system.level == 3 && game_system.battle == 2) {
                    game_system.level += 1;
                    game_system.battle = 1;
                    document.getElementById('bg_img').style.display = 'block';
                    setTimeout(scenario(game_system.level), 5000);
                }
                else if (game_system.level == 4 && game_system.battle == 3) {
                    game_system.level += 1;
                    game_system.battle = 1;
                    document.getElementById('bg_img').style.display = 'block';
                    setTimeout(scenario(game_system.level), 5000);
                }
                else if (game_system.level == 5 && game_system.battle == 2) {
                    game_system.level += 1;
                    game_system.battle = 1;
                    document.getElementById('bg_img').style.display = 'block';
                    setTimeout(scenario(game_system.level), 5000);
                }
                else if (game_system.level == 6 && game_system.battle == 2) {
                    game_system.level += 1;
                    game_system.battle = 1;
                    document.getElementById('bg_img').style.display = 'block';
                    setTimeout(scenario(game_system.level), 5000);
                }
                else if (game_system.level == 7 && game_system.battle == 2) {
                    game_system.level += 1;
                    game_system.battle = 1;
                    document.getElementById('bg_img').style.display = 'block';
                    setTimeout(scenario(game_system.level), 5000);
                }
                else {
                    game_system.new_enemy = setTimeout(battle_interface, 5000);
                }
            }
            else {
                game_system.game_speed += 0.2;
                setTimeout(battle_interface, 5000);
            }
        }
    }
}

function music(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.setAttribute("loop", "true")
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }  
}

function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }    
}

function game_pause(){
    if(game_system.pause == false){
        game_system.pause = true;
        document.getElementById('pause').innerHTML = "继续游戏";
        return;
    }
    if(game_system.pause == true){
        game_system.pause = false;
        document.getElementById('pause').innerHTML = "暂停游戏";
        return;
    }
}

function battle_interface() {
    game_system.background = new Image();
    game_system.background.src = 'image/bg.png';
    if (!game_system.scenario_mode && game_system.battle == 1) {
        game_system.canvas.style.background = "url(image/bg.png)";
        game_system.bg_music.stop();
        game_system.bg_music = new music('music/bg1.mp3');
        game_system.bg_music.play();
        game_system.animation_interval = setInterval(game_system.animation, 10);
        game_system.hero_animation_interval = setInterval(game_system.hero_animation, 50);
        document.getElementById('bg_img').style.display = 'none';
        game_system.score = 0;
        document.getElementById('title').style.display = 'none';
        document.getElementById('start').style.display = 'none';
        document.getElementById('restart').style.display = 'none';
        document.getElementById('return').style.display = 'none';
        document.getElementById('scene').style.display = 'none';
        document.getElementById('score').style.display = 'block';
        document.getElementById('highscore').style.display = 'block';
        game_system.highscore = localStorage.getItem('highscore');
        for (var i = 0; i < 7; ++i) {
            var advance_terrain = new terrain(1);
            advance_terrain.x = i * (advance_terrain.width - 2);
            game_system.exist_terrain.push(advance_terrain);
        }
        game_system.my_hero = new hero();
    }
    else if (game_system.scenario_mode && game_system.level == 1 && game_system.battle == 1) {
        clearInterval()
        game_system.score = 0;
        game_system.highscore = localStorage.getItem('highscore');
    }

    if (game_system.scenario_mode && game_system.battle == 1) {
        clearInterval(game_system.danmanku_interval);
        clearInterval(game_system.danmanku_interval1);
        clearInterval(game_system.danmanku_interval2);
        game_system.speed = 6 + 0.2 * game_system.level;
        if (game_system.animation_interval == undefined) {
            game_system.animation_interval = setInterval(game_system.animation, 10);
        }
        if (game_system.hero_animation_interval == undefined) {
            game_system.hero_animation_interval = setInterval(game_system.hero_animation, 50);
        }
        game_system.bg_music.stop();
        switch (game_system.level) {
            case 1:
                game_system.bg_music = new music('music/bg1.mp3');
                break;
            case 2:
                if (game_system.bg_music.sound.src.indexOf('bg2.mp3') == -1) {
                    game_system.bg_music = new music('music/bg2.mp3');
                }
                break;
            case 3:
                game_system.bg_music = new music('music/bg3.mp3');
                break;
            case 4:
                game_system.bg_music = new music('music/bg4.mp3');
                break;
            case 5:
                game_system.bg_music = new music('music/bg5.mp3');
                break;
            case 6:
                if (game_system.bg_music.sound.src.indexOf('bg6.mp3') == -1) {
                    game_system.bg_music = new music('music/bg6.mp3');
                }
                break;
            case 7:
                if (game_system.bg_music.sound.src.indexOf('bg7.mp3') == -1) {
                    game_system.bg_music = new music('music/bg7.mp3');
                }
                break;
        }
        game_system.bg_music.play();
        game_system.my_hero = new hero();
        for (var i = 0; i < 7; ++i) {
            var advance_terrain = new terrain(1);
            advance_terrain.x = i * (advance_terrain.width - 2);
            game_system.exist_terrain.push(advance_terrain);
        }
        document.getElementById('restart').style.display = 'none';
        document.getElementById('return').style.display = 'none';
        game_system.canvas.style.background = "url(image/bg.png)";
    }

    if (game_system.interval == undefined) {
        game_system.interval = setInterval(game_system.update, 10);
    }
    
    if (game_system.scenario_mode) {
        scenario_system.scenario(game_system.level, game_system.battle);
        game_system.start();
    }
    else {
        var rank = Math.floor(Math.random() * 6) + 1;
        game_system.enemy = new enemy(rank);
        game_system.start();
    }
}

function scenario(level) {
    for (var i of game_system.exist_terrain) {
        delete i;
    }
    game_system.exist_terrain = [];
    for (var i of game_system.fire) {
        delete i;
    }
    game_system.fire = [];
    for (var i of game_system.props) {
        delete i;
    }
    game_system.props = [];
    for (var i of game_system.light) {
        delete i;
    }

    delete game_system.enemy;
    game_system.enemy = undefined;
    game_system.light = [];
    game_system.bullet_list = [];
    game_system.danmanku_list = [];
    delete game_system.my_hero;
    game_system.my_hero = undefined;
    scenario_system.before_battle = true;
    scenario_system.command_index = 0;
    if (game_system.interval != undefined) {
        clearInterval(game_system.interval);
        game_system.interval = undefined;
        game_system.clear();
    }
    game_system.scenario_mode = true;
    ctx = game_system.context;
    document.getElementById('title').style.display = 'none';
    document.getElementById('start').style.display = 'none';
    document.getElementById('restart').style.display = 'none';
    document.getElementById('return').style.display = 'none';
    document.getElementById('scene').style.display = 'none';
    document.getElementById('score').style.display = 'none';
    document.getElementById('highscore').style.display = 'none';
    scenario_system.command = scenario_list[level-1].split('\n');
    scenario_system.read_command();
}

function return_title() {
    document.getElementById('bg_img').style.display = 'block';
    document.getElementById('bg_img').src = 'image/title.png';
    document.getElementById('bg_img').style.opacity = 1;
    document.getElementById('title').style.display = 'block';
    document.getElementById('score').style.display = 'none';
    document.getElementById('highscore').style.display = 'none';
    document.getElementById('start').style.display = 'block';
    document.getElementById('scene').style.display = 'block';
    document.getElementById('restart').style.display = 'none';
    document.getElementById('return').style.display = 'none';
    game_system.bg_music.stop();
    game_system.bg_music = new music('music/title.mp3');
    game_system.bg_music.play();
    game_system.scenario_mode = false;
    game_system.battle_mode = false;
    game_system.level = 1;
}