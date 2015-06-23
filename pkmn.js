/*
 * (C) Copyright Brock, Hideov 2015
 */

var fs = require('fs'),
    blessed = require('blessed'),
    program = blessed();

Maps = [];

Objects = [];

Tiles = [];

//---------------

Events = {};

Events.nothing = function (caller, args)
{
}

Events.battle = function (caller, args)
{
  this.type = (args && args[0] && args[0].type) ? args[0].type : "wild";
  if (this.type === "wild")
  {
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
  else if (this.type === "trainer")
  {
    Utils.echo("battle " + JSON.stringify(caller.team))
  }
}

Events.personTalk = function (caller, args)
{

  PKMNIO.Person.prototype.talk.apply(caller, args);
}

//-------------

TileTypes = {
  'g': {
    colour: 'green',
    pic: " ",
    event: "battle",
    eventArgs: [{type: "wild"}],
    walkable: true,
  },
  '_': {
    colour: 'white',
    pic: " ",
    event: "nothing",
    eventArgs: [],
    walkable: true,
  },
  '#': {
    colour: 'brown',
    pic: " ",
    event: "nothing",
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
      name: o.name || "thing/guy",
      event: o.event || "nothing",
      eventArgs: o.eventArgs || [],
      pic: o.pic || " ",
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
    Utils.echo("cane");
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
    if (typeof o.pos !== "undefined"
      && typeof o.pos.x !== "undefined"
      && typeof o.pos.y !== "undefined"
      && o.pos.x === x 
      && o.pos.y === y)
      res.push(o);
  }
  return res;
}

// ---------------------------------------

var PKMNIO = function () {
}

PKMNIO.Obj = function (args)
{
  if (!args)
    var args = {};

  this.id = Utils.genUUID();
  this.type = "object";
  this.pos = args.pos || undefined;
  this.pic = args.pic || "";
  this.map = args.map || undefined;
  this.colour = args.colour || undefined;
  this.orientation = args.orientation || 'down';
  this.event = args.event || "nothing";
  this.eventArgs = args.eventArgs || [];
  this.walkable = false;

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
  
  if (typeof this.pos === "undefined" 
    || typeof !this.pos.x === "undefined" 
    || typeof !this.pos.y === "undefined")
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

PKMNIO.Obj.prototype.callEvent = function ()
{

  return Events[this.event](this, this.eventArgs);
}

// ---------------------------------------

PKMNIO.Pkmn = function (args)
{
  if (!args)
    args = {};

  PKMNIO.Obj.call(this, args);
  this.type = "pokemon";
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
  this.type = "person";
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

  this.type = "tile";
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
    pic: "v",
    orientation: 'down'
  });

  Utils.initgfx();
  Green.map.drawTiles();
  Green.map.drawObjects();
})();
