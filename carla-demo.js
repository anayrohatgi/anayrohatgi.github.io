// Demo picker for carla-lidar.html.
// The page works without this file: every scenario is listed one after another. With it, the
// scenarios collapse behind selectors: a map and scenario (pick one each) and any of the four
// drivers (tick one to four to compare them side by side).
(function () {
  var demo = document.getElementById('demo');
  if (!demo) return;
  var figs = demo.querySelectorAll('.scenario');
  if (!figs.length) return;

  function pause(root) {
    root.querySelectorAll('video').forEach(function (v) { v.pause(); });
  }

  // Play-all button: restart every visible clip in that scenario at the same moment.
  figs.forEach(function (fig) {
    var btn = fig.querySelector('.play-all');
    btn.addEventListener('click', function () {
      fig.querySelectorAll('.clip:not([hidden]) video').forEach(function (v) {
        v.currentTime = 0;
        var p = v.play();
        if (p && p.catch) p.catch(function () {});   // a missing clip just stays blank
      });
    });
  });

  // Group the scenarios under the map heading that precedes them.
  var maps = [];
  Array.prototype.forEach.call(demo.children, function (el) {
    if (el.classList.contains('town')) {
      var blurb = el.querySelector('span');
      maps.push({
        name: el.firstChild.textContent.trim(),
        blurb: blurb ? blurb.textContent.trim() : '',
        scenarios: []
      });
    } else if (el.classList.contains('scenario') && maps.length) {
      var strong = el.querySelector('figcaption strong');
      maps[maps.length - 1].scenarios.push({
        fig: el,
        label: strong ? strong.textContent.replace(/\.$/, '') : el.id
      });
    }
  });
  if (!maps.length) return;

  // Drivers: clips appear in the same order as the entries in the key below the demo.
  var keyItems = demo.querySelectorAll('.demo-key > div');
  var models = Array.prototype.map.call(figs[0].querySelectorAll('.clip-name'), function (p, i) {
    var dd = keyItems[i] && keyItems[i].querySelector('dd');
    return { name: p.textContent.trim(), note: dd ? dd.textContent.trim() : '' };
  });
  var allModels = models.map(function (m, i) { return i; });

  var state = { map: 0, scen: 0, models: allModels.slice() };

  // A link like carla-lidar.html#town05-sc09 opens that scenario.
  var wanted = location.hash.slice(1);
  var deepLinked = false;
  maps.forEach(function (m, mi) {
    m.scenarios.forEach(function (s, si) {
      if (s.fig.id === wanted) { state.map = mi; state.scen = si; deepLinked = true; }
    });
  });

  // One group of real radio or checkbox inputs, so arrow keys, Space and screen readers work natively.
  function optionGroup(legend, type, name, options, checkedValues, onChange) {
    var fs = document.createElement('fieldset');
    var lg = document.createElement('legend');
    lg.textContent = legend;
    fs.appendChild(lg);
    var seg = document.createElement('div');
    seg.className = 'seg';
    options.forEach(function (o) {
      var label = document.createElement('label');
      var input = document.createElement('input');
      input.type = type;
      input.name = name;
      input.value = o.value;
      input.checked = checkedValues.indexOf(o.value) !== -1;
      input.addEventListener('change', function () {
        if (type === 'radio' && !input.checked) return;
        onChange(o.value, input);
      });
      var opt = document.createElement('span');
      opt.className = 'opt';
      opt.textContent = o.label;
      if (o.hint) {
        var small = document.createElement('small');
        small.textContent = o.hint;
        opt.appendChild(small);
      }
      label.appendChild(input);
      label.appendChild(opt);
      seg.appendChild(label);
    });
    fs.appendChild(seg);
    return fs;
  }

  var picker = document.createElement('div');
  picker.className = 'picker';
  var note = document.createElement('div');
  note.className = 'model-note';
  note.hidden = true;

  var scenarioGroup;
  function buildScenarioGroup() {
    var next = optionGroup('Scenario', 'radio', 'demo-scenario',
      maps[state.map].scenarios.map(function (s, i) { return { value: String(i), label: s.label }; }),
      [String(state.scen)],
      function (v) { state.scen = Number(v); apply(true); });
    if (scenarioGroup) picker.replaceChild(next, scenarioGroup);
    else picker.appendChild(next);
    scenarioGroup = next;
  }

  picker.appendChild(optionGroup('Map', 'radio', 'demo-map',
    maps.map(function (m, i) { return { value: String(i), label: m.name, hint: m.blurb }; }),
    [String(state.map)],
    function (v) { state.map = Number(v); state.scen = 0; buildScenarioGroup(); apply(true); }));
  buildScenarioGroup();

  var modelGroup = optionGroup('Drivers (tick the ones to compare)', 'checkbox', 'demo-model',
    models.map(function (m, i) { return { value: String(i), label: m.name }; }),
    allModels.map(String),
    function (v, input) {
      var boxes = modelGroup.querySelectorAll('input');
      var picked = [];
      boxes.forEach(function (b, i) { if (b.checked) picked.push(i); });
      if (!picked.length) { input.checked = true; return; }   // always keep at least one driver
      state.models = picked;
      apply(true);
    });
  var showAll = document.createElement('button');
  showAll.type = 'button';
  showAll.className = 'seg-all';
  showAll.textContent = 'Show all ' + models.length;
  showAll.addEventListener('click', function () {
    modelGroup.querySelectorAll('input').forEach(function (b) { b.checked = true; });
    state.models = allModels.slice();
    apply(true);
  });
  modelGroup.appendChild(showAll);
  picker.appendChild(modelGroup);

  var PLAY_LABEL = { 2: 'Play both', 3: 'Play all three', 4: 'Play all four' };

  function apply(fromUser) {
    var current = maps[state.map].scenarios[state.scen];
    maps.forEach(function (m) {
      m.scenarios.forEach(function (s) {
        if (s !== current) pause(s.fig);
        s.fig.hidden = s !== current;
      });
    });

    var count = state.models.length;
    current.fig.querySelectorAll('.clip').forEach(function (clip, i) {
      var show = state.models.indexOf(i) !== -1;
      if (!show) pause(clip);
      clip.hidden = !show;
    });
    var clips = current.fig.querySelector('.clips');
    clips.classList.toggle('clips--single', count === 1);
    clips.classList.toggle('clips--three', count === 3);
    var play = current.fig.querySelector('.play-all');
    play.hidden = count === 1;
    play.textContent = PLAY_LABEL[count] || 'Play all';
    showAll.hidden = count === models.length;

    // With fewer than all drivers on screen, describe the ones that are (the full key sits below the demo).
    note.hidden = count === models.length;
    note.textContent = '';
    if (!note.hidden) {
      state.models.forEach(function (i) {
        var p = document.createElement('p');
        var strong = document.createElement('strong');
        strong.textContent = models[i].name + '. ';
        p.appendChild(strong);
        p.appendChild(document.createTextNode(models[i].note));
        note.appendChild(p);
      });
    }

    if (fromUser) {
      try { history.replaceState(null, '', '#' + current.fig.id); } catch (e) { /* file:// */ }
    }
  }

  // Following a #townNN-scNN link while already on the page switches the picker to that scenario.
  window.addEventListener('hashchange', function () {
    var id = location.hash.slice(1);
    maps.forEach(function (m, mi) {
      m.scenarios.forEach(function (s, si) {
        if (s.fig.id !== id) return;
        state.map = mi;
        state.scen = si;
        picker.querySelector('input[name="demo-map"][value="' + mi + '"]').checked = true;
        buildScenarioGroup();
        apply(false);
      });
    });
  });

  demo.classList.add('demo-js');
  var firstTown = demo.querySelector('.town');
  demo.insertBefore(picker, firstTown);
  demo.insertBefore(note, firstTown);
  apply(false);
  if (deepLinked) demo.scrollIntoView();
})();
