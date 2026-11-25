/* VolleyLive Settings controller. Spec: docs/VolleyLive_Navigation_Home_Specification.md (Settings) */
(function(){
  var shell=window.VolleyShell;if(!shell)return;
  var $=shell.$,settingsGet=shell.settingsGet,settingsPut=shell.settingsPut,show=shell.show,home=shell.screens.home,settings=shell.screens.settings;
  var CFG=settingsGet();
  function renderSettings(){var h='<div class="su-card"><label class="field-label">Match format</label><div class="su-format"><button type="button" class="su-btn'+(CFG.setsToWin===2?' sel':'')+'" data-setting-format="2">2 WINNING SETS<small>best of 3 · set 3 to 15</small></button><button type="button" class="su-btn'+(CFG.setsToWin===3?' sel':'')+'" data-setting-format="3">3 WINNING SETS<small>best of 5 · set 5 to 15</small></button></div></div>';$('settingsBody').innerHTML=h;$('settingsMsg').textContent=''}
  $('homeSettings').addEventListener('click',function(){CFG=settingsGet();renderSettings();show(settings)});$('settingsBack').addEventListener('click',function(){show(home);$('homeSettings').focus()});
  $('settingsBody').addEventListener('click',function(e){var t=e.target.closest('[data-setting-format]');if(t){CFG.setsToWin=+t.dataset.settingFormat;renderSettings()}});$('settingsSave').addEventListener('click',function(){settingsPut(CFG);$('settingsMsg').textContent='Settings saved.'});
})();
