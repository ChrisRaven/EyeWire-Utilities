// ==UserScript==
// @name         Utilities
// @namespace    http://tampermonkey.net/
// @version      1.10.2.1
// @description  Utilities for EyeWire
// @author       Krzysztof Kruk
// @match        https://*.eyewire.org/*
// @exclude      https://*.eyewire.org/1.0/*
// @downloadURL  https://raw.githubusercontent.com/ChrisRaven/EyeWire-Utilities/master/utilities.user.js
// ==/UserScript==

/*jshint esversion: 6 */
/*globals $, account, tomni, THREE */ 

let LOCAL = false;
if (LOCAL) {
  console.log('%c--== TURN OFF "LOCAL" BEFORE RELEASING!!! ==--', "color: red; font-style: italic; font-weight: bold;");
}

(function() {
  'use strict';
  'esversion: 6';

  let K = {
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
      let
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

    injectCSS: function (rules) {
      let script = document.createElement('style');
      script.type = 'text/css';
      script.innerHTML = rules;
      let parent = document.body;
      parent.insertBefore(script, parent.childNodes[parent.childNodes.length]);
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


  function Settings() {
    let target;
    
    this.setTarget = function (selector) {
      target = selector;
    };
    
    this.getTarget = function () {
      return target;
    };
    
    this.addCategory = function (id = 'ews-utilities-settings-group', name = 'Utilities', mainTarget = 'settingsMenu') {
      if (!K.gid(id)) {
        $('#' + mainTarget).append(`
          <div id="${id}" class="settings-group ews-settings-group invisible">
            <h1>${name}</h1>
          </div>
        `);
      }
      
      this.setTarget($('#' + id));
    };

    this.addOption = function (options) {
      let settings = {
        name: '',
        id: '',
        defaultState: false,
        indented: false
      }

      $.extend(settings, options);
      let storedState = K.ls.get(settings.id);
      let state;

      if (storedState === null) {
        K.ls.set(settings.id, settings.defaultState);
        state = settings.defaultState;
      }
      else {
        state = storedState.toLowerCase() === 'true';
      }

      target.append(`
        <div class="setting" id="${settings.id}-wrapper">
          <span>${settings.name}</span>
          <div class="checkbox ${state ? 'on' : 'off'}">
            <div class="checkbox-handle"></div>
            <input type="checkbox" id="${settings.id}" style="display: none;" ${state ? ' checked' : ''}>
          </div>
        </div>
      `);
      
      if (settings.indented) {
        K.gid(settings.id).parentNode.parentNode.style.marginLeft = '30px';
      }
      
      $(`#${settings.id}-wrapper`).click(function (evt) {
        evt.stopPropagation();

        let $elem = $(this).find('input');
        let elem = $elem[0];
        let newState = !elem.checked;

        K.ls.set(settings.id, newState);
        elem.checked = newState;

        $elem.add($elem.closest('.checkbox')).removeClass(newState ? 'off' : 'on').addClass(newState ? 'on' : 'off');
        $(document).trigger('ews-setting-changed', {setting: settings.id, state: newState});
      });
      
      $(document).trigger('ews-setting-changed', {setting: settings.id, state: state});
    };
    
    this.getValue = function (optionId) {
      let val = K.ls.get(optionId);
      
      if (val === null) {
        return undefined;
      }
      if (val.toLowerCase() === 'true') {
        return true;
      }
      if (val.toLowerCase() === 'false') {
        return false;
      }

      return val;
    }
  }

  function moveToTopBar(text) {
    let el = $("#links a:contains('" + text + "')").parent();
    el.css('display', 'none');

    let container = $('#nav ul');

    if (!container.length) {
      $('#homelogo').after('<ul id="ews-nav-bar-container"></ul>');
      container = $('#nav ul');
    }

    if (el.length) {
      container.append(el);
    }
  }

  function moveToLinks(text) {
    let el = $("#ews-nav-bar-container a:contains('" + text + "')").parent();

    if (el.length) {
      el.css('display', 'list-item');
      $('#links li:last').before(el);
    }
  }

  // Top Buttons Hiding
  function showOrHideButton(pref, state) {
    let text = '';
    switch (pref) {
      case "hide-blog": text = 'Blog'; break;
      case "hide-wiki": text = 'Wiki'; break;
      case "hide-forum": text = 'Forum'; break;
      case "hide-about": text = 'About'; break;
      case "hide-faq": text = 'FAQ'; break;
      case "hide-stats": text = 'Stats'; break;
      default: return; // to not change anything, when some other setting was changed
    }

    
    if (state) {
      moveToTopBar(text);
    }
    else {
      moveToLinks(text);
    }
  }
  // END: Top Buttons Hiding


  // Compact Scouts' Log
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
  // END: Compact Scouts' Log


  // Remove Duplicate Segments and Regrow Seed buttons
  $('#editActions').append('<button class="reapAuxButton" id="ews-remove-duplicates-button" title="Remove Duplicate Segments">&nbsp;</button>');
  $('#editActions').append('<button class="reapAuxButton" id="ews-restore-seed-button" title="Regrow Seed">&nbsp;</button>');

  $('#ews-restore-seed-button')
    .css({
      'color': 'white',
      'left': '50%',
      'position': 'absolute',
      'margin-top': 'auto',
      'margin-left': '315px'
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
      'margin-left': '270px'
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


  function setReapAuxButtonVisibility(id, state) {
    K.gid(id).style.visibility = state ? 'visible' : 'hidden';
  }
  // END: Remove Duplicate Segments and Regrow Seed buttons


  // Datasets' Borders
  function toggleDatasetBordersVisibility() {
    let buttonState = K.ls.get('show-dataset-borders-state') === 'true';
    let showBorders = settings.getValue('show-dataset-borders-button');
    let showOrigin = settings.getValue('dataset-borders-show-origin');
    let showDuringPlay = settings.getValue('dataset-borders-show-during-play');
    let gameMode = tomni.gameMode;

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

  function setDatasetBorderButtonAndOptionsVisibility(state) {
    let buttonState = K.ls.get('show-dataset-borders-state') === null ? true : K.ls.get('show-dataset-borders-state') === 'true';
    let originVisibility = settings.getValue('dataset-borders-show-origin');

    
    let intv0 = setInterval(function () {
      if (!(K.gid('dataset-borders-show-origin'))) {
        return;
      }
      clearInterval(intv0);

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
    }, 100);
  }

  function setDatasetOriginVisibility(state) {
    let buttonState = K.ls.get('show-dataset-borders-state') === null ? true : K.ls.get('show-dataset-borders-state') === 'true';
    let buttonVisibility = settings.getValue('show-dataset-borders-button');

    if (tomni) {
      if (state && buttonState && buttonVisibility) {
        addDatasetOrigin();
      }
      else {
        removeDatasetOrigin();
      }
    }
  }

    
  $(document).on('cell-info-ready-triggered.utilities', toggleDatasetBordersVisibility);

  $(document).on('cube-enter-triggered.utilities', function () {
    let settings = K.ls.get('settings');
    let showInCube = false;
    
    if (settings) {
      settings = JSON.parse(settings);
      showInCube = settings['dataset-borders-show-during-play'] === undefined ? true : settings['dataset-borders-show-during-play'];
    }
    
    if (!showInCube) {
      removeDatasetBorders();
      removeDatasetOrigin();
    }
    
    let d = tomni.task.duplicates;
    setReapAuxButtonVisibility('ews-remove-duplicates-button', d && d[0] && d[0].duplicate_segs.length);
  });

  $(document).on('cube-leave-triggered.utilities', function () {
    let settings = K.ls.get('settings');
    let showInCube = false;

    if (settings) {
      settings = JSON.parse(settings);
      showInCube = settings['dataset-borders-show-during-play'] === undefined ? true : settings['dataset-borders-show-during-play'];
    }
    
    // we only have to take care, when in-cube is turned off
    if (!showInCube) {
      toggleDatasetBordersVisibility();
    }
  });
  // END: Datasets' Borders


  // Scouts' Log should be compacted only when it's already visible
  let intv2 = setInterval(function () {
    if (!K.qS('.sl-cell-list')) {
      return;
    }
    clearInterval(intv2);

    $(document).trigger('ews-setting-changed', {
      setting: 'compact-scouts-log',
      state: settings.getValue('compact-scouts-log')
    });
    
      // stop leaking of shortcuts from SL
    $('#slPanel').on('keyup', '#sl-action-notes', function (evt) {//console.log(evt.which)
      if ([71, 84, 48, 49, 50, 51, 52, 53, 54].includes(evt.which)) {
        /*
          71 = g, G - go in and out of cube using "G"
          84 = t, T - custom highlight color change
          48 .. 54 = 0 .. 6 - heatmaps changing
        */
        evt.stopPropagation();
      }
    });

  }, 100);

  
  let cubeStatus;

  function createAdditionalSLButtons() {
    let html = `
      <div id="ewSLnub" title = "nub">N</div>
      <div id="ewSLbranch" title="branch">B</div>
      <div id="ewSLdust" title="dust">d</div>
      <div id="ewSLduplicate" title="duplicate">D</div>
      <div id="ewSLmerger" title="merger">M</div>
      <div id="ewSLAImerger" title="AI merger">A</div>
      <div id="ewSLtestExtension" title="Watch / Test Extension">W</div>
      <div id="ewSLwrongSeedMerger" title="Wrong Seed Merger">S</div>
    `;

    let div = document.createElement('div');
    div.id = 'ewSLbuttonsWrapper';
    div.innerHTML = html;

    K.gid('scoutsLogFloatingControls').appendChild(div);

    K.gid('ewSLbuttonsWrapper').style.display = settings.getValue('show-sl-shortcuts') ? 'inline-block' : 'none';

    $('#ewSLbuttonsWrapper').on('click', 'div', function () {
      let target = tomni.getTarget();

      if (!target) {
        return;
      }

      cubeStatus = {
        cell: tomni.getCurrentCell().cellid,
        task: target[0].id,
        reaped: true,
      };

      switch(this.id)  {
        case 'ewSLnub':
          cubeStatus.status = 'good';
          cubeStatus.issue = '';
          cubeStatus.notes = 'nub added';
          break;
        case 'ewSLbranch':
          cubeStatus.status = 'good';
          cubeStatus.issue = '';
          cubeStatus.notes = 'branch added';
          break;
        case 'ewSLdust':
          cubeStatus.status = 'good';
          cubeStatus.issue = '';
          cubeStatus.notes = 'dust added';
          break;
        case 'ewSLduplicate':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'duplicate';
          cubeStatus.notes = '';
          break;
        case 'ewSLmerger':
          cubeStatus.status = 'good';
          cubeStatus.issue = '';
          cubeStatus.notes = 'merger removed';
          break;
        case 'ewSLAImerger':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'ai-merger';
          cubeStatus.notes = '';
          break;
        case 'ewSLtestExtension':
          cubeStatus.status = 'watch';
          cubeStatus.issue = 'test';
          cubeStatus.notes = '';
          break;
        case 'ewSLwrongSeedMerger':
          cubeStatus.status = 'good';
          cubeStatus.issue = 'wrong-seed';
          cubeStatus.notes = '';
      }

      captureImage();
    });
  }

  // we have to wait for the bottom-right corner icons to be added to the page
  let intv3 = setInterval(function () {
    if (!K.gid('gameTools')) {
      return;
    }

    if (account.can('scout scythe mystic admin') && !K.gid('scoutsLogButton')) {
      return;
    }

    // sometimes the main() function isn't run yet, so the settings object isn't initiated,
    // and the SL buttons aren't set correctly
    if (typeof settings === 'undefined') {
      return;
    }

    clearInterval(intv3);

    $('#gameTools').prepend('<span id="show-dataset-borders" title="Show/hide dataset borders"></span>');
    let state = K.ls.get('show-dataset-borders-state');
    if (state === undefined) {
      K.ls.set('show-dataset-borders-state', true);
    }

    switchSLButtons(settings.getValue('switch-sl-buttons'));

    $('#show-dataset-borders').click(function () {
      let state = K.ls.get('show-dataset-borders-state') === 'true';
      K.ls.set('show-dataset-borders-state', !state);
      toggleDatasetBordersVisibility();
    });
  }, 50);

  let intv4 = setInterval(function () {
    if (!account.can('scythe mystic admin')) {
      return;
    }

    if (!K.gid('scoutsLogFloatingControls')) {
      return;
    }

    clearInterval(intv4);

    createAdditionalSLButtons();

  }, 50);




  // autorefresh show-me-me
  $(document).on('websocket-task-completions', function (event, data) {
    if (data.uid !== account.account.uid) {
      return;
    }

    let
      btn = $('.showmeme button');

    if (!btn.hasClass('on1') && settings.getValue('auto-refresh-showmeme')) {
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
  // END:  autorefresh show-me-me

  // submit using Spacebar
  $('body').keydown(function (evt) {
    let btn;
    let submit = settings.getValue('submit-using-spacebar');
    let turnOffZoom = settings.getValue('turn-off-zoom-by-spacebar');

    if (evt.keyCode === 32 && tomni.gameMode && (submit || turnOffZoom)) {
      evt.stopPropagation();
      
      if (turnOffZoom && !submit) {
        return;
      }

      if (!tomni.task.inspect) {
        btn = K.gid('actionGo');
      }
      else {
        if (account.can('scythe mystic admin')) {
          btn = K.gid('saveGT');
        }
        else {
          btn = K.gid('flagCube');
        }
      }

      if (btn) {
        btn.click();
      }
    }
  });
  // END: submit using Spacebar


  function arrayOfColorsToRGBa(arr) {
    return 'rgba(' + arr.join(',') + ')';
  }

  // source: http://jsfiddle.net/User9673/J5d7h/
  function makeTextSprite(text, params) {
    let font = 'Arial';
    let size = 96;
    let textColor = [255, 255, 255, 1.0];

    font = 'bold ' + size + 'px ' + font;

    let canvas = document.createElement('canvas');
    let context = canvas.getContext('2d');
    context.font = font;

    // get size data (height depends only on font size)
    let metrics = context.measureText(text);
    let textWidth = metrics.width;

    canvas.width = textWidth;
    canvas.height = size - 15;

    context.font = font;
    context.fillStyle = arrayOfColorsToRGBa(textColor);
    context.fillText(text, 0, size - 20);

    // canvas contents will be used for a texture
    let texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;

    let mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(canvas.width, canvas.height),
        new THREE.MeshBasicMaterial({
            map: texture,
            side: THREE.DoubleSide,
            transparent: true
        })
    );
    
    let datasetId = tomni.getCurrentCell().info.dataset_id;
    if (datasetId === 1) {
      mesh.scale.set(0.25, 0.25, 1);
    }
    else if (datasetId === 11) {
      mesh.scale.set(5, 5, 1);
    }

    mesh.name = text;

    mesh.rotateY(Math.PI);
    mesh.rotateZ(-Math.PI / 2);

    return mesh;
}

  function addText(text, x, y, z) {
    let sprite = makeTextSprite(text);
    sprite.position.set(x, y, z);
    return sprite;
  }

  
  
  function showNeighboursIDs() {
    fetch('/1.0/cell/' + tomni.cell + '/tasks')
      .then((response) => { return response.json(); })
      .then((json) => {
        let children = tomni.task.children;
        let tasks = json.tasks;
        let neighbours = tasks.filter((task) => { return children.indexOf(task.id) !== -1; });
        let cell = tomni.getCurrentCell();
        let voxels = cell.world.volumes.voxels;
        let categorized = {lowX: [], lowY: [], lowZ: [], highX: [], highY: [], highZ: []};
        let shift;
        let world = tomni.threeD.getWorld();
        let group = new THREE.Group();
        group.name = 'neighbours';
        let tb = tomni.task.bounds;

        function categorizeEW(child) {
          let shift = 30;

          let cb = child.bounds;
          if (tb.min.x > cb.min.x) {
            group.add(addText(child.id, tb.min.x - voxels.x / 4 - categorized.lowX.length * shift, tb.min.y + voxels.y / 2, tb.min.z + voxels.z / 2));
            categorized.lowX.push(child.id);
          }
          else if (tb.max.x < cb.max.x) {
            group.add(addText(child.id, tb.max.x + voxels.x / 4 - categorized.highX.length * shift, tb.min.y + voxels.y / 2, tb.min.z + voxels.z / 2));
            categorized.highX.push(child.id);
          }
          else if (tb.min.y > cb.min.y) {
            group.add(addText(child.id, tb.min.x + voxels.x / 2 - categorized.lowY.length * shift, tb.min.y - voxels.y / 4, tb.min.z + voxels.z / 2));
            categorized.lowY.push(child.id);
          }
          else if (tb.max.y < cb.max.y) {
            group.add(addText(child.id, tb.min.x + voxels.x / 2 - categorized.highY.length * shift, tb.max.y + voxels.y / 4, tb.min.z + voxels.z / 2));
            categorized.highY.push(child.id);
          }
          else if (tb.min.z > cb.min.z) {
            group.add(addText(child.id, tb.min.x + voxels.x / 2 - categorized.lowZ.length * shift, tb.min.y + voxels.y / 2, tb.min.z - voxels.z / 4));
            categorized.lowZ.push(child.id);
          }
          else if (tb.max.z < cb.max.z) {
            group.add(addText(child.id, tb.min.x + voxels.x / 2 - categorized.highZ.length * shift, tb.min.y + voxels.y / 2, tb.max.z + voxels.z / 4));
            categorized.highZ.push(child.id);
          }
        }

        function categorizeZF(child) {
          let shift = 500;

          let cb = child.bounds;
          if (tb.min.x > cb.min.x) {
            group.add(addText(child.id, tb.min.x - voxels.x - categorized.lowX.length * shift, tb.min.y + voxels.y * 2.5, tb.min.z + voxels.z * 25));
            categorized.lowX.push(child.id);
          }
          else if (tb.max.x < cb.max.x) {
            group.add(addText(child.id, tb.max.x + voxels.x - categorized.highX.length * shift, tb.min.y + voxels.y * 2.5, tb.min.z + voxels.z * 25));
            categorized.highX.push(child.id);
          }
          else if (tb.min.y > cb.min.y) {
            group.add(addText(child.id, tb.min.x + voxels.x * 2.5 - categorized.lowY.length * shift, tb.min.y - voxels.y, tb.min.z + voxels.z * 25));
            categorized.lowY.push(child.id);
          }
          else if (tb.max.y < cb.max.y) {
            group.add(addText(child.id, tb.min.x + voxels.x * 2.5 - categorized.highY.length * shift, tb.max.y + voxels.y, tb.min.z + voxels.z * 25));
            categorized.highY.push(child.id);
          }
          else if (tb.min.z > cb.min.z) {
            group.add(addText(child.id, tb.min.x + voxels.x * 2.5 - categorized.lowZ.length * shift, tb.min.y + voxels.y * 2.5, tb.min.z - voxels.z));
            categorized.lowZ.push(child.id);
          }
          else if (tb.max.z < cb.max.z) {
            group.add(addText(child.id, tb.min.x + voxels.x * 2.5 - categorized.highZ.length * shift, tb.min.y + voxels.y * 2.5, tb.max.z + voxels.z));
            categorized.highZ.push(child.id);
          }
        }

        world.add(group);

        let datasetId = cell.info.dataset_id;
        if (datasetId === 1) {
          neighbours.forEach(categorizeEW);
        }
        else if (datasetId === 11) {
          neighbours.forEach(categorizeZF);
        }
      });
  }


  let mouse = new THREE.Vector2();
  let onClickPosition = new THREE.Vector2();
  let raycaster = new THREE.Raycaster();
  let camera = tomni.threeD.getCamera();

  let getMousePosition = function (dom, x, y) {
    let rect = dom.getBoundingClientRect();
    return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
  };

  let getIntersects = function (point, objects) {
    mouse.set((point.x * 2) - 1, - (point.y * 2) + 1);
    raycaster.setFromCamera(mouse, camera);
    return raycaster.intersectObjects(objects);
  };

  function hideNeighboursIDs() {
    let world = tomni.threeD.getWorld();
    let neighbours = world.getObjectByName('neighbours');
    if (neighbours) {
      world.remove(neighbours);
    }
  }

  document.addEventListener('dblclick', function (event) {
    if (!settings.getValue('show-childrens-ids')) {
      return;
    }

    let world = tomni.threeD.getWorld();
    let container = document.getElementById('threeD');
    let array = getMousePosition(container, event.clientX, event.clientY);
    onClickPosition.fromArray(array);
    let neighbours = world.getObjectByName('neighbours');
    if (neighbours) {
      let intersects = getIntersects(onClickPosition, neighbours.children);
      if (intersects.length) {
        tomni.taskManager.getTask({ 
          task: intersects[0].object.name,
          orientation: null,
          inspect: true
        });
      }
    }
  }, false);


  // source: https://stackoverflow.com/a/30810322
  function copyTextToClipboard(text) {
    let textArea = document.createElement("textarea");
  
    //
    // *** This styling is an extra step which is likely not required. ***
    //
    // Why is it here? To ensure:
    // 1. the element is able to have focus and selection.
    // 2. if element was to flash render it has minimal visual impact.
    // 3. less flakyness with selection and copying which **might** occur if
    //    the textarea element is not visible.
    //
    // The likelihood is the element won't even render, not even a flash,
    // so some of these are just precautions. However in IE the element
    // is visible whilst the popup box asking the user for permission for
    // the web page to copy to the clipboard.
    //
  
    // Place in top-left corner of screen regardless of scroll position.
    textArea.style.position = 'fixed';
    textArea.style.top = 0;
    textArea.style.left = 0;
  
    // Ensure it has a small width and height. Setting to 1px / 1em
    // doesn't work as this gives a negative w/h on some browsers.
    textArea.style.width = '2em';
    textArea.style.height = '2em';
  
    // We don't need padding, reducing the size if it does flash render.
    textArea.style.padding = 0;
  
    // Clean up any borders.
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
  
    // Avoid flash of white box if rendered for any reason.
    textArea.style.background = 'transparent';
  
  
    textArea.value = text;
  
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let successful = document.execCommand('copy');

    document.body.removeChild(textArea);
  }

  $(document).click(function (event) {
    if (!settings || !settings.getValue('show-childrens-ids')) {
      return;
    }

    if (!event.shiftKey) {
      return;
    }

    let world = tomni.threeD.getWorld();
    let container = document.getElementById('threeD');
    let array = getMousePosition(container, event.clientX, event.clientY);
    onClickPosition.fromArray(array);
    let neighbours = world.getObjectByName('neighbours');
    if (neighbours) {
      let intersects = getIntersects(onClickPosition, neighbours.children);
      if (intersects.length) {
        copyTextToClipboard(intersects[0].object.name);
      }
    }
  });

  // "cube-enter-triggered", because when jumping between relatives, the "cube-leave-triggered" isn't triggered
  $(document).on('cube-enter-triggered.utilities cube-leave-triggered.utilities', function () {
    hideNeighboursIDs();
  });


  $('#showChildren').click(function () {
    if (!settings.getValue('show-childrens-ids')) {
      return;
    }

    // ideally, it should be negated, but in reality, it always has the older value at the moment of clicking
    if (tomni.visRelatives.children) {
      showNeighboursIDs();
    }
    else {
      hideNeighboursIDs();
    }
  });


  function moveFreeToTheLeftOfHighlight(state) {
    if (state) {
      $('#cubeInspectorFloatingControls .controls').prepend($('.control.freeze'));
    }
    else {
      $('.control.complete').before($('.control.freeze'));
    }
  }
  
  
  function switchSLButtons(state) {
    if (state) {
      $('#settingsButton').before($('#scoutsLogButton'));
    }
    else {
      $('#settingsButton').before($('#inspectPanelButton'));
    }
  }

  function parseTransform(t) {
    let e = t.match(/([0-9\.]+)/g),
      a = {
        x: e[4],
        y: e[5]
      },
      s = 0,
      n = {
        x: 1,
        y: 1
      },
      l = {
        x: 0,
        y: 0
      },
      i = e[0] * e[3] - e[1] * e[2];

    if (e[0] || e[1]) {
      let o = Math.sqrt(e[0] * e[0] + e[1] * e[1]);
      s = e[1] > 0 ? Math.acos(e[0] / o) : -Math.acos(e[0] / o), n = {
        x: o,
        y: i / o
      }, l.x = Math.atan((e[0] * e[2] + e[1] * e[3]) / (o * o))
    }
    else if (e[2] || e[3]) {
      let r = Math.sqrt(e[2] * e[2] + e[3] * e[3]);
      s = .5 * Math.pi - (e[3] > 0 ? Math.acos(-e[2] / r) : -Math.acos(e[2] / r)), n = {
        x: i / r,
        y: r
      }, l.y = Math.atan((e[0] * e[2] + e[1] * e[3]) / (r * r))
    }
    else n = {
      x: 0,
      y: 0
    }

    return {
      scale: n,
      translate: a,
      rotation: s,
      skew: l
    }
  }

  function fileRequest(url, data, file, callback) {
    let form = new FormData;
    if (data) {
      for (let i in data) {
        form.append(i, data[i]);
      }
    }
        
    if (file) {
      for (let o in file) {
        let binaryFile = new Blob([file[o].data], { type: file[o].type });
        form.append(file[o].name, binaryFile, file[o].filename)
      }
    }

    
    K.gid('ewSLbuttonsWrapper').style.borderRightStyle = 'solid';
    let request = new XMLHttpRequest;
    request.open("POST", url, true);
    request.withCredentials = true;
    request.onreadystatechange = function() {
      K.gid('ewSLbuttonsWrapper').style.borderRightStyle = 'none';

      if (4 == this.readyState && 200 == this.status) {
        let response = JSON.parse(this.responseText);
        if (response.error) {
          console.log('Scouts\' Log error');
        }
        else {
          callback(response);
        }
      }
      if (4 == this.readyState && 200 != this.status) {
        console.log('Scouts\' Log error');
      }
    };
    request.send(form);
  }

  function captureImage() {
    let cellId = tomni.getCurrentCell().id;
    let taskId = tomni.getTarget()[0].id;
    let userName = account.account.username;

    if ($('#threeDCanvas').length) {
      tomni.threeD.render();
    }

    if ($('#twoD').length && tomni.gameMode) {
      tomni.twoD.render();
    }
    
    let threeDCanvas = $('#threeDCanvas')[0];
    let scr = document.createElement('canvas');
    scr.height = threeDCanvas.height;
    scr.width = threeDCanvas.width;
    let scrCtx = scr.getContext('2d');

    scrCtx.imageSmoothingEnabled = false;
    scrCtx.beginPath();
    scrCtx.rect(0, 0, threeDCanvas.width, threeDCanvas.height);
    scrCtx.fillStyle = '#232323';
    scrCtx.fill();

    let twoDCanvas = $('#twoD')[0];
    if (twoDCanvas && tomni.gameMode) {
    let twoDParent = $('#twoD').parent()[0],
      minX = Math.floor((threeDCanvas.width - twoDParent.clientWidth) / 2),
      maxX = Math.floor(threeDCanvas.width / 2);
    scrCtx.drawImage(threeDCanvas, minX, 0, maxX, threeDCanvas.height, 0, 0, maxX, threeDCanvas.height);
    let g = parseTransform($(twoDCanvas).css('transform')),
      m = parseFloat($(twoDCanvas).css('left')),
      p = -1 * parseFloat($(twoDCanvas).css('bottom')),
      h = {
        x: 0,
        y: 0
      },
      threeDCanvasDims = {
        x: maxX,
        y: threeDCanvas.height
      },
      b = {
        x: (maxX - twoDCanvas.width * g.scale.x) / 2 + m,
        y: (threeDCanvas.height - twoDCanvas.height * g.scale.y) / 2 + p
      },
      twoDCanvasDims = {
        x: b.x + twoDCanvas.width * g.scale.x,
        y: b.y + twoDCanvas.height * g.scale.y
      },
      Q = {
        x: Math.max(h.x, b.x),
        y: Math.max(h.y, b.y)
      },
      v = {
        x: Math.min(threeDCanvasDims.x, twoDCanvasDims.x),
        y: Math.min(threeDCanvasDims.y, twoDCanvasDims.y)
      },
      S = {
        x: b.x < Q.x ? Math.abs(Q.x - b.x) / g.scale.x < 0 ? 0 : Math.abs(Q.x - b.x) / g.scale.x > twoDCanvas.width ? twoDCanvas.width - 1 : Math.abs(Q.x - b.x) / g.scale.x : 0,
        y: b.y < Q.y ? Math.abs(Q.y - b.y) / g.scale.y < 0 ? 0 : Math.abs(Q.y - b.y) / g.scale.y > twoDCanvas.height ? twoDCanvas.height - 1 : Math.abs(Q.y - b.y) / g.scale.y : 0,
        w: Math.abs((v.x - Q.x) / g.scale.x),
        h: Math.abs((v.y - Q.y) / g.scale.y)
      };
    scrCtx.drawImage(twoDCanvas, S.x, S.y, S.w, S.h, maxX + Q.x, Q.y, v.x - Q.x, v.y - Q.y);
    scrCtx.beginPath();
    scrCtx.setLineDash([3, 3]);
    scrCtx.moveTo(maxX + .5, 0);
    scrCtx.lineTo(maxX + .5, threeDCanvas.height);
    scrCtx.lineWidth = 1;
    scrCtx.strokeStyle = '#888';
    scrCtx.stroke();
    scrCtx.beginPath();
    scrCtx.rect(5, 5, 300, 88);
    scrCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    scrCtx.fill();

    let w = tomni.twoD.axis;
    scrCtx.font = 'normal 10pt sans-serif';
    scrCtx.fillStyle = '#bbb';
    scrCtx.fillText('Cell: ' + cellId, 10, 23);
    scrCtx.fillText('Cube: ' + taskId, 10, 43);
    scrCtx.fillText('Plane: ' + w, 10, 63);
    scrCtx.fillText('User: ' + userName, 10, 83);
  }
  else {
    scrCtx.drawImage(threeDCanvas, 0, 0);
    scrCtx.beginPath();
    scrCtx.rect(5, 5, 300, 48);
    scrCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    scrCtx.fill();
    scrCtx.font = 'normal 10pt sans-serif';
    scrCtx.fillStyle = '#bbb';
    scrCtx.fillText('Cell: ' + cellId, 10, 23);
    scrCtx.fillText('User: ' + userName, 10, 43);
  }

  let k = "https://scoutslog.org/1.1/";
  let s = scr.toDataURL('image/png');
  let n = atob(s.split(",")[1]);

  
  let l = s.split(",")[0].split(":")[1].split(";")[0];
  let i = new ArrayBuffer(n.length);
  let o = new Uint8Array(i);

  for (let r = 0; r < n.length; r++) {
    o[r] = n.charCodeAt(r);
  }
  fileRequest(k + "task/" + encodeURIComponent(taskId) + "/action/create/upload", {
    data: JSON.stringify(cubeStatus)
  }, [{
    name: "image",
    filename: "capture.png",
    type: l,
    data: i
  }], function () {
    console.log('success');
  })

};

// https://scoutslog.org/1.1/task/3271748/action/create/upload
// <input type="hidden" id="sl-action-image" name="image-data" value="" />


  $(document).on('ews-setting-changed', function (evt, data) {
    switch (data.setting) {
      case 'hide-blog':
      case 'hide-about':
      case 'hide-faq':
      case 'hide-forum':
      case 'hide-stats':
      case 'hide-wiki':
        showOrHideButton(data.setting, data.state);
        break;
      case 'compact-scouts-log':
        compactOrExpandScoutsLog(data.state);
        break;
      case 'show-restore-seed-button':
        setReapAuxButtonVisibility('ews-restore-seed-button', data.state);
        break;
      case 'show-remove-duplicate-segs-button':
        setReapAuxButtonVisibility('ews-remove-duplicates-button', data.state);
        break;
      case 'show-dataset-borders-button':
        setDatasetBorderButtonAndOptionsVisibility(data.state);
        break;
      case 'dataset-borders-show-origin':
        setDatasetOriginVisibility(data.state);
        break;
      case 'dataset-borders-show-during-play':
        if (data.state) {
          toggleDatasetBordersVisibility();
        }
        else if (tomni.gameMode) {
          removeDatasetBorders();
          removeDatasetOrigin();
        }
        break;
      case 'move-freeze-to-the-left-of-highlight':
        moveFreeToTheLeftOfHighlight(data.state);
        break;
      case 'switch-sl-buttons':
        switchSLButtons(data.state);
        break;
      case 'show-childrens-ids':
        if (tomni.getMode && tomni.visRelatives.children && data.state) {
          showNeighboursIDs();
        }
        else {
          hideNeighboursIDs();
        }
        break;
      case 'show-sl-shortcuts':
        if (K.gid('ewSLbuttonsWrapper')) {
          K.gid('ewSLbuttonsWrapper').style.display = data.state ? 'inline-block' : 'none';
        }
        break;
    }
  });


  let settings;
  let accordionApplied = false;

  function main() {
      
    if (!K.ls.get('utilities-settings-2018-03-27-update')) {
      let props = K.ls.get('settings');
      if (props) {
        props = JSON.parse(props);
        Object.keys(props).forEach(function (key, index) {
          if (key.indexOf('ews-') === 0) {
            K.ls.set(key.slice(4), props[key]);
          }
          else if (key.indexOf('ew-') === 0) {
            K.ls.set(key.slice(3), props[key]);
          }
          else {
            K.ls.set(key, props[key]);
          }
        });
        K.ls.remove('settings');
      }

      K.ls.set('utilities-settings-2018-03-27-update', true);
    }
    
    
    if (LOCAL) {
      K.addCSSFile('http://127.0.0.1:8887/styles.css');
    }
    else {
      K.addCSSFile('https://chrisraven.github.io/EyeWire-Utilities/styles.css?v=4');
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

      
    settings =  new Settings();
    settings.addCategory();
    
    if (account.can('scout scythe mystics admin')) {
      settings.addOption({
        name: 'Compact horizontal Scout\'s Log',
        id: 'compact-scouts-log'
      });
    }
    
    if (account.can('scythe mystic admin')) {
      settings.addOption({
        name: 'Auto Refresh ShowMeMe',
        id: 'auto-refresh-showmeme'
      });
      settings.addOption({
        name: 'Show Regrow Seed button',
        id: 'show-restore-seed-button'
      });
      settings.addOption({
        name: 'Show Remove Dupes button',
        id: 'show-remove-duplicate-segs-button'
      });
      settings.addOption({
        name: 'Scouts\' Log shortcuts',
        id: 'show-sl-shortcuts',
        defaultState: true
      });
    }
    
    settings.addOption({
      name: 'Show Dataset Borders button',
      id: 'show-dataset-borders-button',
      defaultState: false
    });
      settings.addOption({
        name: 'Show origin',
        id: 'dataset-borders-show-origin',
        defaultState: true,
        indented: true
      });
      settings.addOption({
        name: 'Show during play/inspect',
        id: 'dataset-borders-show-during-play',
        defaultState: true,
        indented: true
      });
    settings.addOption({
      name: 'Submit using Spacebar',
      id: 'submit-using-spacebar'
    });
    settings.addOption({
      name: 'Don\'t rotate OV while in cube',
      id: 'dont-rotate-ov-while-in-cube'
    });
    if (account.can('scout scythe mystic admin')) {
      settings.addOption({
        name: 'Show children\'s IDs',
        id: 'show-childrens-ids'
      });
    }

    settings.getTarget().append('<div class="setting"><div class="minimalButton" id="ews-additional-options">Additional Options</div></div>');
    
    settings.addCategory('ews-utilities-top-buttons-settings-group', 'Top buttons');
    settings.addOption({
      name: 'Blog',
      id: 'hide-blog'
    });
    settings.addOption({
      name: 'Wiki',
      id: 'hide-wiki'
    });
    settings.addOption({
      name: 'Forum',
      id: 'hide-forum'
    });
    settings.addOption({
      name: 'About',
      id: 'hide-about'
    });
    settings.addOption({
      name: 'FAQ',
      id: 'hide-faq'
    });
    if (K.gid('ewsLinkWrapper')) {
      settings.addOption({
        name: 'Stats',
        id: 'hide-stats'
      });
    }

    
    $('body').append('<div class="help-menu black more" id="ews-additional-options-popup"></div>');
    
    settings.addCategory('ews-additional-options-category', 'Additional Options', 'ews-additional-options-popup');
    settings.addOption({
      name: 'Turn off zooming using Spacebar',
      id: 'turn-off-zoom-by-spacebar'
    });
    if (account.can('scout scythe mystic admin')) {
      settings.addOption({
        name: 'Go in and out of cube using "G"',
        id: 'go-in-and-out-of-cube-using-g'
      });
      settings.addOption({
        name: 'Switch SL buttons',
        id: 'switch-sl-buttons'
      });
    }
    if (account.can('scythe mystic admin')) {
      settings.addOption({
        name: 'Move Freeze to the left of Highlight',
        id: 'move-freeze-to-the-left-of-highlight'
      });
    }
    
    let popupStatus = 'closed';
    
    $('#ews-additional-options').click(function () {
      let popup = K.gid('ews-additional-options-popup');
      popup.style.display = 'block';

      let windowWidth = $(window).width();
      let windowHeight = $(window).height();
      let popupWidth = parseInt(popup.clientWidth, 10);
      let popupHeight = parseInt(popup.clientHeight, 10);

      popup.style.left = (windowWidth / 2 - popupWidth / 2) + 'px';
      popup.style.top = (windowHeight / 2 - popupHeight / 2) + 'px';
      
      popupStatus = 'opened';
    });
    
    $(document).click(function (evt) {
      if (evt.target.id !== 'ews-additional-options-popup' && popupStatus === 'opened') {
        K.gid('ews-additional-options-popup').style.display = 'none';
        popupStatus = 'closed';
      }
    });

    if (account.can('scout scythe mystic admin')) {
      $(document).keyup(function (evt) {
        if (evt.which !== 71) {
          return;
        }

        if (settings.getValue('go-in-and-out-of-cube-using-g')) {
          if (tomni.gameMode) {
            tomni.leave();
          }
          else if (tomni.getTarget() !== null) {
            tomni.play({inspect: tomni.getTarget()[0].id});
          }
        }
      });
    }

  }


  $('#settingsButton').click(function () {
    $('#settingsMenu')
      .addClass('more')
      .trigger('resize');

    if (!accordionApplied) {
      accordionApplied = true;

      $('.settings-group, .sl-setting-group').each(function () {
        $(this).children().first().unwrap();
      });

      K.qSa('#settingsMenu h1').forEach(function (el) {
        let newElement = document.createElement('div');
        el.parentNode.insertBefore(newElement, el.nextElementSibling);
        let cursor = el.nextElementSibling.nextElementSibling;
        while (cursor && cursor.tagName === 'DIV') {
          newElement.appendChild(cursor);
          cursor = el.nextElementSibling.nextElementSibling; // previous element from this position was moved, so the same path will guide to the next el
        }
      });

      $('#settingsMenu').accordion({
        header: 'h1',
        heightStyle: 'content'
      });

      let trackerWindowSliderTitle = K.gid('activityTrackerWindowSlider').previousElementSibling;
      trackerWindowSliderTitle.style.marginLeft = '30px';
      trackerWindowSliderTitle.innerHTML = 'Visible cubes';

      let parent = trackerWindowSliderTitle.parentNode;
      parent.style.display = 'block';

      let newTitle = document.createElement('div');
      newTitle.innerHTML = 'Activity Tracker';
      newTitle.style.fontWeight = '800';
      newTitle.style.marginBottom = '15px';
      trackerWindowSliderTitle.parentElement.insertBefore(newTitle, trackerWindowSliderTitle);
      
      let trackerJumpSettingTitle = K.gid('atOverviewJumpSetting');
      trackerJumpSettingTitle.style.display = 'block';
      trackerJumpSettingTitle.style.paddingRight = '0';
      let span = trackerJumpSettingTitle.getElementsByTagName('span')[0];
      span.style.marginLeft = '30px';
      span.style.marginRight = '65px';
      span.innerHTML = 'Jump to:';

      let slider = K.qS('#atOverviewJumpSetting div.checkbox');
      slider.style.display = 'inline-block';
      slider.style.float = 'none';
      slider.style.verticalAlign = 'bottom';
      slider.style.marginLeft = '15px';
      slider.style.marginRight = '15px';

      let before = document.createElement('span');
      before.style.fontSize = '9px';
      before.innerHTML = 'In Cube';
      slider.parentElement.insertBefore(before, slider);

      let after = document.createElement('span');
      after.style.fontSize = '9px';
      after.style.marginRight = '15px';
      after.innerHTML = 'Overview';
      slider.parentElement.insertBefore(after, slider.nextSibling);

      
      let el = K.gid('chatVolumeSlider').parentElement;
      parent = el.parentElement.parentElement;
      parent.insertBefore(el, parent.firstChild);
      parent.insertBefore(K.gid('sfxVolumeSlider').parentElement, parent.firstChild);
      parent.insertBefore(K.gid('musicVolumeSlider').parentElement, parent.firstChild);

      let sliderParent = K.gid('activityTrackerWindowSlider').parentElement.parentElement;

      parent.insertBefore(K.gid('planeSlider').parentElement, sliderParent);

      el = K.gid('em3d').parentElement.parentElement;
      el.getElementsByTagName('span')[0].innerHTML = 'EM Images in 3D';
      el.style.marginTop = '-5px';
      parent.insertBefore(el, sliderParent);

      $('#colorSlider').parent().unwrap();

      K.gid('heatmaplegendspref').parentElement.parentElement.getElementsByTagName('span')[0].innerHTML = 'Heatmap Legend';
      K.gid('downsampleAmount').parentElement.parentElement.getElementsByTagName('span')[0].innerHTML = '3D Smoothing (ZFish)';

      let preloadCubes = K.gid('preloadCubes').parentElement.parentElement;
      preloadCubes.style.display = 'block';

      let preloadCubesTitle = preloadCubes.getElementsByTagName('span')[0];
      preloadCubesTitle.style.display = 'inline-block';
      preloadCubesTitle.style.marginLeft = '30px';
      preloadCubesTitle.innerHTML = 'Preload cubes';

      newTitle = document.createElement('div');
      newTitle.innerHTML = 'Experimental Features';
      newTitle.style.fontWeight = '800';
      newTitle.style.marginBottom = '15px';
      preloadCubesTitle.parentElement.insertBefore(newTitle, preloadCubesTitle);

      let experimentalFeaturesTitle = K.gid('experimentalFeatures').parentElement.parentElement.getElementsByTagName('span')[0];
      experimentalFeaturesTitle.style.display = 'inline-block';
      experimentalFeaturesTitle.style.marginLeft = '30px';
      experimentalFeaturesTitle.innerHTML = 'Enable 3D select (f key)';


      let playerActivityIcons = K.gid('playerActivityIcons').parentElement.parentElement;
      playerActivityIcons.style.display = 'block';

      let playerActivityIconsTitle = playerActivityIcons.getElementsByTagName('span')[0];
      playerActivityIconsTitle.style.display = 'inline-block';
      playerActivityIconsTitle.style.marginLeft = '30px';

      newTitle = document.createElement('div');
      newTitle.innerHTML = 'Live Overview';
      newTitle.style.fontWeight = '800';
      newTitle.style.marginBottom = '15px';
      playerActivityIconsTitle.parentElement.insertBefore(newTitle, playerActivityIconsTitle);

      let playerAnonActivityIconsTitle = K.gid('playerAnonActivityIcons').parentElement.parentElement.getElementsByTagName('span')[0];
      playerAnonActivityIconsTitle.style.display = 'inline-block';
      playerAnonActivityIconsTitle.style.marginLeft = '30px';

      let outlineGlowSliderTitle = K.gid('outlineGlowSlider').parentElement.getElementsByTagName('span')[0];
      outlineGlowSliderTitle.style.display = 'inline-block';
      outlineGlowSliderTitle.style.marginLeft = '30px';
    }
  });

  

  let cameraProps, tomniRotation, threeDZoom;

  function save() {
    if (!settings.getValue('dont-rotate-ov-while-in-cube')) {
      return;
    }

    let camera = tomni.threeD.getCamera();

    tomniRotation = {
      x: tomni.center.rotation.x,
      y: tomni.center.rotation.y,
      z: tomni.center.rotation.z
    };

    threeDZoom = tomni.threeD.zoom;

    cameraProps = {
      position: {
        x: camera.position.x,
        y: camera.position.y,
        z: camera.position.z
      },
      rotation: {
        x: camera.rotation.x,
        y: camera.rotation.y,
        z: camera.rotation.z
      },
      up: {
        x: camera.up.x,
        y: camera.up.y,
        z: camera.up.z
      },
      fov: camera.fov
    };
   }

  function restore() {
    if (!settings.getValue('dont-rotate-ov-while-in-cube')) {
      return;
    }

    let camera = tomni.threeD.getCamera();
 
    camera.fov = cameraProps.fov;
    camera.position.set(cameraProps.position.x, cameraProps.position.y, cameraProps.position.z);
    camera.rotation.set(cameraProps.rotation.x, cameraProps.rotation.y, cameraProps.rotation.z);
    camera.up.set(cameraProps.up.x, cameraProps.up.y, cameraProps.up.z);
    tomni.center.rotation.set(tomniRotation.x, tomniRotation.y, tomniRotation.z);
    tomni.threeD.zoom = threeDZoom;
    camera.updateProjectionMatrix();
    tomni.forceRedraw();
  }

  $(document).on('cube-enter-triggered.utilities', save);
  $(document).on('cube-leave-triggered.utilities', restore);


  let intv = setInterval(function () {
    if (typeof account === 'undefined' || !account.account.uid) {
      return;
    }
    clearInterval(intv);
    main();
  }, 100);


})();
