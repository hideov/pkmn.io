/*
 * (C) Copyright Brock, Hideov 2015
 */

var fs = require('fs'),
    blessed = require('blessed'),
    program = blessed();

Maps = [];

Pokemon = {};

//----------  Events

Events = {};

Events.nothing = function (caller, args)
{
}

Events.battle = function (caller, args)
{
  this.type = (args && args[0] && args[0].type) ? args[0].type : 'wild';
  if (this.type === 'wild')
  {
    var chance = Math.random();
    if (chance < 0.15)
    {
      // wild pokemon appears
      var n = Green.map.wild.length;
      if (n <= 0)
        return;
      // Green.map.wild[Math.floor(n*Math.random())].growl();
      new Battle({
        rival: new Pkmn(Green.map.wild[Math.floor(n*Math.random())]),
        myself: Green.team[0], // oops
        environment: 'green',
      })
    }
  }
  else if (this.type === 'trainer')
  {
    Utils.echo('battle ' + JSON.stringify(caller.team))
  }
}

Events.personTalk = function (caller, args)
{
  Person.prototype.talk.apply(caller, args);
}

//-------------

TileTypes = {
  'g': {
    colour: 'green',
    pic: ' ',
    event: 'battle',
    eventArgs: [{type: 'wild'}],
    walkable: true,
  },
  '_': {
    colour: 'white',
    pic: ' ',
    event: 'nothing',
    eventArgs: [],
    walkable: true,
  },
  '#': {
    colour: 'brown',
    pic: ' ',
    event: 'nothing',
    eventArgs: [],
    walkable: false,
  }
}

var SCR, OUT, WORLD;

// ---------------------------------------

var Utils =  {};

Utils.echo = function (msg)
{
  //console.log(msg);
  OUT.setContent('{bold}'+msg+'{/bold}');
  SCR.render();
}

Utils.genUUID = function ()
{
  // should check if it's unique
  return Math.floor(10000000*Math.random());
}

Utils.loadMap = function(map)
{
  // load tiles
  mapfile = fs.readFileSync('maps/'+map+'.txt', 'utf-8').split('\n');
  var h = 0;
  var w = mapfile[0].length;
  var l, fileline;
  var tiles = [];
  for (var y = 0; y < mapfile.length; y++)
  {
    if (mapfile[y].length <= 0)
      continue;

    l = [];
    fileline = mapfile[y].split('');
    for (var x = 0; x < w; x++)
    {
      l.push(new Tile({pos: {x: x, y: y}, type: fileline[x]}));
    }
    tiles.push(l);
    h++;
  }

  // load objects
  var objects = [];
  var objs = JSON.parse(fs.readFileSync('objs/'+map+'.txt', 'utf-8'));
  for (var i = 0; i < objs.length; i++)
  {
    var o = objs[i]; // is my obj proto
    var r = new GLOBAL[o.type]({
      name: o.name || 'thing/guy',
      event: o.event || 'nothing',
      eventArgs: o.eventArgs || [],
      pic: o.pic || ' ',
      pos: o.pos,
      colour: o.colour,
      team: o.team,
    });
    objects.push(r);
  }

  return {width: w, height: h, tiles: tiles, objects: objects};
}

Utils.initgfx = function ()
{
  // Create a screen object.
  SCR = blessed.screen();

  SCR.title = 'pkmn.io';

  OUT = blessed.box({
    parent: SCR,
    bottom: 0,
    left: 0,
    width: '100%',
    height: 4,
    content: 'Hello {bold}world{/bold}!',
    tags: true,
    border: {
      type: 'line'
    },
    style: {
      fg: 'white',
      bg: 'magenta',
      border: {
        fg: '#f0f0f0'
      },
      hover: {
        bg: 'green'
      }
    }
  });

  SCR.key('q', function() {
    process.exit(0);
  });

  SCR.key('c', function() {
    Utils.echo('cane');
  });

  SCR.key(['right', 'left', 'up', 'down'], function(ch, key) {
    Utils.echo(key.name);
    var k = key.name;
    var map = Green.map;
    var x = Green.pos.x;
    var y = Green.pos.y;
    var dx = 0, dy = 0;
    switch (k) {
      case 'left':
        dx = -1;
        Green.pic = '<';
        Green.orientation = 'left';
        break;
      case 'right':
        dx = 1;
        Green.pic = '>';
        Green.orientation = 'right';
        break;
      case 'up':
        dy = -1;
        Green.pic = '^';
        Green.orientation = 'up';
        break;
      case 'down':
        dy = 1;
        Green.pic = 'v';
        Green.orientation = 'down';
        break;
    }

    // check if the position exists
    var walkable = x + dx >= 0 && x + dx < map.width 
                && y + dy >= 0 && y + dy < map.height;
    if (walkable)
    {
      // check if tile is walkable
      walkable = map.tiles[y+dy][x+dx].walkable;
      // check if objs are walkable
      var objs = map.getObjectsAtCoord(y+dy, x+dx);
      for (var i = 0; i < objs.length; i++)
        if (objs[i].pos.x === x+dx && objs[i].pos.y === y+dy)
          walkable = walkable && objs[i].walkable;
    }

    if (walkable)
    {
      Green.move(dx, dy);
      map.tiles[y+dy][x+dx].callEvent();
    }
    else
    {
      // still update orientation of player sprite
      Green.move(0,0);
    }
  });

  SCR.key(['z'], function (ch, key) {
    var map = Green.map;
    var x = Green.pos.x;
    var y = Green.pos.y;
    var dx = 0, dy = 0;
    switch (Green.orientation) {
      case 'left':
        dx = -1;
        break;
      case 'right':
        dx = 1;
        break;
      case 'up':
        dy = -1;
        break;
      case 'down':
        dy = 1;
        break;
    }
    var objs = map.getObjectsAtCoord(y+dy, x+dx);
    if (objs.length > 0) { // what should we do if there are more than one object?
      objs[0].callEvent();
    }
  });

  SCR.render();
}

// ------------------



var Battle = function (battle) {

  this.rival = battle.rival;
  this.myself = battle.myself;
  this.environmentBg = battle.environment;

  this.initGfx();
};

Battle.prototype.initGfx = function () {
  var pthis = this;
  
  this.formW = 60;
  this.formH = 21;
  this.formBg = 'yellow';

  this.form = blessed.form({
    parent: SCR,
    keys: true,
    left: 0,
    top: 0,
    width: pthis.formW,
    height: pthis.formH,
    bg: pthis.formBg,
  });

  // choices/textbox

  this.choices = blessed.list({
    parent: pthis.form,
    left: 1,
    bottom: 1,
    width: pthis.formW - 24,
    height: 5,
    padding: { left: 1, right: 1 },
    mouse: true,
    keys: false,
    style: {
      selected: {
        bg: 'red'
      }
    },
    items: [
      'uno', 
      'due', 
      'tre', 
      'quattro', 
      'uno', 
      'due', 
      'tre', 
      'quattro'
    ],
  });

  this.outputbox = blessed.box({
    parent: pthis.form,
    left: 1,
    bottom: 1,
    height: 5,
    width: pthis.formW - 24,
  });

  this.textbox = blessed.text({
    parent: pthis.outputbox,
    top: 0,
    bottom: 0,
    left: 0,
    right: 4,
    padding: { left: 1, right: 1 },
    mouse: true,
    keys: true,
    content: 'a wild pokemon appeared',
  });

  this.textbtn = blessed.button({
    parent: pthis.outputbox,
    top: 0,
    bottom: 0,
    right: 0,
    width: 4,
    mouse: true,
    keys: true,
    padding: { left: 1, right: 1 },
    content: 'OK',
    align: 'center',
    valign: 'middle',
    style: {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    },
  });

  // battle field

  this.myHpValue = blessed.text({
    parent: pthis.form,
    right: 1,
    bottom: 7,
    width: 9,
    padding: { left: 1, right: 1 },
    content: pthis.myself.hp + '/' + pthis.myself.totalHp,
  });

  this.myName = blessed.text({
    parent: pthis.form,
    bottom: 9,
    left: 1,
    height: 1,
    width: pthis.formW - 2,
    padding: { left: 1, right: 1 },
    content: pthis.myself.name,
  });

  this.myHpLable = blessed.text({
    parent: pthis.form,
    bottom: 7,
    left: 1,
    height: 1,
    padding: { left: 1, right: 1 },
    content: 'hp:',
  });

  this.myHp = blessed.progressbar({
    parent: pthis.form,
    bottom: 7,
    left: 6,
    height: 1,
    width: pthis.formW - 17,
    filled: 100 * pthis.rival.hp/pthis.rival.totalHp,
    pch: '#',
  });

  //

  this.rivalName = blessed.text({
    parent: pthis.form,
    top: 1,
    left: 1,
    height: 1,
    width: pthis.formW - 2,
    padding: { left: 1, right: 1 },
    content: pthis.rival.name,
  });

  this.rivalHpLable = blessed.text({
    parent: pthis.form,
    top: 3,
    left: 1,
    height: 1,
    padding: { left: 1, right: 1 },
    content: 'hp:',
  });

  this.rivalHp = blessed.progressbar({
    parent: pthis.form,
    top: 3,
    left: 6,
    height: 1,
    width: pthis.formW - 7,
    filled: 100 * pthis.rival.hp/pthis.rival.totalHp,
    pch: '#',
  });

  //

  this.environment = blessed.box({
    parent: pthis.form,
    top: 5,
    bottom: 11,
    left: 1,
    right: 1,
    style: { bg: pthis.environmentBg },
  });

  // buttons

  this.fight = blessed.button({
    parent: pthis.form,
    mouse: true,
    keys: false,
    shrink: true,
    width: 10,
    padding: {
      left: 1,
      right: 1
    },
    align: 'center',
    tight: 1,
    bottom: 5,
    right: 12,
    name: 'fight',
    content: 'FIGHT',
    style: {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    },
  });

  this.bag = blessed.button({
    parent: pthis.form,
    mouse: true,
    keys: true,
    shrink: true,
    width: 10,
    padding: {
      left: 1,
      right: 1
    },
    align: 'center',
    tight: 1,
    bottom: 5,
    right: 1,
    name: 'bag',
    content: 'BAG',
    style:  {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    },
  });

  this.pkmn = blessed.button({
    parent: pthis.form,
    mouse: true,
    keys: true,
    shrink: true,
    width: 10,
    padding: {
      left: 1,
      right: 1
    },
    align: 'center',
    tight: 1,
    bottom: 3,
    right: 12,
    name: 'pkmn',
    content: 'PKMN',
    style:  {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    },
  });

  this.run = blessed.button({
    parent: pthis.form,
    mouse: true,
    keys: true,
    shrink: true,
    width: 10,
    padding: {
      left: 1,
      right: 1
    },
    align: 'center',
    tight: 1,
    bottom: 3,
    right: 1,
    name: 'run',
    content: 'RUN',
    style:  {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    },
  });

  this.down = blessed.button({
    parent: pthis.form,
    mouse: true,
    keys: true,
    shrink: true,
    width: 10,
    padding: {
      left: 1,
      right: 1
    },
    align: 'center',
    tight: 1,
    bottom: 1,
    right: 12,
    name: 'down',
    content: 'v',
    style:  {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    },
  });

  this.up = blessed.button({
    parent: pthis.form,
    mouse: true,
    keys: true,
    shrink: true,
    width: 10,
    padding: {
      left: 1,
      right: 1
    },
    align: 'center',
    tight: 1,
    bottom: 1,
    right: 1,
    name: 'up',
    content: '^',
    style:  {
      bg: 'blue',
      focus: {
        bg: 'red'
      },
      hover: {
        bg: 'red'
      }
    },
  });

  //

  this.pkmn.on('press', function() {
    pthis.pkmncmd();
  });

  this.bag.on('press', function() {
    pthis.bagcmd();
  });

  this.fight.on('press', function() {
    pthis.fightcmd();
  });

  this.run.on('press', function() {
    pthis.runcmd();
  });

  this.down.on('press', function() {
    pthis.choices.down(1);
  });

  this.up.on('press', function() {
    pthis.choices.up(1);
  });

  this.textbtn.on('press', function() {
    pthis.echobtn();
  });

  SCR.render();
};

Battle.prototype.pkmncmd = function () {
  this.echo('pkmn.');
};

Battle.prototype.bagcmd = function () {
  this.echo('bag.');
};

Battle.prototype.fightcmd = function () {
  this.echo('fight');
};

Battle.prototype.runcmd = function () {
  this.echo('run');
};

Battle.prototype.echo = function (msg) {
  this.textbox.setContent(msg);
  this.outputbox.hidden = false;
  SCR.render();
};

Battle.prototype.echobtn = function () {
  this.outputbox.hidden = true;
  SCR.render();
};

Battle.prototype.updateStatus = function {
  SCR.render();
};

// ---------------------------------------

var Map = function (args)
{
  if (!args)
    args = {};

  this.id = Utils.genUUID();
  this.name = args.name || 'number island';
  this.wild = args.wild || []; // [new pkmn()]
  this.objects = args.objects || [];
  this.width = args.width || 10;
  this.height = args.height || 10;
  if (args.tiles)
    this.tiles = args.tiles;
  else
  {
    this.tiles = [];
    for (var y = 0; y < this.height; y++)
    {
      var l = [];
      for (var x = 0; x < this.width; x++)
      {
        l.push(new Tile({pos: {x: x, y: y}}));
        l[x].setIndex(0);
      }
      this.tiles.push(l);
    }
  }
}

Map.prototype.drawTiles = function ()
{
  delete WORLD;
  WORLD = [];

  // Draw tiles
  for (var y = 0; y < this.height; y++)
  {
    var l = [];
    for (var x = 0; x < this.width; x++)
    {
      l.push(blessed.box({
        parent: SCR,
        top: y,
        left: x,
        width: 1,
        height: 1,
        tags: true,
        bg: this.tiles[y][x].colour,
        content: this.tiles[y][x].pic,
      }));
    }
    WORLD.push(l);
  }

  SCR.render();
}

Map.prototype.drawObjects = function ()
{
  delete OBJECTS;
  OBJECTS = []
  for (var y = 0; y < this.height; y++)
  {
    var l = [];
    for (var x = 0; x < this.width; x++)
      l.push(undefined);
    OBJECTS.push(l);
  }
  // Draw objects
  for (var i = 0; i < this.objects.length; i++)
    this.objects[i].draw() // this places the object inside OBJECTS
}

Map.prototype.getObjectsAtCoord = function (y, x)
{
  var res = [];
  var o;
  for (var i = 0; i < this.objects.length; i++)
  {
    o = this.objects[i];
    if (typeof o.pos !== 'undefined'
      && typeof o.pos.x !== 'undefined'
      && typeof o.pos.y !== 'undefined'
      && o.pos.x === x 
      && o.pos.y === y)
      res.push(o);
  }
  return res;
}

// ---------------------------------------

Obj = function (args)
{
  if (!args)
    var args = {};

  this.id = Utils.genUUID();
  this.type = 'object';
  this.pos = args.pos || undefined;
  this.pic = args.pic || '';
  this.map = args.map || undefined;
  this.colour = args.colour || undefined;
  this.orientation = args.orientation || 'down';
  this.event = args.event || 'nothing';
  this.eventArgs = args.eventArgs || [];
  this.walkable = false;

  if (this.map)
    this.map.objects.push(this);
}

Obj.prototype.place = function (x, y)
{
  this.map.tiles[this.pos.y][this.pos.x].draw();
  this.pos = {x: x, y: y};
  this.draw();
}

Obj.prototype.move = function (x, y)
{
  this.map.tiles[this.pos.y][this.pos.x].draw();
  this.pos.x += x;
  this.pos.y += y;
  this.draw();
}

Obj.prototype.draw = function ()
{
  
  if (typeof this.pos === 'undefined' 
    || typeof !this.pos.x === 'undefined' 
    || typeof !this.pos.y === 'undefined')
    return;
  this.box = blessed.box({
    parent: SCR,
    top: this.pos.y,
    left: this.pos.x,
    width: 1,
    height: 1,
    tags: true,
    bg: this.colour,
    content: '{bold}'+this.pic+'{/bold}'
  });
  // this.box.setIndex(100);

  OBJECTS[this.pos.y][this.pos.x] = this.box;

  SCR.render();
}

Obj.prototype.callEvent = function ()
{

  return Events[this.event](this, this.eventArgs);
}

// ---------------------------------------

Pkmn = function (args)
{
  if (!args)
    args = {};

  Obj.call(this, args);
  this.type = 'pokemon';
  this.name = args.name || 'MissingNo';
  this.pic = 'o';
  this.hp = args.hp;
  this.totalHp = args.totalHp;
};

Pkmn.prototype = new Obj();

Pkmn.prototype.growl = function ()
{

  Utils.echo('grr '+this.name + ' ' + Math.floor(10*Math.random()));
}

// ---------------------------------------

Person = function (args)
{
  if (!args)
    args = {};

  Obj.call(this, args);
  this.type = 'person';
  this.name = args.name || 'weirdo';
  this.pic = args.pic || 'x';
  this.team = args.team || [];
}

Person.prototype = new Obj();

Person.prototype.talk = function (msg)
{
  if (!msg)
    mst = this.eventArgs[0];
  Utils.echo(this.name + ' ' + msg);
}

//----------------------------

Tile = function (args)
{
  if (!args)
    args = {};

  Obj.call(this, args);

  this.type = 'tile';
  if (args.type && args.type in TileTypes)
  {
    var type = TileTypes[args.type];
    this.colour = type.colour;
    this.pic = type.pic;
    this.event = type.event;
    this.walkable = type.walkable;
  }
  else
  {
    this.colour = args.colour || 'white'; // yellow
    this.pic = args.pic || ' ';
    this.event = undefined;
    this.walkable = true;
  }
}

Tile.prototype = new Obj();

// ---------------------------------------
//          INIT

(function ()
{
  // fix these, they myst be prototypes

  Pokemon.pidgey = {
    name: 'pidgey',
    totalHp: 70,
    hp: 30,
  };

  Pokemon.rattata = {
    name: 'rattata',
    totalHp: 20,
    hp: 3,
  };

  var wild = [];
  wild.push(Pokemon.pidgey);
  wild.push(Pokemon.rattata);
  //
  var m = Utils.loadMap('whitevilla');
  var whitevilla = new Map({
    name: 'whitevilla',
    tiles: m.tiles,
    wild: wild,
    objects: m.objects,
    width: m.width,
    height: m.height,
  });

  Green = new Person({
    name: 'Verde',
    map: whitevilla,
    pos: {x: 3, y: 4},
    colour: 'green',
    pic: 'v',
    orientation: 'down',
    team: [new Pkmn(Pokemon.pidgey)]
  });

  // console.log(Green);

  Utils.initgfx();
  Green.map.drawTiles();
  Green.map.drawObjects();
})();
