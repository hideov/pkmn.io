var blessed = require('blessed')
  , SCR = blessed.screen();


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
    content: '123/321',
  });

  this.myName = blessed.text({
    parent: pthis.form,
    bottom: 9,
    left: 1,
    height: 1,
    width: pthis.formW - 2,
    padding: { left: 1, right: 1 },
    content: pthis.rival.name,
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



battle = new Battle({ rival: {
    name: "pidgey",
    totalHp: 50,
    hp: 26,
  },
  environment: 'green',
  myself: {
    name: "rattata",
    totalHp: 70,
    hp: 30,
  },
});

SCR.key('q', function() {
  process.exit(0);
});

