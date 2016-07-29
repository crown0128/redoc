;(function() {
  'use strict';

  var schemaUrlForm = document.getElementById('schema-url-form');
  var schemaUrlInput;

  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
    document.getElementsByTagName('redoc')[0].setAttribute('spec-url', url);
  }

  function updateQueryStringParameter(uri, key, value) {
    var re = new RegExp("([?|&])" + key + "=.*?(&|#|$)", "i");
    if (uri.match(re)) {
      return uri.replace(re, '$1' + key + "=" + value + '$2');
    } else {
      var hash =  '';
      if( uri.indexOf('#') !== -1 ){
          hash = uri.replace(/.*#/, '#');
          uri = uri.replace(/#.*/, '');
      }
      var separator = uri.indexOf('?') !== -1 ? "&" : "?";
      return uri + separator + key + "=" + value + hash;
    }
  }

  var specs = document.querySelector('#specs');
  specs.addEventListener('dom-change', function() {
    schemaUrlForm = document.getElementById('schema-url-form');
    schemaUrlInput = document.getElementById('schema-url-input');

    schemaUrlForm.addEventListener('submit', function(event) {
      console.log('test')
      event.preventDefault();
      event.stopPropagation();
      location.search = updateQueryStringParameter(location.search, 'url', schemaUrlInput.value)
      return false;
    })

    schemaUrlInput.addEventListener('mousedown', function(e) {
      e.stopPropagation();
    });
    schemaUrlInput.value = url;
    specs.specs = [
      'https://api.apis.guru/v2/specs/instagram.com/1.0.0/swagger.yaml',
      'https://api.apis.guru/v2/specs/googleapis.com/calendar/v3/swagger.yaml',
      'https://api.apis.guru/v2/specs/data2crm.com/1/swagger.yaml',
      'https://api.apis.guru/v2/specs/graphhopper.com/1.0/swagger.yaml'
    ];
    var $specInput = document.getElementById('spec-input');
    $specInput.addEventListener('value-changed', function(e) {
      schemaUrlInput.value = e.detail.value;
      location.search = updateQueryStringParameter(location.search, 'url', schemaUrlInput.value);
    });
  });
  //window.redocDebugMode = true;
})();
