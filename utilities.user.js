// ==UserScript==
// @name         Utilities
// @namespace    http://tampermonkey.net/
// @version      1.4.2
// @description  Utilities for EyeWire
// @author       Krzysztof Kruk
// @match        https://*.eyewire.org/*
// @exclude      https://*.eyewire.org/1.0/*
// @downloadURL  https://raw.githubusercontent.com/ChrisRaven/EyeWire-Utilities/master/utilities.user.js
// ==/UserScript==

/*jshint esversion: 6 */
/*globals $, account, tomni, THREE */ 

var LOCAL = false;
if (LOCAL) {
  console.log('%c--== TURN OFF "LOCAL" BEFORE RELEASING!!! ==--', "color: red; font-style: italic; font-weight: bold;");
}

(function() {
  'use strict';
  'esversion: 6';

  var K = {
    gid: function (id) {
      return document.getElementById(id);
    },
    
    qS: function (sel) {
      return document.querySelector(sel);
    },
    
    qSa: function (sel) {
      return document.querySelectorAll(sel);
    },


    addCSSFile: function (path) {
      $("head").append('<link href="' + path + '" rel="stylesheet" type="text/css">');
    },

    // Source: https://stackoverflow.com/a/6805461
    injectJS: function (text, sURL) {
      var
        tgt,
        scriptNode = document.createElement('script');

      scriptNode.type = "text/javascript";
      if (text) {
        scriptNode.textContent = text;
      }
      if (sURL) {
        scriptNode.src = sURL;
      }

      tgt = document.getElementsByTagName('head')[0] || document.body || document.documentElement;
      tgt.appendChild(scriptNode);
    },
    
    // localStorage
    ls: {
      get: function (key) {
        return localStorage.getItem(account.account.uid + '-ews-' + key);
      },

      set: function (key, val) {
        localStorage.setItem(account.account.uid + '-ews-' + key, val);
      },

      remove: function (key) {
        localStorage.removeItem(account.account.uid + '-ews-' + key);
      }
    }
  };


  var intv = setInterval(function () {
    if (typeof account === 'undefined' || !account.account.uid) {
      return;
    }
    clearInterval(intv);
    main();
  }, 100);
  
  function main() {

function showOrHideButton(pref, state) {
  var text = '';
  switch (pref) {
    case "ew-hide-blog": text = 'Blog'; break;
    case "ew-hide-wiki": text = 'Wiki'; break;
    case "ew-hide-forum": text = 'Forum'; break;
    case "ew-hide-about": text = 'About'; break;
    case "ew-hide-faq": text = 'FAQ'; break;
    case "ew-hide-stats": text = 'Stats'; break;
    default: return; // to not change anything, when some other setting was changed
  }

  if (state) {
    $("#nav ul a:contains('" + text + "')").parent().show();
  }
  else {
    $("#nav ul a:contains('" + text + "')").parent().hide();
  }
}

function changeHtml(selector, text) {
  let el = K.qS(selector);
  if (el) {
    el.childNodes[0].nodeValue = text;
  }
}


function compactOrExpandScoutsLog(state) {
  if (!K.gid('scoutsLogFloatingControls')) {
    return;
  }

  if (state) {
    K.gid('scoutsLogFloatingControls').style.width = 'auto';
    K.gid('scoutsLogFloatingControls').style.padding = '1px 2px 2px 2px';
    $('#scoutsLogFloatingControls a').css({
      'margin-right': 0,
      'vertical-align': 'top',
      'width': '15px'
    });
    $('#scoutsLogFloatingControls a span').css({
      'background-color': '#000',
      'padding': 0
    });
    changeHtml('.sl-cell-list', 'C');
    changeHtml('.sl-mystic', 'M');
    changeHtml('.sl-open', 'O');
    changeHtml('.sl-need-admin', 'A');
    changeHtml('.sl-need-scythe', 'S');
    changeHtml('.sl-watch', 'W');
    changeHtml('.sl-history', 'H');
    changeHtml('.sl-promotions', 'P');
    changeHtml('#sl-task-details', 'D');
    changeHtml('#sl-task-entry', 'N');
    K.qS('#scoutsLogFloatingControls img').style.display = 'none';
  }
  else {
    K.gid('scoutsLogFloatingControls').style.width = '';
    K.gid('scoutsLogFloatingControls').style.padding = '8px';
    $('#scoutsLogFloatingControls a').css({
      'margin-right': '8px',
      'vertical-align': 'top',
      'width': ''
    });
    $('#scoutsLogFloatingControls a span').css({
      'background-color': '#7a8288',
      'padding': '3px 7px'
    });
    changeHtml('.sl-cell-list', 'Cell List');
    changeHtml('.sl-mystic', 'Mystic ');
    changeHtml('.sl-open', 'Open Tasks ');
    changeHtml('.sl-need-admin', 'Need Admin ');
    changeHtml('.sl-need-scythe', 'Need Scythe ');
    changeHtml('.sl-watch', 'Watch ');
    changeHtml('.sl-history', 'History');
    changeHtml('.sl-promotions', 'Promotions');
    changeHtml('#sl-task-details', 'Cube Details ');
    changeHtml('#sl-task-entry', 'New Entry');
    K.qS('#scoutsLogFloatingControls img').style.display = '';
  }
}

  
// SETTINGS
var EwsSettings = function () {
  // var intv;
  var _this = this;
  var settings = {
    'ews-auto-refresh-showmeme': false,
    'ews-submit-using-spacebar': false,
    'ews-compact-scouts-log': false,
    'ew-hide-blog': true,
    'ew-hide-wiki': true,
    'ew-hide-forum': true,
    'ew-hide-about': true,
    'ew-hide-faq': true,
    'ew-hide-stats': true,
    'show-restore-seed-button': false,
    'show-remove-duplicate-segs-button': false,
    'show-dataset-borders-button': true,
    'dataset-borders-show-origin': true,
    'dataset-borders-show-during-play': true
  };

  var stored = K.ls.get('settings');
  if (stored) {
    $.extend(settings, JSON.parse(stored));
  }

  
  this.get = function(setting) {
    return settings[setting];
  };
  
  
  if (!K.gid('ews-settings-group')) {
    $('#settingsMenu').append(`
      <div id="ews-settings-group" class="settings-group ews-settings-group invisible">
        <h1>User Scripts Settings</h1>
      </div>
    `);
  }
  
  $('#settingsMenu').append(`
    <div id="ews-settings-group-top-buttons" class="settings-group ews-settings-group invisible">
      <h1>Top buttons</h1>
    </div>
  `);
  
  function add(name, id, target = '#ews-settings-group') {
    $(target).append(`
      <div class="setting utilities">
        <span>` + name + `</span>
        <div class="checkbox">
          <div class="checkbox-handle"></div>
          <input type="checkbox" id="` + id + `" style="display: none;">
        </div>
      </div>
    `);
  }
  
  function addIndented(name, id, target) {
    add(name, id, target);
    K.gid(id).parentNode.parentNode.style.marginLeft = '30px';
  }

  if (account.roles.scout || account.roles.scythe || account.roles.mystics || account.roles.admin) {
    add('Compact horizontal Scout\'s Log', 'ews-compact-scouts-log');
  }
  
  if (account.roles.scythe || account.roles.mystic || account.roles.admin) {
    add('Auto Refresh ShowMeMe', 'ews-auto-refresh-showmeme');
    add('Show Restore Seed button', 'show-restore-seed-button');
    add('Show Remove Dupes button', 'show-remove-duplicate-segs-button');
  }
  
  add('Show Dataset Borders button', 'show-dataset-borders-button');
  addIndented('Show origin', 'dataset-borders-show-origin');
  addIndented('Show during play/inspect', 'dataset-borders-show-during-play');

  add('Submit using Spacebar', 'ews-submit-using-spacebar');

  add('Blog', 'ew-hide-blog', '#ews-settings-group-top-buttons');
  add('Wiki', 'ew-hide-wiki', '#ews-settings-group-top-buttons');
  add('Forum', 'ew-hide-forum', '#ews-settings-group-top-buttons');
  add('About', 'ew-hide-about', '#ews-settings-group-top-buttons');
  add('FAQ', 'ew-hide-faq', '#ews-settings-group-top-buttons');

  if (K.gid('ewsLinkWrapper')) {
      add('Stats', 'ew-hide-stats', '#ews-settings-group-top-buttons');
  }

  this.set = function(setting, value) {
    settings[setting] = value;
    K.ls.set('settings', JSON.stringify(settings));
  };

  this.getAll = function () {
    return settings;
  };
  
  
// source: crazyman's script
  $('#ews-settings-group .utilities input, #ews-settings-group-top-buttons input').each(function() {
    var
      elem, pref, sets;

    elem = $(this);
    pref = this.id;
    sets = _this.getAll();

    this.checked = sets[pref];
    elem.add(elem.closest('.checkbox')).removeClass(sets[pref] ? 'off' : 'on').addClass(sets[pref] ? 'on' : 'off');
    $(document).trigger('ews-setting-changed', {setting: pref, state: sets[pref]});
  });

  $('#ews-settings-group .utilities input, #ews-settings-group-top-buttons input').closest('div.setting').click(function(evt) {
    var
      $elem, elem, newState;

    $elem = $(this).find('input');
    elem = $elem[0];
    newState = !elem.checked;

    evt.stopPropagation();

    elem.checked = newState;
    _this.set(elem.id, newState);
    $elem.add($elem.closest('.checkbox')).removeClass(newState ? 'off' : 'on').addClass(newState ? 'on' : 'off');
    $(document).trigger('ews-setting-changed', {setting: elem.id, state: newState});
  });
};

function setReapAuxButtonVisibility(id, state) {
  K.gid(id).style.visibility = state ? 'visible' : 'hidden';
}

K.injectJS(`
  $(window)
    .on('cell-info-ready', function (e, data) {
      $(document).trigger('cell-info-ready-triggered.utilities', data);
    })
    .on('cube-enter', function (e, data) {
      $(document).trigger('cube-enter-triggered.utilities', data);
    })
    .on('cube-leave', function (e, data) {
      $(document).trigger('cube-leave-triggered.utilities', data);
    });
  `);
  
$(document).on('cell-info-ready-triggered.utilities', toggleDatasetBordersVisibility);

$(document).on('cube-enter-triggered.utilities', function () {
  let settings = K.ls.get('settings');
  let showInCube = false;
  
  if (settings) {
    settings = JSON.parse(settings);
    showInCube = settings['dataset-borders-show-during-play'];
  }
  
  if (!showInCube) {
    removeDatasetBorders();
    removeDatasetOrigin();
  }
});

$(document).on('cube-leave-triggered.utilities', function () {
  let settings = K.ls.get('settings');
  let showInCube = false;

  if (settings) {
    settings = JSON.parse(settings);
    showInCube = settings['dataset-borders-show-during-play'];
  }
  
  // we only have to take care, when in-cube is turned off
  if (!showInCube) {
    toggleDatasetBordersVisibility();
  }
});

function toggleDatasetBordersVisibility() {
  let settings = K.ls.get('settings');
  let buttonState = K.ls.get('show-dataset-borders-state') === 'true';
  let showBorders = false;
  let showOrigin = false;
  let showDuringPlay = false;
  let gameMode = tomni.gameMode;

  if (settings) {
    settings = JSON.parse(settings);
    showBorders = settings['show-dataset-borders-button'];
    showOrigin = settings['dataset-borders-show-origin'];
    showDuringPlay = settings['dataset-borders-show-during-play'];
  }

  // borders should be shown only if:
  // the showButton option in Settings is true
  // the state of the button is true
  // we are not in gameMode or we are in gameMode and showDuringPlay option is true
  if (showBorders && buttonState &&
  (gameMode && showDuringPlay || !gameMode)) {
    addDatasetBorders();
    if (showOrigin) {
      addDatasetOrigin();
    }
  }
  else {
    removeDatasetBorders();
    removeDatasetOrigin();
  }
}

function createDatasetBordersCube(coords, filled = false) {
  let lengthX = coords.maxX - coords.minX;
  let lengthY = coords.maxY - coords.minY;
  let lengthZ = coords.maxZ - coords.minZ;

  let halfX = lengthX / 2;
  let halfY = lengthY / 2;
  let halfZ = lengthZ / 2;
  
  let material, cube;

  let box = new THREE.BoxGeometry(lengthX, lengthY, lengthZ);

  if (!filled) {
    let edges = new THREE.EdgesGeometry(box);
    material = new THREE.LineBasicMaterial({color: 0xffffff, linewidth: 1});
    cube = new THREE.LineSegments(edges, material);
  }
  else {
    material = new THREE.MeshBasicMaterial({color: 0xff9200});
    cube = new THREE.Mesh(box, material);
  }


  cube.position.set(coords.minX + halfX, coords.minY + halfY, coords.minZ + halfZ);
  
  return cube;
};

let datasetBordersE2198Cube = createDatasetBordersCube({
  minX: 466,  minY: 498,   minZ: 434,
  maxX: 4306, maxY: 20690, maxZ: 12786
});

let datasetBordersE2198OriginCube = createDatasetBordersCube({
  minX: 466,       minY: 498,       minZ: 434,
  maxX: 466 + 128, maxY: 498 + 128, maxZ: 434 + 128
}, true);

let datasetBordersZFishCube = createDatasetBordersCube({
  minX: 68800,  minY: 59840,  minZ: 737640,
  maxX: 423360, maxY: 230720, maxZ: 819000
});

let datasetBordersZFishOriginCube = createDatasetBordersCube({
  minX: 68800,        minY: 59840,        minZ: 737640,
  maxX: 68800 + 2560, maxY: 59840 + 2560, maxZ: 737640 + 2560
}, true);

function addDatasetBorders() {
  let dataset = (tomni && tomni.cell) ? tomni.getCurrentCell().info.dataset_id : 1;
  let world = tomni.threeD.getWorld();

  if (dataset === 1) {
    world.remove(datasetBordersZFishCube);
    world.add(datasetBordersE2198Cube);
  }
  else if (dataset === 11) {
    world.remove(datasetBordersE2198Cube);
    world.add(datasetBordersZFishCube);
  }

  tomni.threeD.render();
}

function removeDatasetBorders() {
  let world = tomni.threeD.getWorld();

  world.remove(datasetBordersE2198Cube);
  world.remove(datasetBordersZFishCube);

  tomni.threeD.render();
}

function addDatasetOrigin() {
  let dataset = (tomni && tomni.cell) ? tomni.getCurrentCell().info.dataset_id : 1;
  let world = tomni.threeD.getWorld();

  if (dataset === 1) {
    world.remove(datasetBordersZFishOriginCube);
    world.add(datasetBordersE2198OriginCube);
  }
  else if (dataset === 11) {
    world.remove(datasetBordersE2198OriginCube);
    world.add(datasetBordersZFishOriginCube);
  }

  tomni.threeD.render();
}

function removeDatasetOrigin() {
  let world = tomni.threeD.getWorld();

  world.remove(datasetBordersE2198OriginCube);
  world.remove(datasetBordersZFishOriginCube);

  tomni.threeD.render();
}

function setDatasetBorderButtonAndOptionsVisiblity(state) {
  let buttonState = K.ls.get('show-dataset-borders-state') === 'true';
  let settings = K.ls.get('settings');
  let originVisibility = false;
  
  if (settings) {
    settings = JSON.parse(settings);
    originVisibility = settings['dataset-borders-show-origin'];
  }

  if (state) {
    K.gid('dataset-borders-show-origin').parentNode.parentNode.style.display = 'flex';
    K.gid('dataset-borders-show-during-play').parentNode.parentNode.style.display = 'flex';
    if (tomni && tomni.cell && buttonState) {
      addDatasetBorders();
      if (originVisibility) {
        addDatasetOrigin();
      }
    }
  }
  else {
    K.gid('dataset-borders-show-origin').parentNode.parentNode.style.display = 'none';
    K.gid('dataset-borders-show-during-play').parentNode.parentNode.style.display = 'none';
    if (tomni && tomni.cell) {
      removeDatasetBorders();
      removeDatasetOrigin();
    }
  }
  
  let intv = setInterval(function () {
    if (!K.gid('show-dataset-borders')) {
      return;
    }
    clearInterval(intv);
    
    K.gid('show-dataset-borders').style.display = state ? 'inline-block' : 'none';
  }, 100);
}

function setDatasetOriginVisibility(state) {
  let buttonState = K.ls.get('show-dataset-borders-state') === 'true';
  let settings = K.ls.get('settings');
  let buttonVisibility = false;
  
  if (settings) {
    settings = JSON.parse(settings);
    buttonVisibility = settings['show-dataset-borders-button'];
  }

  if (tomni && tomni.cell) {
    if (state && buttonState && buttonVisibility) {
      addDatasetOrigin();
    }
    else {
      removeDatasetOrigin();
    }
  }
}

$(document).on('ews-setting-changed', function (evt, data) {
  switch (data.setting) {
    case 'ew-hide-blog':
    case 'ew-hide-about':
    case 'ew-hide-faq':
    case 'ew-hide-forum':
    case 'ew-hide-stats':
    case 'ew-hide-wiki':
      showOrHideButton(data.setting, data.state);
      break;
    case 'ews-compact-scouts-log':
      compactOrExpandScoutsLog(data.state);
      break;
    case 'show-restore-seed-button':
      setReapAuxButtonVisibility('ews-restore-seed-button', data.state);
      break;
    case 'show-remove-duplicate-segs-button':
      setReapAuxButtonVisibility('ews-remove-duplicates-button', data.state);
      break;
    case 'show-dataset-borders-button':
      setDatasetBorderButtonAndOptionsVisiblity(data.state);
      break;
    case 'dataset-borders-show-origin':
      setDatasetOriginVisibility(data.state);
      break;
    case 'dataset-borders-show-during-play':
      if (data.state) {
        toggleDatasetBordersVisibility();
      }
      else {
        removeDatasetBorders();
        removeDatasetOrigin();
      }
  }
});

let intv2 = setInterval(function () {
  if (!K.qS('.sl-cell-list')) {
    return;
  }
  clearInterval(intv2);
  let settings = K.ls.get('settings');
  if (settings) {
    settings = JSON.parse(settings);
    $(document).trigger('ews-setting-changed', {setting: 'ews-compact-scouts-log', state: settings['ews-compact-scouts-log']});
  }

}, 100);
// end: SETTINGS

$('#editActions').append('<button class="reapAuxButton" id="ews-restore-seed-button" title="Restore Seed Segments">RS</button>');
$('#editActions').append('<button class="reapAuxButton" id="ews-remove-duplicates-button" title="Remove Duplicate Segments">RD</button>');

$('#ews-restore-seed-button')
  .css({
    'color': 'white',
    'left': '50%',
    'position': 'absolute',
    'margin-top': 'auto',
    'margin-left': '270px'
  })
  .click(function () {
    tomni.f('select', {segids: tomni.task.seeds()});
  });

$('#ews-remove-duplicates-button')
  .css({
    'color': 'white',
    'left': '50%',
    'position': 'absolute',
    'margin-top': 'auto',
    'margin-left': '315px'
  })
  .click(function () {
    let dupes = tomni.task.duplicates;
    let dupeSegs = [];

    if (dupes && dupes[0]) {
      for (let i = 0; i < dupes.length; i++) {
        dupeSegs = dupeSegs.concat(dupes[i].duplicate_segs);
      }
    }

    if (dupeSegs) {
      tomni.f('deselect', {segids: dupeSegs});
    }
  });

let intv3 = setInterval(function () {
  if (!K.gid('gameTools')) {
    return;
  }
  
  clearInterval(intv3);

  $('#gameTools').prepend('<span id="show-dataset-borders"></span>');
  $('#show-dataset-borders').click(function () {
    let state = K.ls.get('show-dataset-borders-state') === 'true';
    K.ls.set('show-dataset-borders-state', !state);
    toggleDatasetBordersVisibility();
  });
}, 100);



if (LOCAL) {
  K.addCSSFile('http://127.0.0.1:8887/styles.css');
}
else {
  K.addCSSFile('https://chrisraven.github.io/EyeWire-Utilities/styles.css?v=1');
}


var settings = new EwsSettings();  


$(document).on('websocket-task-completions', function (event, data) {
  if (data.uid !== account.account.uid) {
    return;
  }

  var
    btn = $('.showmeme button');

  if (!btn.hasClass('on1') && settings.get('ews-auto-refresh-showmeme')) {
    if (btn.hasClass('on2')) {
      btn.click().click().click();
    }
    else {
      btn.click();

      setTimeout(function () {
        btn.click();
        setTimeout(function () {
          btn.click();
        }, 500);
      }, 500);
    }

  }
});

// submit using Spacebar
$('body').keydown(function (evt) {
  var
    btn;

  if (evt.keyCode === 32 && tomni.gameMode && settings.get('ews-submit-using-spacebar')) {
    if (!tomni.task.inspect) {
      btn = K.gid('actionGo');
    }
    else {
      if (account.roles.scythe || account.roles.mystic || account.roles.admin) {
        btn = K.gid('saveGT');
      }
      else {
        btn = K.gid('flagCube');
      }
    }

    if (btn) {
      evt.stopPropagation();
      btn.click();
    }
  }
});
// end: submit using Spacebar

// tu


} // end: main()



})(); // end: wrapper
