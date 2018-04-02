// ==UserScript==
// @name         Utilities
// @namespace    http://tampermonkey.net/
// @version      1.7.1.2
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
      let state = storedState === null ? settings.defaultState : storedState.toLowerCase() === 'true';

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
      $("#nav ul a:contains('" + text + "')").parent().show();
    }
    else {
      $("#nav ul a:contains('" + text + "')").parent().hide();
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


  // we have to wait for the bottom-right corner icons to be added to the page
  let intv3 = setInterval(function () {
    if (!K.gid('gameTools')) {
      return;
    }

    if (account.can('scout scythe mystic admin') && !K.gid('scoutsLogButton')) {
      return;
    }
    
    // sometimes the main() function isn't run yet, so the settings object isn't initiated,
    // and the SL aren't buttons aren't set correctly
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
    }
  });


  let settings;

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
      K.addCSSFile('https://chrisraven.github.io/EyeWire-Utilities/styles.css?v=2');
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
      })
    }
    
    settings.addOption({
      name: 'Show Dataset Borders button',
      id: 'show-dataset-borders-button',
      defaultState: true
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


  let intv = setInterval(function () {
    if (typeof account === 'undefined' || !account.account.uid) {
      return;
    }
    clearInterval(intv);
    main();
  }, 100);


})();
