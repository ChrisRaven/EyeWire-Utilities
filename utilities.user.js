// ==UserScript==
// @name         Utilities
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Utilities for EyeWire
// @author       Krzysztof Kruk
// @match        https://*.eyewire.org/*
// @exclude      https://*.eyewire.org/1.0/*
// @downloadURL  https://raw.githubusercontent.com/ChrisRaven/EyeWire-Utilities/master/utilities.user.js
// ==/UserScript==

/*jshint esversion: 6 */
/*globals $, account, tomni */

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
  }

  if (state) {
    $("#nav ul a:contains('" + text + "')").parent().show();
  }
  else {
    $("#nav ul a:contains('" + text + "')").parent().hide();
  }
}
  
  
// SETTINGS
var EwsSettings = function () {
  // var intv;
  var _this = this;
  var settings = {
    'ews-auto-refresh-showmeme': false,
    'ews-submit-using-spacebar': false,
    'ew-hide-blog': true,
    'ew-hide-wiki': true,
    'ew-hide-forum': true,
    'ew-hide-about': true,
    'ew-hide-faq': true,
    'ew-hide-stats': true
  };

  var stored = K.ls.get('settings');
  if(stored) {
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
      <div class="setting">
        <span>` + name + `</span>
        <div class="checkbox">
          <div class="checkbox-handle"></div>
          <input type="checkbox" id="` + id + `" style="display: none;">
        </div>
      </div>
    `);
  }

  if (account.roles.scythe || account.roles.mystic || account.roles.admin) {
    add('Auto Refresh ShowMeMe', 'ews-auto-refresh-showmeme');
  }

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
  $('#ews-settings-group input, #ews-settings-group-top-buttons input').each(function() {
    var
      elem, pref, sets;

    elem = $(this);
    pref = this.id;
    sets = _this.getAll();

    this.checked = sets[pref];
    elem.add(elem.closest('.checkbox')).removeClass(sets[pref] ? 'off' : 'on').addClass(sets[pref] ? 'on' : 'off');
    $(document).trigger('ews-setting-changed', {setting: pref, state: sets[pref]});
  });

  $('#ews-settings-group input, #ews-settings-group-top-buttons input').closest('div.setting').click(function(evt) {
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

$(document).on('ews-setting-changed', function (evt, data) {
    showOrHideButton(data.setting, data.state);
});
// end: SETTINGS


if (LOCAL) {
  K.addCSSFile('http://127.0.0.1:8887/styles.css');
}
else {
  K.addCSSFile('https://chrisraven.github.io/EyeWire-Utilities/styles.css?v=1');
}


K.injectJS(`
  (function (open) {
    XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
      this.addEventListener("readystatechange", function (evt) {
        if (this.readyState == 4 && this.status == 200 &&
            url.indexOf('/1.0/task/') !== -1 &&
            url.indexOf('/submit') === -1 &&
            method.toLowerCase() === 'post') {
          $(document).trigger('votes-updated', {cellId: tomni.cell, cellName: tomni.getCurrentCell().info.name, datasetId: tomni.getCurrentCell().info.dataset_id});
        }
      }, false);
      open.call(this, method, url, async, user, pass);
    };
  }) (XMLHttpRequest.prototype.open);
`);


var settings = new EwsSettings();  


$(document).on('votes-updated', function (event, data) {
  var
    btn = $('.showmeme button');

  if (!btn.hasClass('on1')) {
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
