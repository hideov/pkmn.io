/*
  (C) Copyright Brock, Hideov 2015
*/

var fs = require('fs'),
    blessed = require('blessed'),
    program = blessed();

Maps = [];

Objects = [];

Tiles = [];

//---------------

Events = {};

Events.nothing = function ()
{
}

Events.battle = function (type)
{
  this.type = type || "wild"; // types: wild, trainer
  var chance = Math.random();
  if (chance < 0.15)
  {
    // wild pokemon appears
    var n = Green.map.wild.length;
    if (n <= 0)
      return;
    Green.map.wild[Math.floor(n*Math.random())].growl();
  }
}

Events.trainer = function ()
{
  Events.battle.call(this, "trainer");
}

Events.trainer.prototype = new Events.battle();

Events.personTalk = function (args)
{
  //~ PKMNIO.Person.prototype.talk.apply(this,)
}

//-------------

TileTypes = {
  'g': {
    colour: 'green',
    pic: " ",
    event: Events.battle,
    walkable: true,
  },
  '_': {
    colour: 'white',
    pic: " ",
    event: Events.nothing,
    walkable: true,
  },
  '#': {
    colour: 'brown',
    pic: " ",
    event: Events.nothing,
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
  mapfile = fs.readFileSync('maps/'+map+'.txt', "utf-8").split("\n");
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
      l.push(new PKMNIO.Tile({pos: {x: x, y: y}, type: fileline[x]}));
    }
    tiles.push(l);
    h++;
  }

  // load objects
  var objects = [];
  var objs = JSON.parse(fs.readFileSync('objs/'+map+'.txt', "utf-8"));
  for (var i = 0; i < objs.length; i++)
  {
    var o = objs[i]; // is my obj proto
    var r = new PKMNIO[o.type]({
      name: o.name,
      event: Events.nothing,
      eventArgs: o.eventArgs,
      pic: o.pic,
      colour: o.colour,
      team: o.team,
      pos: o.pos
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
    Utils.echo("cane");
  });

  SCR.key('right', function() {
    Utils.echo('right');
    var x = Green.pos.x;
    var y = Green.pos.y;
    if (x < Green.map.width - 1
        && Green.map.tiles[y][x+1].walkable)
    {
      Green.move(1,0);
      Green.map.tiles[y][x+1].event();
    }
  });

  SCR.key('left', function() {
    Utils.echo('left');
    var x = Green.pos.x;
    var y = Green.pos.y;
    if (x > 0
        && Green.map.tiles[y][x-1].walkable)
    {
      Green.move(-1,0);
      Green.map.tiles[y][x-1].event();
    }
  });

  SCR.key('up', function() {
    Utils.echo('up');
    var x = Green.pos.x;
    var y = Green.pos.y;
    if (y > 0
        && Green.map.tiles[y-1][x].walkable)
    {
      Green.move(0,-1);
      Green.map.tiles[y-1][x].event();
    }
  });

  SCR.key('down', function() {
    Utils.echo('down');
    var x = Green.pos.x;
    var y = Green.pos.y;
    if (y < Green.map.height - 1
        && Green.map.tiles[y+1][x].walkable)
    {
      Green.move(0,1);
      Green.map.tiles[y+1][x].event();
    }
  });

  SCR.render();
}

// ---------------------------------------

var Map = function (args)
{
  if (!args)
    args = {};

  this.id = Utils.genUUID();
  this.name = args.name || "number island";
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
        l.push(new PKMNIO.Tile({pos: {x: x, y: y}}));
      }
      this.tiles.push(l);
    }
  }
}

Map.prototype.draw = function ()
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

  // Draw objects
  for (var i = 0; i < this.objects.length; i++)
    this.objects[i].draw()

  SCR.render();
}

// ---------------------------------------

var PKMNIO = function () {
}

PKMNIO.Obj = function (args)
{
  if (!args)
    var args = {};

  this.id = Utils.genUUID();
  this.pos = args.pos || undefined;
  this.pic = args.pic || "";
  this.map = args.map || undefined;
  this.colour = args.colour || undefined;
  this.event = args.event || Events.nothing;
  this.eventArgs = args.eventArgs || [];

  if (this.map)
    this.map.objects.push(this);
}

PKMNIO.Obj.prototype.place = function (x, y)
{
  this.map.tiles[this.pos.y][this.pos.x].draw();
  this.pos = {x: x, y: y};
  this.draw();
}

PKMNIO.Obj.prototype.move = function (x, y)
{
  this.map.tiles[this.pos.y][this.pos.x].draw();
  this.pos.x += x;
  this.pos.y += y;
  this.draw();
}

PKMNIO.Obj.prototype.draw = function ()
{
  var t = WORLD[this.pos.y][this.pos.x];

  if (this.pic)
    t.content = '{bold}'+this.pic+'{/bold}';

  SCR.render();
}

// ---------------------------------------

PKMNIO.Pkmn = function (args)
{
  if (!args)
    args = {};

  PKMNIO.Obj.call(this, args);
  this.name = args.name || "MissingNo";
  this.pic = "o";
}

PKMNIO.Pkmn.prototype = new PKMNIO.Obj();

PKMNIO.Pkmn.prototype.growl = function ()
{
  Utils.echo("grr "+this.name + " " + Math.floor(10*Math.random()));
}

// ---------------------------------------

PKMNIO.Person = function (args)
{
  if (!args)
    args = {};

  PKMNIO.Obj.call(this, args);
  this.name = args.name || "weirdo";
  this.pic = args.pic || "x";
  this.team = args.team || [];
}

PKMNIO.Person.prototype = new PKMNIO.Obj();

PKMNIO.Person.prototype.talk = function (msg)
{
  if (!msg)
    mst = this.eventArgs[0];
  Utils.echo(this.name + " " + msg);
}

//----------------------------

PKMNIO.Tile = function (args)
{
  if (!args)
    args = {};

  PKMNIO.Obj.call(this, args);

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
      this.colour = args.colour || "white"; // yellow
      this.pic = args.pic || " ";
      this.event = undefined;
      this.walkable = true;
    }
  }

PKMNIO.Tile.prototype = new PKMNIO.Obj();


// ---------------------------------------
//          INIT

(function ()
{
  var wild = [];
  wild.push(new PKMNIO.Pkmn({name: "pidgey"}));
  wild.push(new PKMNIO.Pkmn({name: "rattata"}));
  //
  var m = Utils.loadMap('whitevilla');
  var whitevilla = new Map({
    name: "whitevilla",
    tiles: m.tiles,
    wild: wild,
    objects: m.objects,
    width: m.width,
    height: m.height,
  });

  Green = new PKMNIO.Person({
    name: "Verde",
    map: whitevilla,
    pos: {x: 3, y: 4},
    colour: "green",
    pic: "@"
  });

  Utils.initgfx();
  Green.map.draw();
})();
